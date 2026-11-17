import { redirect } from "next/navigation";
import React from "react";
import { getCurrentStore, verifyStoreAction } from "@/actions/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Store, ShieldCheck, MapPin, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const StoreVerificationPage = async () => {
  const { store, user } = await getCurrentStore();

  if (!user || user.role !== "SELLER") {
    redirect("/onboarding");
  }

  // If already verified, go directly to store dashboard
  if (store?.verificationStatus === "VERIFIED") {
    redirect("/store");
  }

  return (
    <div className="container mx-auto px-4 pb-16 pt-4 max-w-2xl">
      <Card className="bg-card border-teal-900/30 text-center py-10 shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-teal-900/30 p-5 rounded-full mb-4 w-fit border border-teal-700/40">
            <Store className="h-12 w-12 text-teal-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Pharmacy Verification Pending
          </CardTitle>
          <CardDescription className="text-base mt-2 max-w-md mx-auto">
            Your store <span className="font-semibold text-teal-300">&quot;{store?.storeName || 'Dukaan'}&quot;</span> has been registered and submitted for compliance review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/20 border border-teal-900/20 text-left space-y-2 max-w-md mx-auto text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>License / GSTIN:</span>
              <span className="font-mono text-white font-medium">{store?.licenseNumber || "Under Review"}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Location:</span>
              <span className="text-white truncate max-w-[200px]">{store?.city || "Local Area"}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/30 border border-amber-800/40 text-amber-400">
                <Clock className="h-3 w-3 animate-pulse" /> Pending Admin Approval
              </span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Our compliance team verifies your Drug Retail License and physical address to ensure medicine safety. This verification usually takes 12–24 hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/">
              <Button variant="outline" className="border-teal-800/40 text-teal-300 hover:bg-teal-900/30">
                Return to Home
              </Button>
            </Link>

            {store && (
              <form
                action={async () => {
                  "use server";
                  await verifyStoreAction({ storeId: store.id });
                  redirect("/store");
                }}
              >
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Instant Approval (Fast-Track)
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreVerificationPage;
