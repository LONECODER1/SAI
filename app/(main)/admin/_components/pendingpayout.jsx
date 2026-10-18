"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  User,
  DollarSign,
  Mail,
  Stethoscope,
  Loader2,
  AlertCircle,
  History,
  Clock,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { approvePayout } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function PendingPayouts({ payouts = [], processedPayouts = [] }) {
  const router = useRouter();
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Custom hook for approve payout server action
  const { loading, fn: submitApproval } = useFetch(approvePayout);

  // Handle view details
  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(false);
  };

  // Handle approve payout trigger
  const handleApprovePayout = (payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  // Confirm approval
  const confirmApproval = async () => {
    if (!selectedPayout || loading) return;

    const formData = new FormData();
    formData.append("payoutId", selectedPayout.id);

    const res = await submitApproval(formData);
    if (res?.success) {
      setShowApproveDialog(false);
      setSelectedPayout(null);
      toast.success("Payout approved successfully!");
      router.refresh();
    }
  };

  const closeDialogs = () => {
    setSelectedPayout(null);
    setShowApproveDialog(false);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-muted">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Payout Management
              </CardTitle>
              <CardDescription>
                Review and approve doctor payout requests
              </CardDescription>
            </div>

            {/* Sub Tabs for Pending vs Processed */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-muted/40 border border-muted p-1">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-teal-950/40 data-[state=active]:text-teal-300 text-xs sm:text-sm"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Pending
                  {payouts.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold">
                      {payouts.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-muted data-[state=active]:text-white text-xs sm:text-sm"
                >
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  History
                  {processedPayouts.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-muted text-muted-foreground rounded-full text-xs">
                      {processedPayouts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "pending" && (
            <div>
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-base font-medium text-white mb-1">
                    No pending payout requests
                  </p>
                  <p className="text-sm">
                    All doctor payout requests have been reviewed and processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <Card
                      key={payout.id}
                      className="bg-background border-muted hover:border-teal-700/30 transition-all"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="bg-teal-950/40 border border-teal-800/30 rounded-full p-2.5 mt-0.5">
                              <User className="h-5 w-5 text-teal-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base">
                                Dr. {payout.doctor?.name || "Doctor"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {payout.doctor?.specialty || "Specialist"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1 text-teal-400 shrink-0" />
                                  <span className="font-medium text-white">
                                    ${payout.netAmount?.toFixed(2) || "0.00"}
                                  </span>
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    ({payout.credits} credits)
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Mail className="h-3.5 w-3.5 mr-1 text-teal-400 shrink-0" />
                                  <span className="text-xs break-all">
                                    {payout.paypalEmail}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground/70" />
                                Requested{" "}
                                {format(
                                  new Date(payout.createdAt),
                                  "MMM d, yyyy 'at' h:mm a"
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-end lg:self-center">
                            <Badge
                              variant="outline"
                              className="bg-amber-900/20 border-amber-900/30 text-amber-400 text-xs px-2.5 py-0.5"
                            >
                              Pending
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(payout)}
                                className="border-teal-900/30 hover:bg-muted/80 text-xs"
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprovePayout(payout)}
                                className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {processedPayouts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-base font-medium text-white mb-1">
                    No payout history yet
                  </p>
                  <p className="text-sm">
                    Approved payouts will appear here for your records.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processedPayouts.map((payout) => (
                    <Card
                      key={payout.id}
                      className="bg-background border-muted hover:border-muted-foreground/20 transition-all"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="bg-muted/30 border border-muted rounded-full p-2.5 mt-0.5">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base">
                                Dr. {payout.doctor?.name || "Doctor"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {payout.doctor?.specialty || "Specialist"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1 text-teal-400 shrink-0" />
                                  <span className="font-medium text-white">
                                    ${payout.netAmount?.toFixed(2) || "0.00"}
                                  </span>
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    ({payout.credits} credits)
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Mail className="h-3.5 w-3.5 mr-1 text-teal-400 shrink-0" />
                                  <span className="text-xs break-all">
                                    {payout.paypalEmail}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground/70" />
                                  Processed{" "}
                                  {payout.processedAt
                                    ? format(
                                        new Date(payout.processedAt),
                                        "MMM d, yyyy 'at' h:mm a"
                                      )
                                    : "Recently"}
                                </span>
                                {payout.processedBy && (
                                  <span>by {payout.processedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end lg:self-center">
                            <Badge
                              variant="outline"
                              className="bg-teal-900/20 border-teal-900/30 text-teal-400 text-xs px-2.5 py-0.5"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Processed
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Details Dialog */}
      {selectedPayout && !showApproveDialog && (
        <Dialog open={!!selectedPayout} onOpenChange={closeDialogs}>
          <DialogContent className="max-w-2xl bg-card border-teal-900/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Payout Request Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Review the payout request and doctor credit information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Doctor Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-teal-400" />
                  <h3 className="text-white font-medium">Doctor Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-teal-900/20">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-sm font-medium text-white mt-0.5">
                      Dr. {selectedPayout.doctor?.name || "Doctor"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm font-medium text-white break-all mt-0.5">
                      {selectedPayout.doctor?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Specialty
                    </p>
                    <p className="text-sm text-white mt-0.5">
                      {selectedPayout.doctor?.specialty || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Current Credit Balance
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {selectedPayout.doctor?.credits ?? 0} credits
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-teal-400" />
                  <h3 className="text-white font-medium">Payout Breakdown</h3>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg border border-teal-900/20 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Credits being paid out:
                    </span>
                    <span className="text-white font-medium">
                      {selectedPayout.credits} credits
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gross amount ($10 USD / credit):
                    </span>
                    <span className="text-white">
                      ${selectedPayout.amount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Platform fee ($2 USD / credit):
                    </span>
                    <span className="text-amber-400">
                      -${selectedPayout.platformFee?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="border-t border-teal-900/20 pt-3 flex justify-between font-semibold">
                    <span className="text-white">Doctor receives:</span>
                    <span className="text-teal-400 text-base">
                      ${selectedPayout.netAmount?.toFixed(2) || "0.00"} USD
                    </span>
                  </div>
                  <div className="border-t border-teal-900/20 pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      PayPal Destination Email
                    </p>
                    <p className="text-white font-mono text-sm mt-0.5">
                      {selectedPayout.paypalEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning if insufficient credits */}
              {(selectedPayout.doctor?.credits ?? 0) < selectedPayout.credits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Doctor currently has only{" "}
                    {selectedPayout.doctor?.credits ?? 0} credits but this payout
                    requires {selectedPayout.credits} credits. The payout cannot
                    be processed until the doctor has sufficient credits.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={closeDialogs}
                className="border-teal-900/30 text-white hover:bg-muted/80"
              >
                Close
              </Button>
              <Button
                onClick={() => handleApprovePayout(selectedPayout)}
                disabled={
                  (selectedPayout.doctor?.credits ?? 0) < selectedPayout.credits
                }
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Approve Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Confirmation Dialog */}
      {showApproveDialog && selectedPayout && (
        <Dialog open={showApproveDialog} onOpenChange={closeDialogs}>
          <DialogContent className="max-w-md bg-card border-teal-900/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Confirm Payout Approval
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Please review this payout action before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <Alert className="border-teal-900/30 bg-teal-950/20">
                <AlertCircle className="h-4 w-4 text-teal-400" />
                <AlertDescription className="text-xs text-muted-foreground">
                  Confirming this payout will:
                  <ul className="mt-1.5 space-y-1 list-disc pl-4 text-white">
                    <li>
                      Deduct {selectedPayout.credits} credits from Dr.{" "}
                      {selectedPayout.doctor?.name || "Doctor"}&apos;s account
                    </li>
                    <li>Mark the payout request as PROCESSED</li>
                    <li>Update doctor earnings and payout history</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-muted/20 p-4 rounded-lg border border-teal-900/20 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="text-white font-medium">
                    Dr. {selectedPayout.doctor?.name || "Doctor"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Payout:</span>
                  <span className="text-teal-400 font-semibold text-base">
                    ${selectedPayout.netAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PayPal:</span>
                  <span className="text-white text-xs font-mono break-all">
                    {selectedPayout.paypalEmail}
                  </span>
                </div>
              </div>
            </div>

            {loading && <BarLoader width={"100%"} color="#36d7b7" />}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={closeDialogs}
                disabled={loading}
                className="border-teal-900/30 text-white hover:bg-muted/80"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PendingPayouts;
