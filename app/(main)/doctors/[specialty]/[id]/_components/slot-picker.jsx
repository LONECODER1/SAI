"use client";

import React, { useState } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SlotPicker = ({ days = [], onSelectSlot }) => {
  const firstDayWithSlots =
    days.find((day) => day.slots && day.slots.length > 0)?.date || days[0]?.date;

  const [selectedDate, setSelectedDate] = useState(firstDayWithSlots);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const currentDay = days.find((day) => day.date === selectedDate) || days[0];
  const slots = currentDay?.slots || [];

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (selectedSlot && onSelectSlot) {
      onSelectSlot(selectedSlot);
    }
  };

  // Categorize slots by time of day
  const morningSlots = [];
  const afternoonSlots = [];
  const eveningSlots = [];

  slots.forEach((slot) => {
    const slotDate = new Date(slot.startTime);
    const hour = slotDate.getHours();
    if (hour < 12) {
      morningSlots.push(slot);
    } else if (hour < 17) {
      afternoonSlots.push(slot);
    } else {
      eveningSlots.push(slot);
    }
  });

  const getDayLabel = (dateStr) => {
    try {
      const d = parseISO(dateStr);
      if (isToday(d)) return "Today";
      if (isTomorrow(d)) return "Tomorrow";
      return format(d, "EEE");
    } catch {
      return "Day";
    }
  };

  const renderSlotGroup = (title, icon, groupSlots) => {
    if (groupSlots.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
          {icon}
          <span>{title} ({groupSlots.length})</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {groupSlots.map((slot) => {
            const isSelected = selectedSlot?.startTime === slot.startTime;
            const startTimeDate = new Date(slot.startTime);
            const formattedTime = format(startTimeDate, "h:mm a");

            return (
              <button
                key={slot.startTime}
                type="button"
                onClick={() => handleSlotClick(slot)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between space-y-1.5 cursor-pointer relative ${
                  isSelected
                    ? "bg-teal-950/70 border-teal-400 ring-2 ring-teal-500/50 shadow-lg shadow-teal-950/50 text-white -translate-y-0.5"
                    : "bg-[#080e16] border-teal-900/40 text-muted-foreground hover:text-white hover:border-teal-700 hover:bg-teal-950/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`h-3.5 w-3.5 ${
                        isSelected ? "text-teal-400" : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-bold text-sm text-white">
                      {formattedTime}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-teal-400 fill-teal-400/20 shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                  <span className={isSelected ? "text-teal-300" : "text-muted-foreground"}>
                    30 Min Consult
                  </span>
                  <span className="text-[10px] text-teal-400/80 font-mono">
                    Video
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. DATE SELECTION CAROUSEL / ROW */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Select Date:
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {days.map((day) => {
            const isSelected = selectedDate === day.date;
            const hasSlots = day.slots && day.slots.length > 0;
            const dayDate = parseISO(day.date);
            const dayLabel = getDayLabel(day.date);
            const dateNum = format(dayDate, "d MMM");

            return (
              <button
                key={day.date}
                type="button"
                disabled={!hasSlots}
                onClick={() => {
                  setSelectedDate(day.date);
                  setSelectedSlot(null); // Reset slot when switching day
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all duration-150 flex flex-col items-center justify-center space-y-1 ${
                  !hasSlots
                    ? "opacity-40 cursor-not-allowed bg-muted/5 border-transparent"
                    : isSelected
                    ? "bg-teal-950/60 border-teal-500 ring-2 ring-teal-500/40 text-white shadow-lg shadow-teal-950/50"
                    : "bg-[#080e16] border-teal-900/35 text-muted-foreground hover:text-white hover:border-teal-700 hover:bg-teal-950/20"
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isSelected ? "text-teal-400" : "text-muted-foreground"
                  }`}
                >
                  {dayLabel}
                </span>

                <span className="text-base sm:text-lg font-black text-white">
                  {dateNum}
                </span>

                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0 mt-0.5 ${
                    !hasSlots
                      ? "border-muted text-muted-foreground"
                      : isSelected
                      ? "border-teal-600 bg-teal-900/50 text-teal-200"
                      : "border-teal-900/40 text-teal-400/90"
                  }`}
                >
                  {hasSlots ? `${day.slots.length} Slots` : "No Slots"}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TIME SLOTS SECTION */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#060a0f] border border-teal-900/35 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-900/30">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-400" />
              Available Time Slots for {format(parseISO(selectedDate), "EEEE, MMMM d")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select your preferred 30-minute encrypted Vonage video consultation slot.
            </p>
          </div>

          <Badge className="bg-teal-950/60 border border-teal-700/60 text-teal-300 text-xs self-start sm:self-center">
            {slots.length} Available Slots
          </Badge>
        </div>

        {slots.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto text-teal-900/50 mb-2" />
            <p className="text-sm text-white font-medium">No available slots for this date</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please choose another day from the calendar above.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {renderSlotGroup("Morning Slots", <Sun className="h-4 w-4 text-amber-400" />, morningSlots)}
            {renderSlotGroup("Afternoon Slots", <Sunset className="h-4 w-4 text-orange-400" />, afternoonSlots)}
            {renderSlotGroup("Evening Slots", <Moon className="h-4 w-4 text-cyan-400" />, eveningSlots)}
          </div>
        )}
      </div>

      {/* 3. CONFIRMATION & ACTION BOTTOM BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-950/50 to-card border border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          {selectedSlot ? (
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <CheckCircle2 className="h-4 w-4 text-teal-400" />
                <span>
                  {format(new Date(selectedSlot.startTime), "EEEE, MMM d")} at{" "}
                  {format(new Date(selectedSlot.startTime), "h:mm a")}
                </span>
              </div>
              <p className="text-xs text-teal-300/90 flex items-center gap-1.5 mt-0.5">
                <Video className="h-3.5 w-3.5" />
                Encrypted Vonage Telehealth Video Call • 2 Credits (₹1,600)
              </p>
            </div>
          ) : (
            <div>
              <span className="text-sm font-semibold text-white block">
                No Time Slot Selected Yet
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any convenient time slot above to unlock consultation booking.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selectedSlot}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm h-11 px-6 gap-2 rounded-xl shadow-lg shadow-teal-900/40 shrink-0 disabled:opacity-50"
        >
          <span>Continue to Consultation Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SlotPicker;
