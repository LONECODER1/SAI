import React from "react";
import { TabsContent } from "@/components/ui/tabs";

import PendingDoctors from "./_components/PendingDoctors";
import VerifiedDoctors from "./_components/VerifiedDoctors";
import PendingPayouts from "./_components/pendingpayout";

import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
  getProcessedPayouts,
} from "@/actions/admin";

const AdminPage = async () => {
  const [
    pendingDoctorsData,
    verifiedDoctorsData,
    pendingPayoutsData,
    processedPayoutsData,
  ] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getPendingPayouts(),
    getProcessedPayouts(),
  ]);

  return (
    <>
      <TabsContent value="pending" className="border-none p-0">
        <PendingDoctors doctors={pendingDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="doctors" className="border-none p-0">
        <VerifiedDoctors doctors={verifiedDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="payouts" className="border-none p-0">
        <PendingPayouts
          payouts={pendingPayoutsData.payouts || []}
          processedPayouts={processedPayoutsData.payouts || []}
        />
      </TabsContent>
    </>
  );
};

export default AdminPage;
