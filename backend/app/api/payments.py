from __future__ import annotations
from fastapi import (
    APIRouter,
    Depends,
    Request,
    HTTPException,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.database.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
from app.payments import payment_provider_registry
from app.payments.base import (
    PaymentProviderConfigurationError,
    PaymentProviderError,
    PaymentProviderVerificationError,
)
from app.services.billing_service import (
    BillingService,
    PaymentConflictError,
    PaymentNotFoundError,
)
from app.services.checkout_service import (
    CheckoutPlanNotFoundError,
    CheckoutService,
    CheckoutServiceError,
)
router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)
class CheckoutCreateRequest(BaseModel):
    plan_code: str = Field(
        min_length=1,
        max_length=50,
    )
    success_url: str = Field(
        min_length=1,
        max_length=1000,
    )
    cancel_url: str = Field(
        min_length=1,
        max_length=1000,
    )
class CheckoutCreateResponse(BaseModel):
    payment_id: int
    provider: str
    checkout_url: str
@router.post(
    "/checkout",
    response_model=CheckoutCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_checkout(
    payload: CheckoutCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CheckoutCreateResponse:
    plan_code = payload.plan_code.strip().lower()
    if plan_code not in {
        "pro",
        "premium",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Checkout is available only for "
                "Pro or Premium plans."
            ),
        )
    service = CheckoutService(db)
    try:
        result, payment_id = service.create_checkout(
            user=current_user,
            plan_code=plan_code,
            provider_code="stripe",
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
        )
    except CheckoutPlanNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentProviderConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Payment provider is not configured."
            ),
        ) from exc
    except (
        CheckoutServiceError,
        PaymentProviderError,
        ValueError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return CheckoutCreateResponse(
        payment_id=payment_id,
        provider=result.provider,
        checkout_url=result.checkout_url,
    )
@router.post(
    "/webhooks/stripe",
    status_code=status.HTTP_200_OK,
)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    payload = await request.body()
    provider = payment_provider_registry.get(
        "stripe",
    )
    try:
        event = provider.verify_webhook(
            payload=payload,
            headers=dict(request.headers),
        )
    except PaymentProviderConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment provider is not configured.",
        ) from exc
    except PaymentProviderVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment webhook.",
        ) from exc
    billing = BillingService(db)

    webhook_event, is_new_event = (
        billing.reserve_provider_webhook_event(
            provider=event.provider,
            event_id=event.event_id,
            event_type=event.event_type,
        )
    )

    if not is_new_event:
        if webhook_event.status == "processed":
            logger.info(
                "Ignoring processed duplicate provider webhook. "
                "provider=%s event_id=%s",
                event.provider,
                event.event_id,
            )
            return {
                "received": "true",
                "status": "duplicate_event",
            }

        logger.warning(
            "Provider webhook is already being processed. "
            "provider=%s event_id=%s status=%s",
            event.provider,
            event.event_id,
            webhook_event.status,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook event is already being processed.",
        )

    def _complete(
        result_status: str,
    ) -> dict[str, str]:
        billing.mark_provider_webhook_event_processed(
            webhook_event_id=webhook_event.id,
        )
        return {
            "received": "true",
            "status": result_status,
        }
    if event.event_type == "customer.subscription.deleted":
        subscription_id = event.provider_subscription_id
        if not subscription_id:
            logger.warning(
                "Ignoring Stripe subscription deletion without "
                "subscription ID. event_id=%s",
                event.event_id,
            )
            return _complete("ignored_missing_subscription")
        payment = billing.get_by_provider_subscription_id(
            provider=event.provider,
            provider_subscription_id=subscription_id,
        )
        if payment is None:
            logger.warning(
                "Ignoring Stripe subscription deletion for "
                "unknown subscription. subscription_id=%s "
                "event_id=%s",
                subscription_id,
                event.event_id,
            )
            return _complete("ignored_unknown_subscription")
        metadata = dict(event.metadata or {})
        metadata_payment_id = metadata.get("payment_id")
        metadata_user_id = metadata.get("user_id")
        if (
            metadata_payment_id is not None
            and metadata_payment_id != str(payment.id)
        ):
            logger.warning(
                "Ignoring Stripe subscription deletion with "
                "mismatched payment metadata. payment_id=%s "
                "event_id=%s",
                payment.id,
                event.event_id,
            )
            return _complete("ignored_metadata_mismatch")
        if (
            metadata_user_id is not None
            and metadata_user_id != str(payment.user_id)
        ):
            logger.warning(
                "Ignoring Stripe subscription deletion with "
                "mismatched user metadata. user_id=%s "
                "event_id=%s",
                payment.user_id,
                event.event_id,
            )
            return _complete("ignored_metadata_mismatch")
        try:
            billing.move_user_to_free_plan(
                user_id=payment.user_id,
            )
        except PaymentConflictError as exc:
            logger.warning(
                "Stripe subscription deletion conflict. "
                "payment_id=%s event_id=%s",
                payment.id,
                event.event_id,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Subscription state conflict.",
            ) from exc
        return _complete("subscription_cancelled")
    if event.event_type == "customer.subscription.updated":
        subscription_id = event.provider_subscription_id

        if not subscription_id:
            logger.warning(
                "Ignoring Stripe subscription update without "
                "subscription ID. event_id=%s",
                event.event_id,
            )
            return _complete("ignored_missing_subscription")

        payment = billing.get_by_provider_subscription_id(
            provider=event.provider,
            provider_subscription_id=subscription_id,
        )

        if payment is None:
            logger.warning(
                "Ignoring Stripe subscription update for "
                "unknown subscription. subscription_id=%s "
                "event_id=%s",
                subscription_id,
                event.event_id,
            )
            return _complete("ignored_unknown_subscription")

        metadata = dict(event.metadata or {})
        metadata_payment_id = metadata.get("payment_id")
        metadata_user_id = metadata.get("user_id")

        if (
            metadata_payment_id is not None
            and metadata_payment_id != str(payment.id)
        ):
            logger.warning(
                "Ignoring Stripe subscription update with "
                "mismatched payment metadata. payment_id=%s "
                "event_id=%s",
                payment.id,
                event.event_id,
            )
            return _complete("ignored_metadata_mismatch")

        if (
            metadata_user_id is not None
            and metadata_user_id != str(payment.user_id)
        ):
            logger.warning(
                "Ignoring Stripe subscription update with "
                "mismatched user metadata. user_id=%s "
                "event_id=%s",
                payment.user_id,
                event.event_id,
            )
            return _complete("ignored_metadata_mismatch")

        try:
            synced_subscription = (
                billing.sync_provider_subscription_update(
                    payment_id=payment.id,
                    provider_subscription_id=subscription_id,
                    provider_status=event.status,
                    cancel_at_period_end=bool(
                        event.cancel_at_period_end
                    ),
                    current_period_end=(
                        event.current_period_end
                    ),
                )
            )
        except (
            PaymentConflictError,
            PaymentNotFoundError,
        ) as exc:
            logger.warning(
                "Stripe subscription update conflict. "
                "payment_id=%s event_id=%s",
                payment.id,
                event.event_id,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Subscription state conflict.",
            ) from exc

        if synced_subscription is None:
            return _complete("ignored_stale_subscription_update")

        return _complete("subscription_updated")

    if event.event_type in {"invoice.payment_failed", "invoice.payment_succeeded"}:
        subscription_id = event.provider_subscription_id
        invoice_id = event.provider_invoice_id

        if not subscription_id:
            logger.warning(
                "Ignoring Stripe invoice event without subscription ID. "
                "event_id=%s event_type=%s",
                event.event_id,
                event.event_type,
            )
            return _complete("ignored_missing_subscription")

        if not invoice_id:
            logger.warning(
                "Ignoring Stripe invoice event without invoice ID. "
                "event_id=%s event_type=%s",
                event.event_id,
                event.event_type,
            )
            return _complete("ignored_missing_invoice")

        payment = billing.get_by_provider_subscription_id(
            provider=event.provider,
            provider_subscription_id=subscription_id,
        )

        if payment is None:
            logger.warning(
                "Ignoring Stripe invoice event for unknown subscription. "
                "subscription_id=%s event_id=%s",
                subscription_id,
                event.event_id,
            )
            return _complete("ignored_unknown_subscription")

        metadata = dict(event.metadata or {})
        metadata_payment_id = metadata.get("payment_id")
        metadata_user_id = metadata.get("user_id")

        if (
            metadata_payment_id is not None
            and metadata_payment_id != str(payment.id)
        ):
            logger.warning(
                "Ignoring Stripe invoice event with mismatched "
                "payment metadata. payment_id=%s event_id=%s",
                payment.id,
                event.event_id,
            )
            return _complete("ignored_metadata_mismatch")

        if (
            metadata_user_id is not None
            and metadata_user_id != str(payment.user_id)
        ):
            logger.warning(
                "Ignoring Stripe invoice event with mismatched "
                "user metadata. user_id=%s event_id=%s",
                payment.user_id,
                event.event_id,
            )
            return _complete("ignored_metadata_mismatch")

        if (
            event.currency is not None
            and event.currency.upper() != payment.currency.upper()
        ):
            logger.warning(
                "Ignoring Stripe invoice event with currency mismatch. "
                "payment_id=%s expected=%s received=%s",
                payment.id,
                payment.currency,
                event.currency,
            )
            return _complete("ignored_currency_mismatch")

        try:
            synced_subscription = billing.sync_provider_invoice_payment(
                provider=event.provider,
                provider_subscription_id=subscription_id,
                provider_invoice_id=invoice_id,
                payment_succeeded=(
                    event.event_type == "invoice.payment_succeeded"
                ),
            )
        except (
            PaymentConflictError,
            PaymentNotFoundError,
        ) as exc:
            logger.warning(
                "Stripe invoice synchronization conflict. "
                "payment_id=%s invoice_id=%s event_id=%s",
                payment.id,
                invoice_id,
                event.event_id,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Subscription billing state conflict.",
            ) from exc

        if synced_subscription is None:
            return _complete("ignored_stale_invoice")

        if event.event_type == "invoice.payment_succeeded":
            return _complete("invoice_payment_succeeded")

        return _complete("invoice_payment_failed")

    if event.provider_payment_id is None:
        logger.warning(
            "Ignoring Stripe webhook without payment session. "
            "event_id=%s event_type=%s",
            event.event_id,
            event.event_type,
        )
        return _complete("ignored_missing_payment")
    payment = billing.get_by_provider_payment_id(
        provider=event.provider,
        provider_payment_id=event.provider_payment_id,
    )
    if payment is None:
        logger.warning(
            "Ignoring verified Stripe webhook for "
            "unknown payment session: %s",
            event.provider_payment_id,
        )
        return _complete("ignored_unknown_payment")
    metadata = dict(event.metadata or {})
    metadata_payment_id = metadata.get(
        "payment_id",
    )
    if (
        metadata_payment_id is not None
        and metadata_payment_id != str(payment.id)
    ):
        logger.warning(
            "Ignoring Stripe webhook with mismatched "
            "payment metadata. payment_id=%s event_id=%s",
            payment.id,
            event.event_id,
        )
        return _complete("ignored_metadata_mismatch")
    if (
        event.amount_minor is not None
        and event.amount_minor != payment.amount_minor
    ):
        logger.warning(
            "Ignoring Stripe webhook with amount mismatch. "
            "payment_id=%s expected=%s received=%s",
            payment.id,
            payment.amount_minor,
            event.amount_minor,
        )
        return _complete("ignored_amount_mismatch")
    if (
        event.currency is not None
        and event.currency.upper() != payment.currency.upper()
    ):
        logger.warning(
            "Ignoring Stripe webhook with currency mismatch. "
            "payment_id=%s expected=%s received=%s",
            payment.id,
            payment.currency,
            event.currency,
        )
        return _complete("ignored_currency_mismatch")
    try:
        if event.status == "succeeded":
            billing.finalize_successful_payment(
                payment_id=payment.id,
                provider_payment_id=(
                    event.provider_payment_id
                ),
                provider_customer_id=(
                    event.provider_customer_id
                ),
                provider_subscription_id=(
                    event.provider_subscription_id
                ),
            )

            # Stripe may deliver invoice.payment_succeeded before
            # checkout.session.completed. Once checkout activation has
            # completed, reconcile the initial invoice from the Checkout
            # Session so billing state does not depend on webhook order.
            if (
                event.provider_subscription_id
                and event.provider_invoice_id
            ):
                billing.sync_provider_invoice_payment(
                    provider=event.provider,
                    provider_subscription_id=(
                        event.provider_subscription_id
                    ),
                    provider_invoice_id=(
                        event.provider_invoice_id
                    ),
                    payment_succeeded=True,
                )

            return _complete("succeeded")
        if event.status == "failed":
            # Never allow an older webhook to downgrade
            # an already completed payment.
            if payment.status == "succeeded":
                return _complete("ignored_stale_event")
            billing.update_payment_status(
                payment_id=payment.id,
                status="failed",
                provider_payment_id=(
                    event.provider_payment_id
                ),
                provider_customer_id=(
                    event.provider_customer_id
                ),
                provider_subscription_id=(
                    event.provider_subscription_id
                ),
                failure_code=(
                    "stripe_async_payment_failed"
                ),
                failure_message=(
                    "Stripe reported that the "
                    "Checkout payment failed."
                ),
            )
            return _complete("failed")
        if event.status == "processing":
            if payment.status in {
                "succeeded",
                "failed",
                "cancelled",
                "refunded",
            }:
                return _complete("ignored_stale_event")
            billing.update_payment_status(
                payment_id=payment.id,
                status="processing",
                provider_payment_id=(
                    event.provider_payment_id
                ),
                provider_customer_id=(
                    event.provider_customer_id
                ),
                provider_subscription_id=(
                    event.provider_subscription_id
                ),
            )
            return _complete("processing")
    except PaymentConflictError as exc:
        logger.warning(
            "Stripe webhook payment conflict. "
            "payment_id=%s event_id=%s",
            payment.id,
            event.event_id,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment state conflict.",
        ) from exc
    logger.warning(
        "Ignoring Stripe webhook with unsupported "
        "normalized status: %s",
        event.status,
    )
    return _complete("ignored")

class PaymentReconcileResponse(BaseModel):
    payment_id: int
    status: str
    provider_subscription_id: str | None = None


@router.post(
    "/{payment_id}/reconcile",
    response_model=PaymentReconcileResponse,
    status_code=status.HTTP_200_OK,
)
def reconcile_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentReconcileResponse:
    billing = BillingService(db)

    payment = billing.get_payment(payment_id)

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    if payment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    try:
        payment = billing.reconcile_payment(
            payment_id,
        )
    except PaymentProviderConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment provider is not configured.",
        ) from exc
    except PaymentConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment state conflict.",
        ) from exc
    except PaymentProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider reconciliation failed.",
        ) from exc

    return PaymentReconcileResponse(
        payment_id=payment.id,
        status=payment.status,
        provider_subscription_id=(
            payment.provider_subscription_id
        ),
    )