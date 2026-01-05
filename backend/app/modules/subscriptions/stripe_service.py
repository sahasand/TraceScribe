"""Stripe billing service."""

import logging
from typing import Optional
from datetime import datetime
import stripe

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.stripe_secret_key


# Subscription tiers
SUBSCRIPTION_TIERS = {
    "starter": {
        "name": "Starter",
        "price": 9900,  # $99 in cents
        "price_id": "price_starter",  # Replace with actual Stripe price ID
        "documents_per_month": 10,
        "features": [
            "10 documents per month",
            "ICF generation",
            "Email support",
        ],
    },
    "professional": {
        "name": "Professional",
        "price": 24900,  # $249 in cents
        "price_id": "price_professional",
        "documents_per_month": 50,
        "features": [
            "50 documents per month",
            "ICF, DMP, SAP generation",
            "Claude polish",
            "Priority support",
        ],
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 49900,  # $499 in cents
        "price_id": "price_enterprise",
        "documents_per_month": -1,  # Unlimited
        "features": [
            "Unlimited documents",
            "All document types",
            "Claude polish",
            "API access",
            "Dedicated support",
            "Custom templates",
        ],
    },
}


class StripeService:
    """Service for Stripe billing operations."""

    def __init__(self):
        self.webhook_secret = settings.stripe_webhook_secret

    async def create_checkout_session(
        self,
        user_id: str,
        user_email: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> str:
        """
        Create a Stripe checkout session.

        Args:
            user_id: User ID for metadata
            user_email: User email
            price_id: Stripe price ID
            success_url: URL to redirect on success
            cancel_url: URL to redirect on cancel

        Returns:
            Checkout session URL
        """
        try:
            # Check if customer already exists
            customers = stripe.Customer.list(email=user_email, limit=1)
            if customers.data:
                customer = customers.data[0]
            else:
                customer = stripe.Customer.create(
                    email=user_email,
                    metadata={"user_id": user_id},
                )

            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer.id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"user_id": user_id},
            )

            return session.url

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout: {e}")
            raise ValueError(f"Failed to create checkout session: {e}")

    async def get_subscription(self, user_id: str) -> Optional[dict]:
        """
        Get user's current subscription.

        Args:
            user_id: User ID

        Returns:
            Subscription details or None
        """
        try:
            # Find customer by metadata
            customers = stripe.Customer.search(
                query=f'metadata["user_id"]:"{user_id}"'
            )

            if not customers.data:
                return None

            customer = customers.data[0]

            # Get active subscriptions
            subscriptions = stripe.Subscription.list(
                customer=customer.id,
                status="active",
                limit=1,
            )

            if not subscriptions.data:
                return None

            sub = subscriptions.data[0]

            # Get plan details
            plan_name = "unknown"
            for tier_key, tier in SUBSCRIPTION_TIERS.items():
                if tier["price_id"] == sub.items.data[0].price.id:
                    plan_name = tier_key
                    break

            return {
                "id": sub.id,
                "status": sub.status,
                "plan": plan_name,
                "current_period_end": datetime.fromtimestamp(sub.current_period_end).isoformat(),
                "cancel_at_period_end": sub.cancel_at_period_end,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting subscription: {e}")
            return None

    async def cancel_subscription(self, user_id: str) -> bool:
        """
        Cancel user's subscription at period end.

        Args:
            user_id: User ID

        Returns:
            True if cancelled successfully
        """
        try:
            subscription = await self.get_subscription(user_id)
            if not subscription:
                return False

            stripe.Subscription.modify(
                subscription["id"],
                cancel_at_period_end=True,
            )

            return True

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error cancelling subscription: {e}")
            return False

    async def create_portal_session(
        self,
        user_id: str,
        return_url: str,
    ) -> str:
        """
        Create a Stripe customer portal session.

        Args:
            user_id: User ID
            return_url: URL to return to after portal

        Returns:
            Portal session URL
        """
        try:
            customers = stripe.Customer.search(
                query=f'metadata["user_id"]:"{user_id}"'
            )

            if not customers.data:
                raise ValueError("No customer found")

            session = stripe.billing_portal.Session.create(
                customer=customers.data[0].id,
                return_url=return_url,
            )

            return session.url

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating portal session: {e}")
            raise ValueError(f"Failed to create portal session: {e}")

    def verify_webhook(self, payload: bytes, sig_header: str) -> dict:
        """
        Verify and parse a Stripe webhook.

        Args:
            payload: Raw webhook payload
            sig_header: Stripe signature header

        Returns:
            Parsed webhook event
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                self.webhook_secret,
            )
            return event
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise ValueError("Invalid webhook signature")

    async def handle_webhook_event(self, event: dict) -> None:
        """
        Handle a Stripe webhook event.

        Args:
            event: Parsed webhook event
        """
        event_type = event["type"]

        if event_type == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session["metadata"].get("user_id")
            logger.info(f"Checkout completed for user {user_id}")
            # TODO: Update user's subscription status in database

        elif event_type == "customer.subscription.updated":
            subscription = event["data"]["object"]
            logger.info(f"Subscription updated: {subscription['id']}")
            # TODO: Update subscription in database

        elif event_type == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            logger.info(f"Subscription cancelled: {subscription['id']}")
            # TODO: Update subscription in database

        elif event_type == "invoice.payment_failed":
            invoice = event["data"]["object"]
            logger.warning(f"Payment failed for invoice {invoice['id']}")
            # TODO: Notify user of payment failure

        else:
            logger.debug(f"Unhandled webhook event: {event_type}")


# Global service instance
stripe_service = StripeService()
