"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  Crown,
  Star,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Navigation from "@/components/layout/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency?: string;
  interval: string;
  priceId?: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

const Pricing = () => {
  const { state } = useApp();
  const { user, isLoading } = state;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Static plans configuration - in a real app, these would come from Stripe
      const staticPlans: SubscriptionPlan[] = [
        {
          id: "free",
          name: "Free",
          price: 0,
          interval: "forever",
          features: [
            "Basic cycle tracking",
            "5 intimacy cards",
            "Simple mood logging",
            "Basic calendar view",
          ],
          limitations: [
            "No AI coach",
            "Limited partner features",
            "No fantasy vault",
            "Basic insights only",
          ],
        },
        {
          id: "premium",
          name: "Premium",
          price: 15,
          interval: "month",
          priceId: "price_premium_monthly", // This would be your actual Stripe price ID
          popular: true,
          features: [
            "Full cycle tracker with predictions",
            "Partner access portal",
            "100+ intimacy questions",
            "AI coaching & insights",
            "Advanced mood tracking",
            "Symptom correlation",
            "Custom reminders",
          ],
        },
        {
          id: "vip",
          name: "VIP",
          price: 39,
          interval: "month",
          priceId: "price_vip_monthly", // This would be your actual Stripe price ID
          features: [
            "Everything in Premium",
            "Fantasy Vault with privacy controls",
            "Custom wellness rituals",
            "Priority AI coaching",
            "Advanced analytics",
            "Telehealth integration",
            "Priority support",
          ],
        },
        {
          id: "lifetime",
          name: "Lifetime",
          price: 199,
          interval: "forever",
          priceId: "price_lifetime", // This would be your actual Stripe price ID
          features: [
            "All VIP features forever",
            "Exclusive lifetime benefits",
            "Early access to new features",
            "Lifetime updates",
            "VIP community access",
          ],
        },
      ];
      setPlans(staticPlans);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, priceId?: string) => {
    if (!user) {
      alert("Please log in to subscribe");
      return;
    }

    if (planId === "free") {
      alert("You are already on the free plan!");
      return;
    }

    if (!priceId) {
      alert("Price ID not available for this plan");
      return;
    }

    setProcessing(planId);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start subscription process. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return <Heart className="text-rose-500" size={24} />;
      case "premium":
        return <Star className="text-yellow-500" size={24} />;
      case "vip":
        return <Crown className="text-purple-500" size={24} />;
      default:
        return <Sparkles className="text-gray-500" size={24} />;
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case "free":
        return "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20";
      case "premium":
        return "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20";
      case "vip":
        return "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20";
      default:
        return "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700";
    }
  };

  const getButtonGradient = (planId: string) => {
    switch (planId) {
      case "free":
        return "bg-gray-500 hover:bg-gray-600";
      case "premium":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600";
      case "vip":
        return "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading pricing plans..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock the full potential of your wellness journey with our flexible
            subscription plans
          </p>
        </div>

        {/* Current Plan Status */}
        {user && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getPlanIcon(user.subscriptionTier)}
                <div>
                  <h3 className="text-lg font-semibold text-white dark:text-white">
                    Current Plan:{" "}
                    {user.subscriptionTier.charAt(0).toUpperCase() +
                      user.subscriptionTier.slice(1)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {user.subscriptionTier === "free"
                      ? "Enjoying our free features"
                      : "Thank you for your subscription!"}
                  </p>
                </div>
              </div>
              {user.subscriptionTier !== "free" && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <Shield size={20} />
                  <span className="text-sm font-medium">Active</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "border-yellow-400 dark:border-yellow-500 shadow-2xl"
                  : "border-rose-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-gray-600"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-[var(--btn-primary-text)] px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star size={16} />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getPlanGradient(plan.id)}`}
                >
                  {getPlanIcon(plan.id)}
                </div>
                <h3 className="text-2xl font-bold text-white dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white dark:text-white">
                    £{plan.price}
                  </span>
                  {plan.interval !== "forever" && (
                    <span className="text-gray-600 dark:text-gray-300">
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-white dark:text-white mb-3">
                  Features:
                </h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check
                      className="text-green-500 mt-0.5 flex-shrink-0"
                      size={16}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}

                {plan.limitations && (
                  <>
                    <h4 className="font-semibold text-white dark:text-white mb-3 mt-6">
                      Limitations:
                    </h4>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <X
                          className="text-red-500 mt-0.5 flex-shrink-0"
                          size={16}
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan.id, plan.priceId)}
                disabled={
                  processing === plan.id || user?.subscriptionTier === plan.id
                }
                className={`w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonGradient(plan.id)}`}
              >
                {processing === plan.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : user?.subscriptionTier === plan.id ? (
                  "Current Plan"
                ) : plan.id === "free" ? (
                  "Get Started"
                ) : (
                  "Subscribe Now"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-rose-200 dark:border-gray-700">
              <h3 className="font-semibold text-white dark:text-white mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-rose-200 dark:border-gray-700">
              <h3 className="font-semibold text-white dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Our free plan includes basic features. Premium and VIP plans
                offer a 7-day free trial.
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-rose-200 dark:border-gray-700">
              <h3 className="font-semibold text-white dark:text-white mb-2">
                How secure is my data?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We use encryption in transit and follow modern security practices.
                We only share your data with people you explicitly choose to share
                it with — never with anyone else.
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-rose-200 dark:border-gray-700">
              <h3 className="font-semibold text-white dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Absolutely! You can cancel your subscription anytime from your
                account settings.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
