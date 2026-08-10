from __future__ import annotations
from typing import Mapping
import stripe
from app.core.config import settings
from app.payments.base import (
    CheckoutRequest,
    CheckoutResult,
    CheckoutStatus,
    PaymentProvider,
    PaymentProviderConfigurationError,
    PaymentProviderError,
    PaymentProviderVerificationError,
    VerifiedPaymentEvent,
)
class StripeProvider(PaymentProvider):
    @property
    def code(self) -> str:
        return "stripe"
    def create_checkout(
        self,
        request: CheckoutRequest,
    ) -> CheckoutResult:
        secret_key = self._require_setting(
            settings.stripe_secret_key,
            "STRIPE_SECRET_KEY",
        )
        price_id = self._get_price_id(
            request.plan_code,
        )
        if request.amount_minor <= 0:
            raise PaymentProviderError(
                "Stripe checkout requires a positive amount.",
            )
        currency = request.currency.strip().lower()
        if len(currency) != 3:
            raise PaymentProviderError(
                "Invalid checkout currency.",
            )
        try:
            session = stripe.checkout.Session.create(
                api_key=secret_key,
                mode="subscription",
                customer_email=request.customer_email,
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                client_reference_id=str(
                    request.payment_id,
                ),
                metadata={
                    "payment_id": str(request.payment_id),
                    "user_id": str(request.user_id),
                    "plan_code": request.plan_code,
                    "idempotency_key": (
                        request.idempotency_key
                    ),
                },
                subscription_data={
                    "metadata": {
                        "payment_id": str(
                            request.payment_id,
                        ),
                        "user_id": str(request.user_id),
                        "plan_code": request.plan_code,
                    }
                },
                idempotency_key=request.idempotency_key,
            )
        except stripe.StripeError as exc:
            raise PaymentProviderError(
                "Stripe checkout creation failed.",
            ) from exc
        session_id = getattr(
            session,
            "id",
            None,
        )
        checkout_url = getattr(
            session,
            "url",
            None,
        )
        customer_id = getattr(
            session,
            "customer",
            None,
        )
        subscription_id = getattr(
            session,
            "subscription",
            None,
        )
        if not session_id or not checkout_url:
            raise PaymentProviderError(
                "Stripe returned an incomplete "
                "checkout session.",
            )
        return CheckoutResult(
            provider=self.code,
            provider_payment_id=str(session_id),
            checkout_url=str(checkout_url),
            provider_customer_id=(
                str(customer_id)
                if customer_id
                else None
            ),
            provider_subscription_id=(
                str(subscription_id)
                if subscription_id
                else None
            ),
        )
    def retrieve_checkout(
        self,
        provider_payment_id: str,
    ) -> CheckoutStatus:
        secret_key = self._require_setting(
            settings.stripe_secret_key,
            "STRIPE_SECRET_KEY",
        )
        session_id = provider_payment_id.strip()
        if not session_id:
            raise PaymentProviderError(
                "Stripe Checkout Session ID is required.",
            )
        try:
            session = stripe.checkout.Session.retrieve(
                session_id,
                api_key=secret_key,
            )
        except stripe.StripeError as exc:
            raise PaymentProviderError(
                "Stripe checkout retrieval failed.",
            ) from exc
        payment_status = str(
            getattr(session, "payment_status", "")
            or ""
        ).lower()
        session_status = str(
            getattr(session, "status", "")
            or ""
        ).lower()
        if payment_status == "paid":
            normalized_status = "succeeded"
        elif session_status == "expired":
            normalized_status = "cancelled"
        elif session_status == "complete":
            normalized_status = "processing"
        else:
            normalized_status = "pending"
        customer_id = getattr(
            session,
            "customer",
            None,
        )
        subscription_id = getattr(
            session,
            "subscription",
            None,
        )
        amount_total = getattr(
            session,
            "amount_total",
            None,
        )
        currency = getattr(
            session,
            "currency",
            None,
        )
        metadata_object = getattr(
            session,
            "metadata",
            None,
        )
        metadata = self.normalize_metadata(
            metadata_object._to_dict_recursive()
            if metadata_object
            else None,
        )
        return CheckoutStatus(
            provider=self.code,
            provider_payment_id=session_id,
            status=normalized_status,
            provider_customer_id=(
                str(customer_id)
                if customer_id
                else None
            ),
            provider_subscription_id=(
                str(subscription_id)
                if subscription_id
                else None
            ),
            amount_minor=(
                int(amount_total)
                if amount_total is not None
                else None
            ),
            currency=(
                str(currency).upper()
                if currency
                else None
            ),
            metadata=metadata,
        )
    def cancel_subscription(
        self,
        provider_subscription_id: str,
    ) -> None:
        secret_key = self._require_setting(
            settings.stripe_secret_key,
            "STRIPE_SECRET_KEY",
        )

        subscription_id = (
            provider_subscription_id.strip()
        )

        if not subscription_id:
            raise PaymentProviderError(
                "Stripe subscription ID is required.",
            )

        try:
            subscription = stripe.Subscription.retrieve(
                subscription_id,
                api_key=secret_key,
            )

            status = str(
                getattr(subscription, "status", "")
                or ""
            ).lower()

            if status == "canceled":
                return

            stripe.Subscription.modify(
                subscription_id,
                api_key=secret_key,
                cancel_at_period_end=True,
            )

        except stripe.StripeError as exc:
            raise PaymentProviderError(
                "Stripe subscription cancellation failed.",
            ) from exc

    def verify_webhook(
        self,
        *,
        payload: bytes,
        headers: Mapping[str, str],
    ) -> VerifiedPaymentEvent:
        webhook_secret = self._require_setting(
            settings.stripe_webhook_secret,
            "STRIPE_WEBHOOK_SECRET",
        )
        signature = None
        for key, value in headers.items():
            if key.lower() == "stripe-signature":
                signature = value
                break
        if not signature:
            raise PaymentProviderVerificationError(
                "Stripe-Signature header is missing.",
            )
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                webhook_secret,
            )
        except (
            ValueError,
            stripe.SignatureVerificationError,
        ) as exc:
            raise PaymentProviderVerificationError(
                "Stripe webhook signature verification failed.",
            ) from exc
        event_type = str(
            event.type,
        )
        if event_type in {
            "customer.subscription.deleted",
            "customer.subscription.updated",
        }:
            subscription = event.data.object
            subscription_id = getattr(
                subscription,
                "id",
                None,
            )
            if not subscription_id:
                raise PaymentProviderVerificationError(
                    "Stripe Subscription ID is missing.",
                )
            event_id = getattr(
                event,
                "id",
                None,
            )
            if not event_id:
                raise PaymentProviderVerificationError(
                    "Stripe Event ID is missing.",
                )
            customer_id = getattr(
                subscription,
                "customer",
                None,
            )
            metadata_object = getattr(
                subscription,
                "metadata",
                None,
            )
            metadata = self.normalize_metadata(
                metadata_object._to_dict_recursive()
                if metadata_object
                else None,
            )

            cancel_at_period_end = bool(
                getattr(
                    subscription,
                    "cancel_at_period_end",
                    False,
                )
            )

            current_period_end = None

            items = getattr(
                subscription,
                "items",
                None,
            )

            items_data = getattr(
                items,
                "data",
                None,
            )

            if items_data:
                first_item = items_data[0]

                item_period_end = getattr(
                    first_item,
                    "current_period_end",
                    None,
                )

                if item_period_end is not None:
                    current_period_end = int(
                        item_period_end,
                    )
            return VerifiedPaymentEvent(
                provider=self.code,
                event_id=str(event_id),
                event_type=event_type,
                provider_payment_id=None,
                status=(
                    "cancelled"
                    if event_type == "customer.subscription.deleted"
                    else str(
                        getattr(subscription, "status", "")
                        or ""
                    ).lower()
                ),
                provider_customer_id=(
                    str(customer_id)
                    if customer_id
                    else None
                ),
                provider_subscription_id=str(
                    subscription_id,
                ),
                cancel_at_period_end=(
                    cancel_at_period_end
                ),
                current_period_end=(
                    current_period_end
                ),
                metadata=metadata,
            )
        if event_type in {
            "invoice.payment_failed",
            "invoice.payment_succeeded",
        }:
            invoice = event.data.object

            event_id = getattr(
                event,
                "id",
                None,
            )
            if not event_id:
                raise PaymentProviderVerificationError(
                    "Stripe Event ID is missing.",
                )

            invoice_id = getattr(
                invoice,
                "id",
                None,
            )
            if not invoice_id:
                raise PaymentProviderVerificationError(
                    "Stripe Invoice ID is missing.",
                )

            invoice_data = invoice._to_dict_recursive()

            customer_id = invoice_data.get(
                "customer"
            )

            subscription_id = invoice_data.get(
                "subscription"
            )

            parent = invoice_data.get(
                "parent"
            ) or {}

            subscription_details = (
                parent.get("subscription_details")
                or {}
            )

            if not subscription_id:
                subscription_id = (
                    subscription_details.get(
                        "subscription"
                    )
                )

            if not subscription_id:
                raise PaymentProviderVerificationError(
                    "Stripe invoice subscription ID is missing.",
                )

            metadata = self.normalize_metadata(
                subscription_details.get(
                    "metadata"
                )
                or invoice_data.get("metadata")
                or None
            )

            currency = invoice_data.get(
                "currency"
            )

            if event_type == "invoice.payment_failed":
                normalized_status = "failed"
                amount_minor = invoice_data.get(
                    "amount_due"
                )
            else:
                normalized_status = "succeeded"
                amount_minor = invoice_data.get(
                    "amount_paid"
                )

            return VerifiedPaymentEvent(
                provider=self.code,
                event_id=str(event_id),
                event_type=event_type,
                provider_payment_id=None,
                status=normalized_status,
                provider_customer_id=(
                    str(customer_id)
                    if customer_id
                    else None
                ),
                provider_subscription_id=str(
                    subscription_id,
                ),
                provider_invoice_id=str(
                    invoice_id,
                ),
                amount_minor=(
                    int(amount_minor)
                    if amount_minor is not None
                    else None
                ),
                currency=(
                    str(currency).upper()
                    if currency
                    else None
                ),
                metadata=metadata,
            )

        if event_type not in {
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
            "checkout.session.async_payment_failed",
        }:
            raise PaymentProviderVerificationError(
                f"Unsupported Stripe event type: {event_type}.",
            )
        session = event.data.object
        session_id = getattr(
            session,
            "id",
            None,
        )
        if not session_id:
            raise PaymentProviderVerificationError(
                "Stripe Checkout Session ID is missing.",
            )
        payment_status = str(
            getattr(
                session,
                "payment_status",
                "",
            )
            or ""
        ).lower()
        if event_type == "checkout.session.async_payment_failed":
            normalized_status = "failed"
        elif (
            event_type
            == "checkout.session.async_payment_succeeded"
        ):
            normalized_status = "succeeded"
        elif payment_status == "paid":
            normalized_status = "succeeded"
        else:
            normalized_status = "processing"
        metadata_object = getattr(
            session,
            "metadata",
            None,
        )
        metadata = self.normalize_metadata(
            metadata_object._to_dict_recursive()
            if metadata_object
            else None,
        )
        customer_id = getattr(
            session,
            "customer",
            None,
        )
        subscription_id = getattr(
            session,
            "subscription",
            None,
        )
        invoice_id = getattr(
            session,
            "invoice",
            None,
        )
        amount_total = getattr(
            session,
            "amount_total",
            None,
        )
        currency = getattr(
            session,
            "currency",
            None,
        )
        event_id = getattr(
            event,
            "id",
            None,
        )
        if not event_id:
            raise PaymentProviderVerificationError(
                "Stripe Event ID is missing.",
            )
        return VerifiedPaymentEvent(
            provider=self.code,
            event_id=str(event_id),
            event_type=event_type,
            provider_payment_id=str(session_id),
            status=normalized_status,
            provider_customer_id=(
                str(customer_id)
                if customer_id
                else None
            ),
            provider_subscription_id=(
                str(subscription_id)
                if subscription_id
                else None
            ),
            provider_invoice_id=(
                str(invoice_id)
                if invoice_id
                else None
            ),
            amount_minor=(
                int(amount_total)
                if amount_total is not None
                else None
            ),
            currency=(
                str(currency).upper()
                if currency
                else None
            ),
            metadata=metadata,
        )
    def _require_setting(
        self,
        value: str | None,
        name: str,
    ) -> str:
        if value is None:
            raise PaymentProviderConfigurationError(
                f"{name} is not configured.",
            )
        normalized = value.strip()
        if not normalized:
            raise PaymentProviderConfigurationError(
                f"{name} is not configured.",
            )
        return normalized
    def _get_price_id(
        self,
        plan_code: str,
    ) -> str:
        normalized = plan_code.strip().lower()
        if normalized == "pro":
            return self._require_setting(
                settings.stripe_pro_price_id,
                "STRIPE_PRO_PRICE_ID",
            )
        if normalized == "premium":
            return self._require_setting(
                settings.stripe_premium_price_id,
                "STRIPE_PREMIUM_PRICE_ID",
            )
        raise PaymentProviderConfigurationError(
            f"No Stripe price is configured "
            f"for plan '{normalized}'.",
        )


