"use client";

import { bookAppointment } from "@/actions/appointments";
import useFetch from "@/hooks/use-fetch";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const AppointmentForm = ({ doctorId, slot, onBack, onComplete }) => {
  const [description, setDescription] = useState("");

  const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("doctorId", doctorId);
    formData.append("startTime", slot.startTime);
    formData.append("endTime", slot.endTime);
    formData.append("description", description);

    const res = await submitBooking(formData);
    if (res?.success) {
      toast.success("Appointment booked successfully!");
      onComplete();
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="bg-[#060a0f] p-5 rounded-2xl border border-teal-900/40 space-y-3">
        <div className="flex items-center text-sm sm:text-base">
          <Calendar className="h-4 w-4 text-teal-400 mr-2.5 shrink-0" />
          <span className="text-white font-semibold">
            {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>

        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 text-teal-400 mr-2.5 shrink-0" />
          <span className="text-white font-medium">{slot.formatted} (30 Minutes Video Consult)</span>
        </div>

        <div className="flex items-center text-sm pt-2 border-t border-white/5">
          <CreditCard className="h-4 w-4 text-teal-400 mr-2.5 shrink-0" />
          <span className="text-muted-foreground">
            Consultation Fee:
            <span className="text-teal-300 font-bold ml-1">2 Credits (₹1,600)</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white font-medium text-xs sm:text-sm">
          Describe your symptoms or medical concern (optional)
        </Label>

        <Textarea
          id="description"
          placeholder="Please provide any details about your symptoms, medical history, or what you would like to discuss with the doctor..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-[#060a0f] border-teal-900/35 rounded-2xl h-32 text-sm text-white focus-visible:ring-teal-500"
        />

        <p className="text-xs text-muted-foreground">
          This clinical note will be shared with the verified doctor in advance of your encrypted Vonage video session.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="border-teal-900/40 text-teal-300 hover:bg-teal-950/30 text-xs sm:text-sm h-11 px-5 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change Time Slot
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm h-11 px-7 rounded-xl shadow-lg shadow-teal-900/40"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming Booking...
            </>
          ) : (
            "Confirm & Book Video Appointment"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;
