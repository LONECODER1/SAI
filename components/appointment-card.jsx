"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CheckCircle,
  FileText,
  Pill,
  ShoppingBag,
  Copy,
} from "lucide-react";
import Link from "next/link";
import PrescriptionModal from "@/app/(main)/doctor/_components/prescription-modal";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelAppointment,
  addAppointmentNotes,
  markAppointmentCompleted,
} from "@/actions/doctor";
import { generateVideoToken } from "@/actions/appointments";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const QUICK_CHIPS = [
  "Adequate hydration & complete bed rest",
  "Warm salt water gargle 3 times daily",
  "Monitor body temperature every 6 hours",
  "Avoid oily, cold, and spicy heavy foods",
  "Follow up in 5-7 days if symptoms persist",
];

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    // Update current time every 10 seconds to auto-enable the video call button
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);

  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);

  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);

  const {
    loading: completeLoading,
    fn: submitMarkCompleted,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h a");
    } catch (e) {
      return "Invalid date";
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h a");
    } catch (e) {
      return "Invalid time";
    }
  };

  const canMarkCompleted = () => {
    if (userRole !== "DOCTOR" || appointment.status !== "SCHEDULED") {
      return false;
    }
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);
    return now >= appointmentEndTime;
  };

  const handleCancelAppointment = async () => {
    if (cancelLoading) return;
    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      const res = await submitCancel(formData);
      if (res?.success) {
        toast.success("Appointment cancelled successfully");
        setOpen(false);
        if (refetchAppointments) {
          refetchAppointments();
        } else {
          router.refresh();
        }
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (completeLoading) return;

    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      alert(
        "Cannot mark appointment as completed before the scheduled end time."
      );
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to mark this appointment as completed? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      const res = await submitMarkCompleted(formData);
      if (res?.success) {
        toast.success("Appointment marked as completed");
        setOpen(false);
        if (refetchAppointments) {
          refetchAppointments();
        } else {
          router.refresh();
        }
      }
    }
  };

  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "DOCTOR") return;
    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("notes", notes);
    const res = await submitNotes(formData);
    if (res?.success) {
      toast.success("Notes saved successfully");
      setAction(null);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  };

  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;
    setAction("video");

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    const res = await submitTokenRequest(formData);
    if (res?.success) {
      router.push(
        `/video-call?sessionId=${res.videoSessionId}&token=${res.token}&appointmentId=${appointment.id}`
      );
    } else if (res?.error) {
      setAction(null);
    }
  };

  const handleCopyAdvice = () => {
    if (!appointment.notes) return;
    navigator.clipboard.writeText(appointment.notes);
    toast.success("Doctor advice copied to clipboard!");
  };



  const isAppointmentActive = () => {
    const now = currentTime;
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    return (
      (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  const getTimeRemainingToJoin = () => {
    const now = currentTime;
    const appointmentTime = new Date(appointment.startTime);
    const joinTime = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
    
    const diffMs = joinTime.getTime() - now.getTime();
    if (diffMs <= 0) return "";
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) {
      return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    if (diffHours < 24) {
      return `in ${diffHours} hr${diffHours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hr` : ''}`;
  };

  const otherParty =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;
  const otherPartyLabel = userRole === "DOCTOR" ? "Patient" : "Doctor";
  const otherPartyIcon = userRole === "DOCTOR" ? <User /> : <Stethoscope />;

  return (
    <>
      <Card className="border-teal-900/30 hover:border-teal-700/50 bg-card/90 transition-all shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="bg-teal-950/60 border border-teal-800/40 rounded-xl p-2.5 mt-0.5 text-teal-400">
                {otherPartyIcon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-white">
                    {userRole === "DOCTOR"
                      ? otherParty.name
                      : `Dr. ${otherParty.name}`}
                  </h3>
                  {userRole === "DOCTOR" && otherParty.email && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ({otherParty.email})
                    </span>
                  )}
                  {userRole === "PATIENT" && otherParty.specialty && (
                    <Badge variant="outline" className="border-teal-800/40 text-teal-300 text-xs">
                      {otherParty.specialty}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center text-slate-300">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-teal-400" />
                    <span>{formatDateTime(appointment.startTime)}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <Clock className="h-3.5 w-3.5 mr-1 text-teal-400" />
                    <span>
                      {formatTime(appointment.startTime)} -{" "}
                      {formatTime(appointment.endTime)}
                    </span>
                  </div>
                </div>

                {/* Patient Symptoms/Complaint Snippet */}
                {appointment.patientDescription && (
                  <div className="mt-2.5 p-2 rounded-lg bg-muted/20 border border-teal-900/30 text-xs">
                    <span className="text-teal-400 font-semibold mr-1.5">Symptoms:</span>
                    <span className="text-slate-200 line-clamp-1">{appointment.patientDescription}</span>
                  </div>
                )}

                {/* Doctor Notes / Advice Snippet */}
                {appointment.notes && (
                  <div className="mt-2 p-2 rounded-lg bg-teal-950/30 border border-teal-800/40 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span className="text-teal-300 font-semibold shrink-0">
                        {userRole === "DOCTOR" ? "Doctor Notes:" : "Doctor Advice:"}
                      </span>
                      <span className="text-slate-300 truncate">{appointment.notes}</span>
                    </div>
                    <span className="text-[10px] text-teal-400 font-medium shrink-0 ml-2">Recorded</span>
                  </div>
                )}

                {/* Prescription Badge Snippet */}
                {appointment.prescription && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] border-teal-700/60 bg-teal-950/40 text-teal-300">
                      <Pill className="h-3 w-3 mr-1 text-teal-400" />
                      Digital Rx Issued ({appointment.prescription.items?.length || 0} meds)
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Column */}
            <div className="flex flex-col items-end justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {appointment.status === "SCHEDULED" && (
                  isAppointmentActive() ? (
                    <Badge className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs px-2.5 py-1 gap-1.5 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Ready to Join Now</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-teal-800/40 bg-teal-950/20 text-teal-300 text-xs px-2.5 py-1 gap-1.5">
                      <Clock className="h-3 w-3 text-teal-400" />
                      <span>Starts {getTimeRemainingToJoin()}</span>
                    </Badge>
                  )
                )}

                <Badge
                  variant="outline"
                  className={
                    appointment.status === "COMPLETED"
                      ? "bg-teal-900/20 border-teal-900/30 text-teal-400"
                      : appointment.status === "CANCELLED"
                      ? "bg-red-900/20 border-red-900/30 text-red-400"
                      : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                  }
                >
                  {appointment.status}
                </Badge>
              </div>

              {/* Action Buttons: Direct "Start Meet" / "Join Meet" Button */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {appointment.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    onClick={handleJoinVideoCall}
                    disabled={!isAppointmentActive() || tokenLoading || action === "video"}
                    className={`text-xs gap-1.5 shadow-md ${
                      isAppointmentActive()
                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-900/40 font-semibold"
                        : "border border-teal-900/40 bg-muted/20 text-muted-foreground opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {tokenLoading || action === "video" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Video className="h-3.5 w-3.5" />
                        {userRole === "DOCTOR"
                          ? isAppointmentActive()
                            ? "Start Meet"
                            : `Start Meet (${getTimeRemainingToJoin() || "Soon"})`
                          : isAppointmentActive()
                          ? "Join Consultation"
                          : `Join (${getTimeRemainingToJoin() || "Soon"})`}
                      </>
                    )}
                  </Button>
                )}

                {canMarkCompleted() && (
                  <Button
                    size="sm"
                    onClick={handleMarkCompleted}
                    disabled={completeLoading}
                    className="bg-teal-700 hover:bg-teal-800 text-xs"
                  >
                    {completeLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Complete
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="border-teal-900/40 hover:bg-teal-900/20 text-teal-300 text-xs"
                  onClick={() => setOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === "SCHEDULED"
                ? "Manage your upcoming appointment"
                : "View appointment information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {otherPartyLabel}
              </h4>
              <div className="flex items-center">
                <div className="h-5 w-5 text-teal-400 mr-2">
                  {otherPartyIcon}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {userRole === "DOCTOR"
                      ? otherParty.name
                      : `Dr. ${otherParty.name}`}
                  </p>
                  {userRole === "DOCTOR" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.email}
                    </p>
                  )}
                  {userRole === "PATIENT" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.specialty}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Scheduled Time
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-teal-400 mr-2" />
                  <p className="text-white">
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-teal-400 mr-2" />
                  <p className="text-white">
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Status
              </h4>
              <Badge
                variant="outline"
                className={
                  appointment.status === "COMPLETED"
                    ? "bg-teal-900/20 border-teal-900/30 text-teal-400"
                    : appointment.status === "CANCELLED"
                    ? "bg-red-900/20 border-red-900/30 text-red-400"
                    : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                }
              >
                {appointment.status}
              </Badge>
            </div>

            {appointment.patientDescription && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {userRole === "DOCTOR"
                    ? "Patient Description"
                    : "Your Description"}
                </h4>
                <div className="p-3 rounded-md bg-muted/20 border border-teal-900/20">
                  <p className="text-white whitespace-pre-line">
                    {appointment.patientDescription}
                  </p>
                </div>
              </div>
            )}

            {appointment.status === "SCHEDULED" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Video Consultation
                </h4>
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={
                    !isAppointmentActive() || action === "video" || tokenLoading
                  }
                  onClick={handleJoinVideoCall}
                >
                  {tokenLoading || action === "video" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing Video Call...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      {isAppointmentActive()
                        ? "Join Video Call"
                        : `Video call available ${getTimeRemainingToJoin()}`}
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {userRole === "DOCTOR"
                    ? "Physician Clinical Notes & Patient Advice"
                    : "Doctor's Advice & Care Summary"}
                </h4>
                <div className="flex items-center gap-2">
                  {userRole === "PATIENT" && appointment.notes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAdvice}
                      className="h-7 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/20"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Advice
                    </Button>
                  )}
                  {userRole === "DOCTOR" &&
                    action !== "notes" &&
                    appointment.status !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAction("notes")}
                        className="h-7 text-teal-400 hover:text-teal-300 hover:bg-teal-900/20 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        {appointment.notes ? "Edit Notes" : "Add Notes"}
                      </Button>
                    )}
                </div>
              </div>

              {userRole === "DOCTOR" && action === "notes" ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter clinical observations, dietary suggestions, precautions, or lab test instructions..."
                    className="bg-background border-teal-900/30 text-xs min-h-[110px]"
                  />
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-1 font-medium">
                      1-Click Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_CHIPS.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNotes((prev) => (prev ? `${prev.trim()}\n• ${chip}` : `• ${chip}`))}
                          className="text-[10px] px-2 py-0.5 rounded bg-teal-950/40 border border-teal-800/40 text-teal-300 hover:bg-teal-900/40 transition-colors"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAction(null);
                        setNotes(appointment.notes || "");
                      }}
                      disabled={notesLoading}
                      className="border-teal-900/30 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={notesLoading}
                      className="bg-teal-600 hover:bg-teal-700 text-xs font-semibold"
                    >
                      {notesLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Saving & Delivering...
                        </>
                      ) : (
                        "Save & Deliver Notes to Patient"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/30 min-h-[80px]">
                  {appointment.notes ? (
                    <p className="text-white text-xs leading-relaxed whitespace-pre-line">
                      {appointment.notes}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">
                      No clinical notes recorded yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Digital Prescription Display & Actions */}
            {appointment.prescription && (
              <div className="space-y-3 p-4 rounded-xl bg-teal-950/20 border border-teal-800/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-teal-300 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    Verified Digital E-Prescription
                  </h4>
                  <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs">
                    {appointment.prescription.items?.length || 0} Prescribed Items
                  </Badge>
                </div>

                {appointment.prescription.diagnosis && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-white font-medium">Diagnosis:</span>{" "}
                    {appointment.prescription.diagnosis}
                  </p>
                )}

                <div className="space-y-1.5 pt-1">
                  {appointment.prescription.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-card/60 border border-teal-900/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{item.medicineName}</span>
                        {item.genericName && (
                          <span className="text-muted-foreground ml-1.5">
                            ({item.genericName})
                          </span>
                        )}
                        <p className="text-[11px] text-teal-400 mt-0.5">
                          Dosage: {item.dosage} • {item.durationDays} Days ({item.quantity} units)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Patient Order Action */}
                {userRole === "PATIENT" && (
                  <div className="pt-2">
                    <Link href={`/dashboard?tab=medicines&prescriptionId=${appointment.prescription.id}`}>
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-2 shadow-lg shadow-teal-900/40">
                        <ShoppingBag className="h-4 w-4" />
                        Order Prescribed Medicines (Lowest Local Price)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex pt-4 sm:flex-row flex-wrap gap-2">
            {userRole === "DOCTOR" && (
              <PrescriptionModal appointment={appointment} />
            )}

            <div className="flex gap-2 w-full sm:w-auto">
              {canMarkCompleted() && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={completeLoading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {appointment.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10 mt-3 sm:mt-0"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}