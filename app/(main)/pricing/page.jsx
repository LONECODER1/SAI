"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import Pricing from "@/components/pricing";
const PricingPage = () => {
  return (
    <div className="container mx-auto px-4">
      {/* Back to Home */}
      <div className="flex justify-start mb-2">
        <Link
          href="/"
          className="flex items-center text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-full mx-auto mb-12 text-center">
        <Badge
          variant="outline"
          className="bg-teal-900/30 border-teal-700/30 px-4 py-1 text-teal-400 text-sm font-medium mb-4"
        >
          Affordable Healthcare
        </Badge>

        <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4">
          Simple, Transparent Pricing
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect consultation package that fits your healthcare
          needs with no hidden fees or long-term commitments.
        </p>
      </div>

      <Pricing />

      {/* Transparent Credit to Rupee Conversion Information */}
      <div className="mt-12 mb-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-teal-900/30 text-center space-y-2">
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">1 Platform Credit</p>
          <p className="text-3xl font-extrabold text-teal-400">₹800</p>
          <p className="text-xs text-muted-foreground">Standardized consultation unit for high-demand specialists</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-teal-900/30 text-center space-y-2">
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Video Consultation</p>
          <p className="text-3xl font-extrabold text-white">2 Credits <span className="text-sm font-normal text-teal-300">(₹1,600)</span></p>
          <p className="text-xs text-muted-foreground">30-minute encrypted virtual consult + certified e-prescription</p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-teal-900/30 text-center space-y-2">
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Doctor Payout</p>
          <p className="text-3xl font-extrabold text-emerald-400">₹640 <span className="text-sm font-normal text-muted-foreground">/ credit</span></p>
          <p className="text-xs text-muted-foreground">80% direct net physician disbursement with 20% platform fee</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
