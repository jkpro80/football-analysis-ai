from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Mapping
@dataclass(frozen=True, slots=True)
class CheckoutRequest:
    payment_id: int
    user_id: int
    plan_code: str
    amount_minor: int
    currency: str
    customer_email: str
    idempotency_key: str
    success_url: str
    cancel_url: str
@dataclass(frozen=True, slots=True)
class CheckoutResult:
    provider: str
    provider_payment_id: str
    checkout_url: str
    provider_customer_id: str | None = None
    provider_subscription_id: str | None = None
@dataclass(frozen=True, slots=True)
class CheckoutStatus:
    provider: str
    provider_payment_id: str
    status: str
    provider_customer_id: str | None = None
    provider_subscription_id: str | None = None
    amount_minor: int | None = None
    currency: str | None = None
    metadata: Mapping[str, str] | None = None
@dataclass(frozen=True, slots=True)
class VerifiedPaymentEvent:
    provider: str
    event_id: str
    event_type: str
    provider_payment_id: str | None
    status: str
    provider_customer_id: str | None = None
    provider_subscription_id: str | None = None
    provider_invoice_id: str | None = None
    cancel_at_period_end: bool | None = None
    current_period_end: int | None = None
    amount_minor: int | None = None
    currency: str | None = None
    metadata: Mapping[str, str] | None = None
class PaymentProviderError(Exception):
    """Base payment provider error."""
class PaymentProviderConfigurationError(PaymentProviderError):
    """Raised when a payment provider is not configured correctly."""
class PaymentProviderVerificationError(PaymentProviderError):
    """Raised when a provider webhook cannot be verified."""
class PaymentProvider(ABC):
    """
    Provider-agnostic payment interface.
    Implementations may use Stripe, PayPal, or another provider.
    Billing and subscription domain logic must not depend on a
    provider-specific SDK.
    """
    @property
    @abstractmethod
    def code(self) -> str:
        """Return the stable provider code."""
    @abstractmethod
    def create_checkout(
        self,
        request: CheckoutRequest,
    ) -> CheckoutResult:
        """
        Create a checkout session/order with the payment provider.
        This method must not activate a subscription.
        """
        raise NotImplementedError
    @abstractmethod
    def retrieve_checkout(
        self,
        provider_payment_id: str,
    ) -> CheckoutStatus:
        """
        Retrieve and normalize the current state of an existing
        checkout session/order from the payment provider.
        """
        raise NotImplementedError
    @abstractmethod
    def verify_webhook(
        self,
        *,
        payload: bytes,
        headers: Mapping[str, str],
    ) -> VerifiedPaymentEvent:
        """
        Verify and normalize a provider webhook.
        Implementations must cryptographically verify the event
        before returning it as trusted.
        """
        raise NotImplementedError
    def normalize_metadata(
        self,
        metadata: Mapping[str, Any] | None,
    ) -> dict[str, str]:
        if not metadata:
            return {}
        normalized: dict[str, str] = {}
        for key, value in metadata.items():
            normalized[str(key)] = str(value)
        return normalized
