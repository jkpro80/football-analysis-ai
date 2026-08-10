from app.payments.registry import payment_provider_registry
from app.payments.stripe_provider import StripeProvider
def register_payment_providers() -> None:
    if not payment_provider_registry.has("stripe"):
        payment_provider_registry.register(
            "stripe",
            StripeProvider,
        )
register_payment_providers()
__all__ = [
    "payment_provider_registry",
    "register_payment_providers",
]
