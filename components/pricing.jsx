"use client";

import React, { Component, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import { PricingTable } from "@clerk/nextjs";

class PricingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Clerk PricingTable unavailable or billing not configured:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DEFAULT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Health",
    credits: 2,
    price: "₹1,600",
    popular: false,
    description: "Ideal for a single video consultation with any verified specialist.",
    features: [
      "1 Comprehensive Video Consultation (2 Credits)",
      "Digital E-Prescription Delivery",
      "Nearby Dukaan Pharmacy Routing",
      "Valid for 6 months",
    ],
  },
  {
    id: "standard",
    name: "Wellness Pack",
    credits: 5,
    price: "₹3,600",
    popular: true,
    description: "Best for follow-ups and routine family wellness care.",
    features: [
      "2-3 Specialist Video Consultations",
      "Priority Clinical Follow-up Access",
      "Generic Medicine Substitute Savings",
      "Free Local Delivery from Dukaans",
      "Valid for 12 months",
    ],
  },
  {
    id: "family",
    name: "Family Care",
    credits: 10,
    price: "₹6,400",
    popular: false,
    description: "Maximum savings for multi-member household healthcare.",
    features: [
      "5 Video Consultations across all specialties",
      "24/7 Digital Health Record Storage",
      "Flash Clearance & Expiry Alerts",
      "Dedicated Telehealth Care Coordinator",
      "Never expires",
    ],
  },
];

const FallbackPricingCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
      {DEFAULT_PACKAGES.map((pkg) => (
        <Card
          key={pkg.id}
          className={`relative border transition-all flex flex-col justify-between ${
            pkg.popular
              ? "border-teal-500 bg-gradient-to-b from-teal-950/40 to-card shadow-xl shadow-teal-950/40"
              : "border-teal-900/30 bg-card hover:border-teal-700/40"
          }`}
        >
          {pkg.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-teal-500 text-slate-950 font-bold text-xs uppercase px-3 py-0.5 shadow-md">
                <Sparkles className="h-3 w-3 mr-1 inline" /> Most Popular
              </Badge>
            </div>
          )}

          <CardHeader className="pt-6">
            <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
              <span>{pkg.name}</span>
              <span className="text-2xl font-black text-teal-400">{pkg.price}</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 pt-1">
              <Badge variant="outline" className="border-teal-700/60 text-teal-300 text-xs">
                {pkg.credits} Consultation Credits
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground pt-2">
              {pkg.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <ul className="space-y-2.5">
              {pkg.features.map((feat, idx) => (
                <li key={idx} className="flex items-start text-xs text-slate-300 gap-2">
                  <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-teal-900/30">
              <Button
                className={`w-full font-bold text-xs h-11 ${
                  pkg.popular
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-950/50"
                    : "bg-teal-950/60 hover:bg-teal-900/60 border border-teal-700/40 text-teal-300"
                }`}
                onClick={() => {
                  alert(
                    `You selected ${pkg.name} (${pkg.credits} Credits). Test credits are already pre-loaded into your account balance (2 free credits upon signup).`
                  );
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Select Package
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const Pricing = () => {
  return (
    <Card className="border-teal-900/30 shadow-lg bg-gradient-to-b from-teal-950/30 to-transparent">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <PricingErrorBoundary fallback={<FallbackPricingCards />}>
          <PricingTable
            appearance={{
              variables: {
                fontSize: "1.1rem",
              },
            }}
            checkoutProps={{
              appearance: {
                elements: {
                  drawerRoot: {
                    zIndex: 200,
                  },
                },
              },
            }}
          />
        </PricingErrorBoundary>
      </CardContent>
    </Card>
  );
};

export default Pricing;