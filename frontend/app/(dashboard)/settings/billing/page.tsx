"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api-client";

interface SubscriptionTier {
  name: string;
  price: number;
  price_id: string;
  documents_per_month: number;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  plan: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const TIERS: SubscriptionTier[] = [
  {
    name: "Starter",
    price: 99,
    price_id: "price_starter",
    documents_per_month: 10,
    features: [
      "10 documents per month",
      "ICF generation",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: 249,
    price_id: "price_professional",
    documents_per_month: 50,
    features: [
      "50 documents per month",
      "ICF, DMP, SAP generation",
      "Claude polish",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: 499,
    price_id: "price_enterprise",
    documents_per_month: -1,
    features: [
      "Unlimited documents",
      "All document types",
      "Claude polish",
      "API access",
      "Dedicated support",
      "Custom templates",
    ],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();

    // Check for success/cancel from Stripe
    if (searchParams.get("success") === "true") {
      toast({
        title: "Success!",
        description: "Your subscription has been activated",
      });
    } else if (searchParams.get("cancelled") === "true") {
      toast({
        title: "Checkout cancelled",
        description: "You can try again when you're ready",
      });
    }
  }, [searchParams]);

  async function loadSubscription() {
    try {
      const sub = await api.getSubscription();
      setSubscription(sub);
    } catch (error) {
      // No subscription found is OK
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(priceId: string) {
    setCheckoutLoading(priceId);

    try {
      const response = await api.createCheckoutSession(priceId);
      window.location.href = response.checkout_url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to start checkout",
        variant: "destructive",
      });
      setCheckoutLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      await api.cancelSubscription();
      toast({
        title: "Subscription cancelled",
        description: "Your subscription will end at the current billing period",
      });
      loadSubscription();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold capitalize">
                  {subscription.plan}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">
                  {subscription.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renews</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
            {subscription.cancel_at_period_end && (
              <div className="mt-4 flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span>Subscription will end at period end</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {!subscription.cancel_at_period_end && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {subscription ? "Change Plan" : "Choose a Plan"}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const isCurrentPlan = subscription?.plan === tier.name.toLowerCase();

            return (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.name === "Professional" ? "border-primary shadow-md" : ""
                }`}
              >
                {tier.name === "Professional" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>
                    {tier.documents_per_month === -1
                      ? "Unlimited"
                      : tier.documents_per_month}{" "}
                    documents/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || checkoutLoading !== null}
                    onClick={() => handleSubscribe(tier.price_id)}
                  >
                    {checkoutLoading === tier.price_id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
