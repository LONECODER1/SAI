import React from "react";
import { TabsContent } from "@/components/ui/tabs";

import PendingDoctors from "./_components/PendingDoctors";
import VerifiedDoctors from "./_components/VerifiedDoctors";
import PendingPayouts from "./_components/pendingpayout";
import PendingStores from "./_components/PendingStores";
import VerifiedStores from "./_components/VerifiedStores";

import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
  getProcessedPayouts,
  getPendingStores,
  getVerifiedStores,
} from "@/actions/admin";

const AdminPage = async () => {
  const [
    pendingDoctorsData,
    verifiedDoctorsData,
    pendingPayoutsData,
    processedPayoutsData,
    pendingStoresData,
    verifiedStoresData,
  ] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getPendingPayouts(),
    getProcessedPayouts(),
    getPendingStores(),
    getVerifiedStores(),
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

      <TabsContent value="pending-stores" className="border-none p-0">
        <PendingStores stores={pendingStoresData.stores || []} />
      </TabsContent>

      <TabsContent value="stores" className="border-none p-0">
        <VerifiedStores stores={verifiedStoresData.stores || []} />
      </TabsContent>
    </>
  );
};

export default AdminPage;
