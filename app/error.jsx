"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("CareConnect uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-[#091017] border border-teal-900/40 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An error occurred while loading this healthcare screen. Your medical records and account data remain completely safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>

          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-teal-800/40 text-teal-300 hover:bg-teal-950/40 text-xs h-10 gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
