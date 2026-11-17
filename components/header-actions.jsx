"use client";

import React from "react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Stethoscope,
  ShieldCheck,
  CreditCard,
  Store,
} from "lucide-react";

export default function HeaderActions({ user }) {
  return (
    <div className="flex items-center space-x-2">
      <SignedIn>
        {user?.role === "ADMIN" && (
          <Link href="/admin">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Dashboard
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {user?.role === "DOCTOR" && (
          <Link href="/doctor">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              Doctor Dashboard
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <Stethoscope className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {user?.role === "SELLER" && (
          <Link href="/store">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2 border-teal-800/40 text-teal-300 hover:bg-teal-900/30"
            >
              <Store className="h-4 w-4 text-teal-400" />
              Dukaan Dashboard
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <Store className="h-4 w-4 text-teal-400" />
            </Button>
          </Link>
        )}

        {user?.role === "PATIENT" && (
          <Link href="/appointments">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              My Appointments
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <Calendar className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </SignedIn>

      {(!user || user?.role === "PATIENT") && (
        <Link href="/pricing">
          <Badge
            variant="outline"
            className="h-9 bg-teal-900/20 border-teal-700/30 px-3 py-1 flex items-center gap-2"
          >
            <CreditCard className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-teal-400">
              {user && user?.role === "PATIENT" ? (
                <>
                  {user.credits}{" "}
                  <span className="hidden md:inline">Credits</span>
                </>
              ) : (
                <>Pricing</>
              )}
            </span>
          </Badge>
        </Link>
      )}

      <SignedOut>
        <SignInButton>
          <Button variant="secondary">Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "shadow-xl",
              userPreviewMainIdentifier: "font-semibold",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
