"""Subscriptions API router."""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.modules.subscriptions.stripe_service import (
    stripe_service,
    SUBSCRIPTION_TIERS,
)

router = APIRouter()


class CreateCheckoutRequest(BaseModel):
    """Request to create checkout session."""
    price_id: str


class CreateCheckoutResponse(BaseModel):
    """Checkout session response."""
    checkout_url: str


class SubscriptionResponse(BaseModel):
    """Subscription details response."""
    id: str
    status: str
    plan: str
    current_period_end: str
    cancel_at_period_end: bool = False


class SubscriptionTierResponse(BaseModel):
    """Subscription tier details."""
    name: str
    price: int
    price_id: str
    documents_per_month: int
    features: list[str]


def get_user_id(request: Request) -> str:
    """Get user ID from request."""
    return request.headers.get("X-User-ID", "dev-user")


def get_user_email(request: Request) -> str:
    """Get user email from request."""
    return request.headers.get("X-User-Email", "dev@example.com")


@router.get("/tiers", response_model=list[SubscriptionTierResponse])
async def list_subscription_tiers():
    """
    List available subscription tiers.

    Returns pricing and features for each tier.
    """
    return [
        SubscriptionTierResponse(
            name=tier["name"],
            price=tier["price"],
            price_id=tier["price_id"],
            documents_per_month=tier["documents_per_month"],
            features=tier["features"],
        )
        for tier in SUBSCRIPTION_TIERS.values()
    ]


@router.post("/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout_session(
    request: Request,
    body: CreateCheckoutRequest,
):
    """
    Create a Stripe checkout session for subscription.

    - **price_id**: Stripe price ID for the selected tier

    Returns a URL to redirect the user to Stripe checkout.
    """
    user_id = get_user_id(request)
    user_email = get_user_email(request)

    # Validate price ID
    valid_price_ids = [tier["price_id"] for tier in SUBSCRIPTION_TIERS.values()]
    if body.price_id not in valid_price_ids:
        raise HTTPException(status_code=400, detail="Invalid price ID")

    # Get base URL from request
    base_url = str(request.base_url).rstrip("/")
    success_url = f"{base_url}/settings/billing?success=true"
    cancel_url = f"{base_url}/settings/billing?cancelled=true"

    try:
        checkout_url = await stripe_service.create_checkout_session(
            user_id=user_id,
            user_email=user_email,
            price_id=body.price_id,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return CreateCheckoutResponse(checkout_url=checkout_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(request: Request):
    """
    Get the current user's subscription.

    Returns subscription status and details.
    """
    user_id = get_user_id(request)

    subscription = await stripe_service.get_subscription(user_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")

    return SubscriptionResponse(**subscription)


@router.post("/cancel")
async def cancel_subscription(request: Request):
    """
    Cancel the current user's subscription.

    The subscription will remain active until the end of the billing period.
    """
    user_id = get_user_id(request)

    success = await stripe_service.cancel_subscription(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel subscription")

    return {"status": "cancelled", "message": "Subscription will end at period end"}


@router.post("/portal")
async def create_portal_session(request: Request):
    """
    Create a Stripe customer portal session.

    Returns a URL to redirect the user to manage their subscription.
    """
    user_id = get_user_id(request)
    base_url = str(request.base_url).rstrip("/")
    return_url = f"{base_url}/settings/billing"

    try:
        portal_url = await stripe_service.create_portal_session(
            user_id=user_id,
            return_url=return_url,
        )
        return {"portal_url": portal_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def handle_webhook(request: Request):
    """
    Handle Stripe webhook events.

    This endpoint receives events from Stripe for subscription updates,
    payment failures, etc.
    """
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        event = stripe_service.verify_webhook(payload, sig_header)
        await stripe_service.handle_webhook_event(event)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
