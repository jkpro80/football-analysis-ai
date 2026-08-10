from __future__ import annotations
from collections.abc import Callable
from app.payments.base import (
    PaymentProvider,
    PaymentProviderConfigurationError,
)
PaymentProviderFactory = Callable[[], PaymentProvider]
class PaymentProviderRegistry:
    """
    Central registry for payment provider factories.
    The rest of the application resolves providers by stable code
    without depending on provider-specific implementations.
    """
    def __init__(self) -> None:
        self._factories: dict[str, PaymentProviderFactory] = {}
    def register(
        self,
        code: str,
        factory: PaymentProviderFactory,
        *,
        replace: bool = False,
    ) -> None:
        normalized_code = self._normalize_code(code)
        if not callable(factory):
            raise TypeError(
                "Payment provider factory must be callable.",
            )
        if (
            normalized_code in self._factories
            and not replace
        ):
            raise PaymentProviderConfigurationError(
                f"Payment provider '{normalized_code}' "
                "is already registered.",
            )
        self._factories[normalized_code] = factory
    def unregister(
        self,
        code: str,
    ) -> None:
        normalized_code = self._normalize_code(code)
        self._factories.pop(normalized_code, None)
    def get(
        self,
        code: str,
    ) -> PaymentProvider:
        normalized_code = self._normalize_code(code)
        factory = self._factories.get(normalized_code)
        if factory is None:
            raise PaymentProviderConfigurationError(
                f"Payment provider '{normalized_code}' "
                "is not registered.",
            )
        provider = factory()
        if not isinstance(provider, PaymentProvider):
            raise PaymentProviderConfigurationError(
                f"Factory for '{normalized_code}' did not "
                "return a PaymentProvider.",
            )
        provider_code = self._normalize_code(
            provider.code,
        )
        if provider_code != normalized_code:
            raise PaymentProviderConfigurationError(
                "Registered provider code does not match "
                "the provider implementation.",
            )
        return provider
    def has(
        self,
        code: str,
    ) -> bool:
        normalized_code = self._normalize_code(code)
        return normalized_code in self._factories
    def codes(self) -> tuple[str, ...]:
        return tuple(
            sorted(self._factories.keys())
        )
    @staticmethod
    def _normalize_code(
        code: str,
    ) -> str:
        if not isinstance(code, str):
            raise TypeError(
                "Payment provider code must be a string.",
            )
        normalized = code.strip().lower()
        if not normalized:
            raise ValueError(
                "Payment provider code is required.",
            )
        if len(normalized) > 50:
            raise ValueError(
                "Payment provider code exceeds "
                "maximum length.",
            )
        return normalized
payment_provider_registry = PaymentProviderRegistry()
