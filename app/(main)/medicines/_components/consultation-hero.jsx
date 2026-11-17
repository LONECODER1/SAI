"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Calendar,
  Video,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function ConsultationHero({ upcomingAppointment = null }) {
  const specialties = [
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Psychiatrist",
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-950/40 via-card to-background border border-teal-900/40 p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Consult Suggestion Banner */}
        <div className="space-y-3 max-w-2xl">
          <Badge
            variant="outline"
            className="bg-teal-900/30 border-teal-700/50 text-teal-300 gap-1.5 py-1 px-3 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            Verified Clinical Telehealth
          </Badge>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Need Medical Guidance Before Taking Medicines?
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Consult verified doctors in under 10 minutes via encrypted video. Get an authentic digital e-prescription that auto-matches the lowest local pharmacy prices in your neighborhood.
          </p>

          {/* Specialty Quick Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Popular Specialties:
            </span>
            {specialties.map((spec) => (
              <Link key={spec} href={`/doctors/${encodeURIComponent(spec)}`}>
                <Badge
                  variant="outline"
                  className="border-teal-800/40 hover:border-teal-600 bg-muted/20 hover:bg-teal-900/20 text-teal-300 text-xs py-1 px-2.5 transition-all cursor-pointer"
                >
                  {spec}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Upcoming Appointment Card OR Instant Consult CTA */}
        <div className="w-full lg:w-96 shrink-0">
          {upcomingAppointment ? (
            <div className="p-4 rounded-xl bg-card border border-teal-700/50 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-teal-900/40 border border-teal-600/50 text-teal-300 text-xs gap-1">
                  <Clock className="h-3 w-3" /> Upcoming Consultation
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Today
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="p-2.5 rounded-full bg-teal-900/30 text-teal-400">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Dr. {upcomingAppointment.doctor?.name || "Specialist"}
                  </h4>
                  <p className="text-xs text-teal-400">
                    {upcomingAppointment.doctor?.specialty || "General Consultation"}
                  </p>
                </div>
              </div>

              <Link href="/dashboard?tab=doctors" className="block pt-1">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2">
                  <Video className="h-4 w-4" />
                  Join Consultation Room
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-teal-950/30 border border-teal-900/30 text-center space-y-3.5">
              <div className="mx-auto w-10 h-10 rounded-full bg-teal-900/40 flex items-center justify-center text-teal-400 border border-teal-700/40">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Book a Specialist Consultation
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available slots starting right now with certified doctors
                </p>
              </div>
              <Link href="/doctors" className="block">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2">
                  Book Doctor Consultation
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
