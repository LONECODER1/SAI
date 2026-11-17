"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  User,
  Search,
  Sparkles,
  Filter,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppointmentCard } from "@/components/appointment-card";

const DoctorAppointmentsList = ({ appointments = [] }) => {
  const [filter, setFilter] = useState("all"); // 'all', 'ready', 'scheduled', 'completed'
  const [searchQuery, setSearchQuery] = useState("");

  const now = new Date();

  const isAppointmentActive = (app) => {
    if (app.status !== "SCHEDULED") return false;
    const startTime = new Date(app.startTime);
    const endTime = new Date(app.endTime);
    return (
      (startTime.getTime() - now.getTime() <= 30 * 60 * 1000 && now < startTime) ||
      (now >= startTime && now <= endTime)
    );
  };

  const readyToJoinList = useMemo(
    () => appointments.filter((a) => isAppointmentActive(a)),
    [appointments]
  );

  const scheduledList = useMemo(
    () => appointments.filter((a) => a.status === "SCHEDULED"),
    [appointments]
  );

  const completedList = useMemo(
    () => appointments.filter((a) => a.status === "COMPLETED"),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // 1. Tab filter
      if (filter === "ready" && !isAppointmentActive(app)) return false;
      if (filter === "scheduled" && app.status !== "SCHEDULED") return false;
      if (filter === "completed" && app.status !== "COMPLETED") return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = app.patient?.name?.toLowerCase() || "";
        const patientEmail = app.patient?.email?.toLowerCase() || "";
        const symptoms = app.patientDescription?.toLowerCase() || "";
        return (
          patientName.includes(q) ||
          patientEmail.includes(q) ||
          symptoms.includes(q)
        );
      }

      return true;
    });
  }, [appointments, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Quick KPI Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card/90 border border-teal-900/30 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">All Consultations</span>
            <Calendar className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-white">{appointments.length}</p>
        </div>

        <div
          onClick={() => setFilter("ready")}
          className={`cursor-pointer border rounded-xl p-3.5 transition-all shadow-sm ${
            readyToJoinList.length > 0
              ? "bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-950/50"
              : "bg-card/90 border-teal-900/30 hover:border-teal-700/40"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-emerald-300 font-medium">Ready to Join</span>
            <Video className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-white">{readyToJoinList.length}</p>
            {readyToJoinList.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
        </div>

        <div
          onClick={() => setFilter("scheduled")}
          className="cursor-pointer bg-card/90 border border-teal-900/30 hover:border-teal-700/40 rounded-xl p-3.5 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">Upcoming Scheduled</span>
            <Clock className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-white">{scheduledList.length}</p>
        </div>

        <div
          onClick={() => setFilter("completed")}
          className="cursor-pointer bg-card/90 border border-teal-900/30 hover:border-teal-700/40 rounded-xl p-3.5 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-white">{completedList.length}</p>
        </div>
      </div>

      {/* 2. Main Appointment Manager Card */}
      <Card className="border-teal-900/30 bg-card shadow-xl">
        <CardHeader className="pb-4 border-b border-teal-900/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-400" />
                Patient Consultations & Video Room
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                View patient names, join times, launch meetings, and record clinical notes & prescriptions.
              </CardDescription>
            </div>

            {/* Search Patient Box */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, email..."
                className="pl-8 bg-background/80 border-teal-900/30 text-xs h-9"
              />
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "all"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "bg-muted/20 text-muted-foreground hover:text-white"
              }`}
            >
              All ({appointments.length})
            </button>

            <button
              onClick={() => setFilter("ready")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === "ready"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "bg-muted/20 text-emerald-400/80 hover:text-emerald-300"
              }`}
            >
              <Video className="h-3 w-3" />
              <span>Ready to Join ({readyToJoinList.length})</span>
              {readyToJoinList.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setFilter("scheduled")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "scheduled"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "bg-muted/20 text-muted-foreground hover:text-white"
              }`}
            >
              Upcoming ({scheduledList.length})
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "completed"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "bg-muted/20 text-muted-foreground hover:text-white"
              }`}
            >
              Completed ({completedList.length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="DOCTOR"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">
                {searchQuery ? "No matching patients found" : "No consultations found"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "Try clearing your search query to see all appointments."
                  : filter === "ready"
                  ? "No video consultations are ready to join right now. Patients can join 30 minutes before their scheduled time."
                  : "You don't have any appointments in this category. Ensure your availability is updated to accept new patient bookings."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAppointmentsList;
