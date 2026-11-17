import { getPatientAppointments } from "@/actions/patient";
import { getPatientOrders } from "@/actions/orders";
import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import React from "react";
import { Calendar, ShoppingBag, Pill, Clock, Store, MapPin, Truck } from "lucide-react";
import Link from "next/link";

import PageHeader from "@/components/page-header";
import { AppointmentCard } from "@/components/appointment-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PatientAppointmentsPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/onboarding");
  }

  const [appointmentsRes, ordersRes] = await Promise.all([
    getPatientAppointments(),
    getPatientOrders(),
  ]);

  const appointments = appointmentsRes.appointments || [];
  const error = appointmentsRes.error || null;
  const orders = ordersRes.orders || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageHeader
        icon={<Calendar />}
        title="Patient Health Dashboard"
        backLink="/doctors"
        backLabel="Find Doctors"
      />

      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="bg-muted/30 border border-teal-900/30 p-1 rounded-xl">
          <TabsTrigger
            value="appointments"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Doctor Appointments ({appointments.length})
          </TabsTrigger>

          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Medicine Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Appointments */}
        <TabsContent value="appointments">
          <Card className="border-teal-900/20 bg-card">
            <CardContent className="pt-4">
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-400">Error: {error}</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      userRole="PATIENT"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    No appointments scheduled
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                    You don&apos;t have any consultations scheduled. Browse our specialists and connect with a certified doctor.
                  </p>
                  <Link href="/doctors">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                      Find a Doctor
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Medicine Orders (Ported & Elevated from Medstore getorderhistory) */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-card border border-teal-900/20">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium text-white mb-2">No Medicine Orders Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                Explore local pharmacies nearby for fast delivery or 15-minute counter pickup with generic substitute savings.
              </p>
              <Link href="/medicines">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                  Browse Medicines Storefront
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="bg-card border-teal-900/30 hover:border-teal-700/40 transition-all p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-muted/20 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-teal-400">
                        {order.orderNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          order.status === "DELIVERED"
                            ? "bg-emerald-950/30 border-emerald-700 text-emerald-400 text-xs"
                            : order.status === "CANCELLED"
                            ? "bg-red-950/30 border-red-700 text-red-400 text-xs"
                            : "bg-amber-950/30 border-amber-700 text-amber-300 text-xs"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Ordered: {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs text-muted-foreground">
                    <div>
                      <span className="text-white font-semibold block flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-teal-400" />
                        Fulfilling Dukaan: {order.store?.storeName || "Local Pharmacy"}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block">
                        Phone: {order.store?.phone || "Verified Store"}
                      </span>
                    </div>

                    <div>
                      <span className="text-white font-semibold block flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-teal-400" />
                        {order.deliveryType === "HOME_DELIVERY" ? "Doorstep Delivery" : "Store Counter Pickup"}
                      </span>
                      <span className="line-clamp-1 mt-0.5 block">{order.deliveryAddress}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/10 mt-3 space-y-1.5 text-xs">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-white">
                        <span>
                          {item.product?.name || "Medicine"} × {item.quantity}
                        </span>
                        <span className="font-medium">₹{item.totalPrice}</span>
                      </div>
                    ))}
                    <div className="border-t border-muted/20 pt-1.5 flex justify-between font-bold text-sm text-white">
                      <span>Total Paid:</span>
                      <span className="text-teal-400">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientAppointmentsPage;
