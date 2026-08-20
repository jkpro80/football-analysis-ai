from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4
from urllib.parse import (
    parse_qsl,
    urlencode,
    urlsplit,
    urlunsplit,
)
from sqlalchemy.orm import Session
from app.database.models import SubscriptionPlan, User
from app.payments import payment_provider_registry
from app.payments.base import CheckoutRequest, CheckoutResult
from app.services.billing_service import BillingService
class CheckoutServiceError(Exception):
    """Base checkout service error."""
class CheckoutPlanNotFoundError(CheckoutServiceError):
    """Raised when the requested paid plan cannot be found."""
class CheckoutService:
    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")
        self.db = db
        self.billing = BillingService(db)
    def create_checkout(
        self,
        *,
        user: User,
        plan_code: str,
        provider_code: str,
        success_url: str,
        cancel_url: str,
    ) -> tuple[CheckoutResult, int]:
        if user is None:
            raise ValueError("user is required.")
        normalized_plan_code = self._required_string(
            plan_code,
            field_name="plan_code",
            max_length=50,
        ).lower()
        provider_code = self._required_string(
            provider_code,
            field_name="provider_code",
            max_length=50,
        ).lower()
        success_url = self._required_string(
            success_url,
            field_name="success_url",
            max_length=1000,
        )
        cancel_url = self._required_string(
            cancel_url,
            field_name="cancel_url",
            max_length=1000,
        )
        plan = (
            self.db.query(SubscriptionPlan)
            .filter(
                SubscriptionPlan.code == normalized_plan_code,
                SubscriptionPlan.is_active.is_(True),
            )
            .first()
        )
        if plan is None:
            raise CheckoutPlanNotFoundError(
                "Subscription plan not found.",
            )
        if float(plan.monthly_price) <= 0:
            raise CheckoutServiceError(
                "Checkout is only available for paid plans.",
            )
        amount_minor = self._price_to_minor(
            plan.monthly_price,
        )
        currency = str(
            plan.currency,
        ).strip().upper()
        if len(currency) != 3:
            raise CheckoutServiceError(
                "Subscription plan currency is invalid.",
            )
        idempotency_key = (
            f"checkout:{provider_code}:"
            f"user:{user.id}:plan:{plan.id}:"
            f"{uuid4().hex}"
        )
        consent_accepted_at = self.billing._utc_now()
        consent_version = "2026-08-20"

        user.subscription_terms_accepted_at = (
            consent_accepted_at
        )
        user.subscription_terms_version = consent_version

        payment = self.billing.create_payment(
            user_id=user.id,
            plan_id=plan.id,
            provider=provider_code,
            amount_minor=amount_minor,
            currency=currency,
            idempotency_key=idempotency_key,
            status="pending",
            subscription_terms_accepted_at=(
                consent_accepted_at
            ),
            subscription_terms_version=(
                consent_version
            ),
        )
        success_parts = urlsplit(success_url)
        success_query = dict(
            parse_qsl(
                success_parts.query,
                keep_blank_values=True,
            )
        )
        success_query["payment_id"] = str(
            payment.id,
        )
        success_url = urlunsplit(
            (
                success_parts.scheme,
                success_parts.netloc,
                success_parts.path,
                urlencode(success_query),
                success_parts.fragment,
            )
        )
        provider = payment_provider_registry.get(
            provider_code,
        )
        try:
            result = provider.create_checkout(
                CheckoutRequest(
                    payment_id=payment.id,
                    user_id=user.id,
                    plan_code=plan.code,
                    amount_minor=amount_minor,
                    currency=currency,
                    customer_email=user.email,
                    idempotency_key=idempotency_key,
                    success_url=success_url,
                    cancel_url=cancel_url,
                )
            )
            payment.provider_payment_id = (
                result.provider_payment_id
            )
            payment.provider_customer_id = (
                result.provider_customer_id
            )
            payment.provider_subscription_id = (
                result.provider_subscription_id
            )
            payment.updated_at = self.billing._utc_now()
            self.db.commit()
            self.db.refresh(payment)
        except Exception:
            self.db.rollback()
            existing = self.billing.get_payment(
                payment.id,
            )
            if existing is not None:
                try:
                    self.billing.update_payment_status(
                        payment_id=existing.id,
                        status="failed",
                        failure_code="checkout_creation_failed",
                        failure_message=(
                            "Payment provider checkout "
                            "creation failed."
                        ),
                    )
                except Exception:
                    self.db.rollback()
            raise
        return result, payment.id
    @staticmethod
    def _price_to_minor(
        value: float,
    ) -> int:
        amount = Decimal(
            str(value),
        )
        if amount <= 0:
            raise CheckoutServiceError(
                "Paid plan price must be positive.",
            )
        minor = (
            amount * Decimal("100")
        ).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
        return int(minor)
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


