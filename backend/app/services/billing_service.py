from __future__ import annotations
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database.models import Payment, ProviderWebhookEvent, SubscriptionPlan, User, UserSubscription
from app.payments import payment_provider_registry
from app.services.subscription_service import SubscriptionService
class BillingServiceError(Exception):
    """Base billing service error."""
class PaymentConflictError(BillingServiceError):
    """Raised when a payment conflicts with an existing payment."""
class PaymentNotFoundError(BillingServiceError):
    """Raised when a payment cannot be found."""
class BillingService:
    VALID_STATUSES = {
        "pending",
        "requires_action",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
    }
    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")
        self.db = db
    @staticmethod
    def _utc_now() -> datetime:
        return datetime.now(timezone.utc)
    def reserve_provider_webhook_event(
        self,
        *,
        provider: str,
        event_id: str,
        event_type: str,
    ) -> tuple[ProviderWebhookEvent, bool]:
        """
        Atomically reserve a provider webhook event.

        Returns:
            (event, True) when this is the first reservation.
            (event, False) when the provider/event ID already exists.
        """
        provider = self._required_string(
            provider,
            field_name="provider",
            max_length=50,
        ).lower()

        event_id = self._required_string(
            event_id,
            field_name="event_id",
            max_length=255,
        )

        event_type = self._required_string(
            event_type,
            field_name="event_type",
            max_length=100,
        )

        webhook_event = ProviderWebhookEvent(
            provider=provider,
            event_id=event_id,
            event_type=event_type,
            status="received",
            received_at=self._utc_now(),
            processed_at=None,
        )

        self.db.add(webhook_event)

        try:
            self.db.commit()
            self.db.refresh(webhook_event)
            return webhook_event, True

        except IntegrityError:
            self.db.rollback()

            existing = self.db.scalar(
                select(ProviderWebhookEvent)
                .where(
                    ProviderWebhookEvent.provider
                    == provider,
                    ProviderWebhookEvent.event_id
                    == event_id,
                )
            )

            if existing is None:
                raise PaymentConflictError(
                    "Webhook event reservation conflict.",
                )

            # A processed event is permanently idempotent.
            if existing.status == "processed":
                return existing, False

            # Reclaim an abandoned reservation after five minutes.
            lease_cutoff = self._utc_now() - timedelta(minutes=5)

            if existing.received_at > lease_cutoff:
                return existing, False

            previous_received_at = existing.received_at
            reclaimed_at = self._utc_now()

            statement = (
                update(ProviderWebhookEvent)
                .where(
                    ProviderWebhookEvent.id == existing.id,
                    ProviderWebhookEvent.status == "received",
                    ProviderWebhookEvent.received_at
                    == previous_received_at,
                )
                .values(
                    event_type=event_type,
                    received_at=reclaimed_at,
                    processed_at=None,
                )
            )

            result = self.db.execute(statement)

            if result.rowcount != 1:
                self.db.rollback()

                current = self.db.get(
                    ProviderWebhookEvent,
                    existing.id,
                )

                if current is None:
                    raise PaymentConflictError(
                        "Webhook reservation disappeared.",
                    )

                return current, False

            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

            reclaimed = self.db.get(
                ProviderWebhookEvent,
                existing.id,
            )

            if reclaimed is None:
                raise PaymentConflictError(
                    "Webhook reservation disappeared.",
                )

            return reclaimed, True

    def mark_provider_webhook_event_processed(
        self,
        *,
        webhook_event_id: int,
    ) -> ProviderWebhookEvent:
        webhook_event_id = self._positive_integer(
            webhook_event_id,
            field_name="webhook_event_id",
        )

        webhook_event = self.db.get(
            ProviderWebhookEvent,
            webhook_event_id,
        )

        if webhook_event is None:
            raise PaymentNotFoundError(
                "Webhook event not found.",
            )

        if webhook_event.status == "processed":
            return webhook_event

        webhook_event.status = "processed"
        webhook_event.processed_at = self._utc_now()

        try:
            self.db.commit()
            self.db.refresh(webhook_event)
        except Exception:
            self.db.rollback()
            raise

        return webhook_event

    def get_payment(
        self,
        payment_id: int,
    ) -> Payment | None:
        payment_id = self._positive_integer(
            payment_id,
            field_name="payment_id",
        )
        return self.db.get(
            Payment,
            payment_id,
        )
    def get_by_idempotency_key(
        self,
        idempotency_key: str,
    ) -> Payment | None:
        key = self._required_string(
            idempotency_key,
            field_name="idempotency_key",
            max_length=255,
        )
        statement = select(Payment).where(
            Payment.idempotency_key == key,
        )
        return self.db.scalar(statement)
    def get_by_provider_subscription_id(
        self,
        *,
        provider: str,
        provider_subscription_id: str,
    ) -> Payment | None:
        provider = self._normalize_provider(provider)
        external_id = self._required_string(
            provider_subscription_id,
            field_name="provider_subscription_id",
            max_length=255,
        )
        statement = (
            select(Payment)
            .where(
                Payment.provider == provider,
                Payment.provider_subscription_id == external_id,
            )
            .order_by(Payment.id.desc())
        )
        return self.db.scalar(statement)
    def get_by_provider_payment_id(
        self,
        *,
        provider: str,
        provider_payment_id: str,
    ) -> Payment | None:
        provider = self._normalize_provider(provider)
        external_id = self._required_string(
            provider_payment_id,
            field_name="provider_payment_id",
            max_length=255,
        )
        statement = select(Payment).where(
            Payment.provider == provider,
            Payment.provider_payment_id == external_id,
        )
        return self.db.scalar(statement)
    def create_payment(
        self,
        *,
        user_id: int,
        plan_id: int,
        provider: str,
        amount_minor: int,
        currency: str,
        idempotency_key: str,
        provider_payment_id: str | None = None,
        provider_customer_id: str | None = None,
        provider_subscription_id: str | None = None,
        status: str = "pending",
    ) -> Payment:
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        plan_id = self._positive_integer(
            plan_id,
            field_name="plan_id",
        )
        provider = self._normalize_provider(provider)
        amount_minor = self._non_negative_integer(
            amount_minor,
            field_name="amount_minor",
        )
        currency = self._normalize_currency(currency)
        idempotency_key = self._required_string(
            idempotency_key,
            field_name="idempotency_key",
            max_length=255,
        )
        status = self._normalize_status(status)
        provider_payment_id = self._optional_string(
            provider_payment_id,
            field_name="provider_payment_id",
            max_length=255,
        )
        provider_customer_id = self._optional_string(
            provider_customer_id,
            field_name="provider_customer_id",
            max_length=255,
        )
        provider_subscription_id = self._optional_string(
            provider_subscription_id,
            field_name="provider_subscription_id",
            max_length=255,
        )
        existing = self.get_by_idempotency_key(
            idempotency_key,
        )
        if existing is not None:
            return existing
        user = self.db.get(
            User,
            user_id,
        )
        if user is None:
            raise ValueError("User not found.")
        plan = self.db.get(
            SubscriptionPlan,
            plan_id,
        )
        if plan is None:
            raise ValueError("Subscription plan not found.")
        payment = Payment(
            user_id=user_id,
            plan_id=plan_id,
            provider=provider,
            provider_payment_id=provider_payment_id,
            provider_customer_id=provider_customer_id,
            provider_subscription_id=provider_subscription_id,
            status=status,
            amount_minor=amount_minor,
            currency=currency,
            idempotency_key=idempotency_key,
            failure_code=None,
            failure_message=None,
            paid_at=(
                self._utc_now()
                if status == "succeeded"
                else None
            ),
            created_at=self._utc_now(),
            updated_at=self._utc_now(),
        )
        self.db.add(payment)
        try:
            self.db.commit()
            self.db.refresh(payment)
        except IntegrityError as exc:
            self.db.rollback()
            existing = self.get_by_idempotency_key(
                idempotency_key,
            )
            if existing is not None:
                return existing
            raise PaymentConflictError(
                "Payment conflicts with an existing payment.",
            ) from exc
        except Exception:
            self.db.rollback()
            raise
        return payment
    def update_payment_status(
        self,
        *,
        payment_id: int,
        status: str,
        provider_payment_id: str | None = None,
        provider_customer_id: str | None = None,
        provider_subscription_id: str | None = None,
        failure_code: str | None = None,
        failure_message: str | None = None,
    ) -> Payment:
        payment_id = self._positive_integer(
            payment_id,
            field_name="payment_id",
        )
        status = self._normalize_status(status)
        payment = self.get_payment(
            payment_id,
        )
        if payment is None:
            raise PaymentNotFoundError(
                "Payment not found.",
            )
        if provider_payment_id is not None:
            payment.provider_payment_id = self._required_string(
                provider_payment_id,
                field_name="provider_payment_id",
                max_length=255,
            )
        if provider_customer_id is not None:
            payment.provider_customer_id = self._required_string(
                provider_customer_id,
                field_name="provider_customer_id",
                max_length=255,
            )
        if provider_subscription_id is not None:
            payment.provider_subscription_id = self._required_string(
                provider_subscription_id,
                field_name="provider_subscription_id",
                max_length=255,
            )
        payment.status = status
        if status == "succeeded":
            if payment.paid_at is None:
                payment.paid_at = self._utc_now()
            payment.failure_code = None
            payment.failure_message = None
        elif status == "failed":
            payment.failure_code = self._optional_string(
                failure_code,
                field_name="failure_code",
                max_length=100,
            )
            payment.failure_message = self._optional_string(
                failure_message,
                field_name="failure_message",
                max_length=500,
            )
        payment.updated_at = self._utc_now()
        try:
            self.db.commit()
            self.db.refresh(payment)
        except IntegrityError as exc:
            self.db.rollback()
            raise PaymentConflictError(
                "Payment update conflicts with an existing payment.",
            ) from exc
        except Exception:
            self.db.rollback()
            raise
        return payment
    def finalize_successful_payment(
        self,
        *,
        payment_id: int,
        provider_payment_id: str,
        provider_customer_id: str | None = None,
        provider_subscription_id: str | None = None,
    ) -> Payment:
        payment_id = self._positive_integer(
            payment_id,
            field_name="payment_id",
        )
        payment = self.get_payment(
            payment_id,
        )
        if payment is None:
            raise PaymentNotFoundError(
                "Payment not found.",
            )
        provider_payment_id = self._required_string(
            provider_payment_id,
            field_name="provider_payment_id",
            max_length=255,
        )
        provider_customer_id = self._optional_string(
            provider_customer_id,
            field_name="provider_customer_id",
            max_length=255,
        )
        provider_subscription_id = self._optional_string(
            provider_subscription_id,
            field_name="provider_subscription_id",
            max_length=255,
        )
        # Idempotent success handling.
        if payment.status == "succeeded":
            if (
                payment.provider_payment_id
                and payment.provider_payment_id != provider_payment_id
            ):
                raise PaymentConflictError(
                    "Provider payment ID does not match "
                    "the completed payment.",
                )
            return payment
        if payment.status in {
            "cancelled",
            "refunded",
        }:
            raise PaymentConflictError(
                f"Cannot complete payment with status "
                f"{payment.status}.",
            )
        plan = self.db.get(
            SubscriptionPlan,
            payment.plan_id,
        )
        if plan is None:
            raise ValueError(
                "Subscription plan not found.",
            )
        if float(plan.monthly_price) <= 0:
            raise PaymentConflictError(
                "Paid payment cannot activate a free plan.",
            )
        payment.provider_payment_id = provider_payment_id
        if provider_customer_id is not None:
            payment.provider_customer_id = provider_customer_id
        if provider_subscription_id is not None:
            payment.provider_subscription_id = (
                provider_subscription_id
            )
        payment.status = "succeeded"
        if payment.paid_at is None:
            payment.paid_at = self._utc_now()
        payment.failure_code = None
        payment.failure_message = None
        payment.updated_at = self._utc_now()
        subscription_service = SubscriptionService(
            self.db,
        )
        try:
            current_subscription = (
                subscription_service.get_active_subscription(
                    payment.user_id,
                )
            )
            if (
                current_subscription is None
                or current_subscription.plan_id != payment.plan_id
            ):
                now = self._utc_now()
                active_subscriptions = (
                    self.db.query(UserSubscription)
                    .filter(
                        UserSubscription.user_id == payment.user_id,
                        UserSubscription.status == "active",
                    )
                    .all()
                )
                for subscription in active_subscriptions:
                    if subscription.plan_id != payment.plan_id:
                        previous_payment = (
                            self.db.query(Payment)
                            .filter(
                                Payment.user_id == payment.user_id,
                                Payment.plan_id == subscription.plan_id,
                                Payment.provider == payment.provider,
                                Payment.status == "succeeded",
                                Payment.provider_subscription_id.is_not(None),
                            )
                            .order_by(Payment.id.desc())
                            .first()
                        )

                        if (
                            previous_payment is not None
                            and previous_payment.provider_subscription_id
                            and previous_payment.provider_subscription_id
                            != provider_subscription_id
                        ):
                            provider = payment_provider_registry.get(
                                payment.provider,
                            )
                            provider.cancel_subscription(
                                previous_payment.provider_subscription_id,
                            )

                    subscription.status = "cancelled"
                    subscription.ends_at = now
                    subscription.auto_renew = False
                new_subscription = UserSubscription(
                    user_id=payment.user_id,
                    plan_id=payment.plan_id,
                    status="active",
                    starts_at=now,
                    ends_at=None,
                    auto_renew=bool(
                        provider_subscription_id,
                    ),
                )
                self.db.add(
                    new_subscription,
                )
            self.db.commit()
            self.db.refresh(payment)
        except IntegrityError as exc:
            self.db.rollback()
            raise PaymentConflictError(
                "Payment completion conflicts "
                "with an existing payment.",
            ) from exc
        except Exception:
            self.db.rollback()
            raise
        return payment

    def reconcile_payment(
        self,
        payment_id: int,
    ) -> Payment:
        """
        Reconcile one local payment against its payment provider.
        This is intended to recover safely from delayed or failed
        webhook delivery without trusting local pending state alone.
        """
        payment_id = self._positive_integer(
            payment_id,
            field_name="payment_id",
        )
        payment = self.get_payment(payment_id)
        if payment is None:
            raise PaymentNotFoundError(
                "Payment not found.",
            )
        if payment.status in {
            "succeeded",
            "failed",
            "cancelled",
            "refunded",
        }:
            return payment
        if not payment.provider_payment_id:
            return payment
        provider = payment_provider_registry.get(
            payment.provider,
        )
        checkout = provider.retrieve_checkout(
            payment.provider_payment_id,
        )
        if (
            checkout.provider_payment_id
            != payment.provider_payment_id
        ):
            raise PaymentConflictError(
                "Provider checkout ID mismatch.",
            )
        metadata = dict(checkout.metadata or {})
        metadata_payment_id = metadata.get(
            "payment_id",
        )
        if (
            metadata_payment_id is not None
            and metadata_payment_id != str(payment.id)
        ):
            raise PaymentConflictError(
                "Provider checkout payment metadata mismatch.",
            )
        metadata_user_id = metadata.get(
            "user_id",
        )
        if (
            metadata_user_id is not None
            and metadata_user_id != str(payment.user_id)
        ):
            raise PaymentConflictError(
                "Provider checkout user metadata mismatch.",
            )
        if (
            checkout.amount_minor is not None
            and checkout.amount_minor
            != payment.amount_minor
        ):
            raise PaymentConflictError(
                "Provider checkout amount mismatch.",
            )
        if (
            checkout.currency is not None
            and checkout.currency.upper()
            != payment.currency.upper()
        ):
            raise PaymentConflictError(
                "Provider checkout currency mismatch.",
            )
        if checkout.status == "succeeded":
            return self.finalize_successful_payment(
                payment_id=payment.id,
                provider_payment_id=(
                    checkout.provider_payment_id
                ),
                provider_customer_id=(
                    checkout.provider_customer_id
                ),
                provider_subscription_id=(
                    checkout.provider_subscription_id
                ),
            )
        if checkout.status == "cancelled":
            return self.update_payment_status(
                payment_id=payment.id,
                status="cancelled",
            )
        if checkout.status == "processing":
            return self.update_payment_status(
                payment_id=payment.id,
                status="processing",
                provider_customer_id=(
                    checkout.provider_customer_id
                ),
                provider_subscription_id=(
                    checkout.provider_subscription_id
                ),
            )
        return payment
    def cancel_active_subscription(
        self,
        user_id: int,
    ) -> UserSubscription:
        """
        Schedule cancellation of the user's active paid
        subscription at the end of the current billing period.
        Paid access remains active until the provider confirms
        that the subscription has ended.
        """
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        subscription_service = SubscriptionService(
            self.db,
        )
        current_subscription = (
            subscription_service.get_active_subscription(
                user_id,
            )
        )
        if current_subscription is None:
            raise PaymentConflictError(
                "No active subscription.",
            )
        if float(
            current_subscription.plan.monthly_price
        ) <= 0:
            return current_subscription
        payment = (
            self.db.query(Payment)
            .filter(
                Payment.user_id == user_id,
                Payment.plan_id
                == current_subscription.plan_id,
                Payment.status == "succeeded",
                Payment.provider_subscription_id.is_not(
                    None,
                ),
            )
            .order_by(Payment.id.desc())
            .first()
        )
        if (
            payment is None
            or not payment.provider_subscription_id
        ):
            raise PaymentConflictError(
                "Active paid subscription has no "
                "provider subscription.",
            )
        provider = payment_provider_registry.get(
            payment.provider,
        )
        provider.cancel_subscription(
            payment.provider_subscription_id,
        )

        # Provider cancellation is scheduled for the end of the
        # already-paid billing period. Keep paid access active locally.
        current_subscription.auto_renew = False
        current_subscription.updated_at = self._utc_now()

        try:
            self.db.commit()
            self.db.refresh(current_subscription)
        except Exception:
            self.db.rollback()
            raise

        return current_subscription
    def sync_provider_subscription_update(
        self,
        *,
        payment_id: int,
        provider_subscription_id: str,
        provider_status: str,
        cancel_at_period_end: bool,
        current_period_end: int | None,
    ) -> UserSubscription | None:
        """
        Synchronize an existing active local paid subscription with
        provider lifecycle data.

        This method never activates a paid plan. If the user has
        already moved to another plan, the event is treated as stale.
        """
        payment_id = self._positive_integer(
            payment_id,
            field_name="payment_id",
        )

        subscription_id = self._required_string(
            provider_subscription_id,
            field_name="provider_subscription_id",
            max_length=255,
        )

        normalized_provider_status = self._required_string(
            provider_status,
            field_name="provider_status",
            max_length=50,
        ).lower()

        payment = self.get_payment(
            payment_id,
        )

        if payment is None:
            raise PaymentNotFoundError(
                "Payment not found.",
            )

        if (
            payment.provider_subscription_id
            != subscription_id
        ):
            raise PaymentConflictError(
                "Provider subscription ID mismatch.",
            )

        subscription_service = SubscriptionService(
            self.db,
        )

        current = (
            subscription_service.get_active_subscription(
                payment.user_id,
            )
        )

        # A deleted/newer event may already have moved the user
        # to Free or another plan. Never reactivate an old paid plan.
        if (
            current is None
            or current.plan_id != payment.plan_id
        ):
            return None

        # Access policy for delinquent states is handled separately.
        # This lifecycle update only synchronizes renewal scheduling.
        if normalized_provider_status not in {
            "active",
            "trialing",
            "past_due",
            "unpaid",
            "paused",
        }:
            return current

        current.auto_renew = not bool(
            cancel_at_period_end,
        )

        if cancel_at_period_end:
            if current_period_end is not None:
                try:
                    period_end = int(
                        current_period_end,
                    )
                except (TypeError, ValueError) as exc:
                    raise PaymentConflictError(
                        "Invalid provider current period end.",
                    ) from exc

                if period_end <= 0:
                    raise PaymentConflictError(
                        "Invalid provider current period end.",
                    )

                current.ends_at = datetime.fromtimestamp(
                    period_end,
                    tz=timezone.utc,
                )
        else:
            current.ends_at = None

        current.updated_at = self._utc_now()

        try:
            self.db.commit()
            self.db.refresh(current)
        except Exception:
            self.db.rollback()
            raise

        return current

    def sync_provider_invoice_payment(
        self,
        *,
        provider: str,
        provider_subscription_id: str,
        provider_invoice_id: str,
        payment_succeeded: bool,
    ) -> UserSubscription | None:
        """
        Synchronize provider invoice payment state for the currently
        active local subscription.

        This method does not change the access lifecycle status and
        does not mutate the original checkout Payment record.
        """
        provider = self._normalize_provider(
            provider,
        )

        subscription_id = self._required_string(
            provider_subscription_id,
            field_name="provider_subscription_id",
            max_length=255,
        )

        invoice_id = self._required_string(
            provider_invoice_id,
            field_name="provider_invoice_id",
            max_length=255,
        )

        payment = self.get_by_provider_subscription_id(
            provider=provider,
            provider_subscription_id=subscription_id,
        )

        if payment is None:
            raise PaymentNotFoundError(
                "Payment for provider subscription not found.",
            )

        subscription_service = SubscriptionService(
            self.db,
        )

        current = (
            subscription_service.get_active_subscription(
                payment.user_id,
            )
        )

        # Ignore stale invoice events after the user has already moved
        # to another plan or no longer has this paid plan active.
        if (
            current is None
            or current.plan_id != payment.plan_id
        ):
            return None

        # A user may have historical successful payments for the
        # same plan. Only the latest successful provider subscription
        # may update the current local billing state.
        active_payment = (
            self.db.query(Payment)
            .filter(
                Payment.user_id == payment.user_id,
                Payment.plan_id == current.plan_id,
                Payment.provider == provider,
                Payment.status == "succeeded",
                Payment.provider_subscription_id.is_not(None),
            )
            .order_by(Payment.id.desc())
            .first()
        )
        if (
            active_payment is None
            or active_payment.provider_subscription_id
            != subscription_id
        ):
            return None
        current.last_invoice_id = invoice_id

        if payment_succeeded:
            current.billing_status = "current"
            current.last_payment_failed_at = None
        else:
            current.billing_status = "past_due"
            current.last_payment_failed_at = self._utc_now()

        current.updated_at = self._utc_now()

        try:
            self.db.commit()
            self.db.refresh(current)
        except Exception:
            self.db.rollback()
            raise

        return current

    def move_user_to_free_plan(
        self,
        user_id: int,
    ) -> UserSubscription:
        """
        Move a user to the active free plan locally.
        This method does not call the payment provider. It is safe
        for provider webhook reconciliation after a subscription has
        already been cancelled externally.
        """
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        free_plan = (
            self.db.query(SubscriptionPlan)
            .filter(
                SubscriptionPlan.code == "free",
                SubscriptionPlan.is_active.is_(True),
            )
            .first()
        )
        if free_plan is None:
            raise PaymentConflictError(
                "Free subscription plan is unavailable.",
            )
        subscription_service = SubscriptionService(
            self.db,
        )
        return subscription_service.activate_plan(
            user_id=user_id,
            plan=free_plan,
            auto_renew=False,
        )
    @classmethod
    def _normalize_status(
        cls,
        value: str,
    ) -> str:
        status = cls._required_string(
            value,
            field_name="status",
            max_length=30,
        ).lower()
        if status not in cls.VALID_STATUSES:
            raise ValueError(
                f"Unsupported payment status: {status}.",
            )
        return status
    @classmethod
    def _normalize_provider(
        cls,
        value: str,
    ) -> str:
        return cls._required_string(
            value,
            field_name="provider",
            max_length=50,
        ).lower()
    @classmethod
    def _normalize_currency(
        cls,
        value: str,
    ) -> str:
        currency = cls._required_string(
            value,
            field_name="currency",
            max_length=10,
        ).upper()
        if len(currency) != 3:
            raise ValueError(
                "currency must be a 3-letter currency code.",
            )
        return currency
    @staticmethod
    def _positive_integer(
        value: int,
        *,
        field_name: str,
    ) -> int:
        if isinstance(value, bool):
            raise ValueError(
                f"{field_name} must be a positive integer.",
            )
        try:
            normalized = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} must be a positive integer.",
            ) from exc
        if normalized <= 0:
            raise ValueError(
                f"{field_name} must be a positive integer.",
            )
        return normalized
    @staticmethod
    def _non_negative_integer(
        value: int,
        *,
        field_name: str,
    ) -> int:
        if isinstance(value, bool):
            raise ValueError(
                f"{field_name} must be a non-negative integer.",
            )
        try:
            normalized = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} must be a non-negative integer.",
            ) from exc
        if normalized < 0:
            raise ValueError(
                f"{field_name} must be a non-negative integer.",
            )
        return normalized
    @staticmethod
    def _required_string(
        value: str,
        *,
        field_name: str,
        max_length: int,
    ) -> str:
        if not isinstance(value, str):
            raise ValueError(
                f"{field_name} must be a string.",
            )
        normalized = value.strip()
        if not normalized:
            raise ValueError(
                f"{field_name} is required.",
            )
        if len(normalized) > max_length:
            raise ValueError(
                f"{field_name} exceeds maximum length.",
            )
        return normalized
    @classmethod
    def _optional_string(
        cls,
        value: str | None,
        *,
        field_name: str,
        max_length: int,
    ) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None
        return cls._required_string(
            normalized,
            field_name=field_name,
            max_length=max_length,
        )


