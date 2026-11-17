"use client";

import React, { useRef, useState, useEffect } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  User,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  FileText,
  Stethoscope,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  PanelRightClose,
  PanelRightOpen,
  Pill,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { addAppointmentNotes } from "@/actions/doctor";
import PrescriptionModal from "@/app/(main)/doctor/_components/prescription-modal";

const QUICK_SUGGESTIONS = [
  "Adequate hydration & complete bed rest",
  "Warm salt water gargle 3 times daily",
  "Monitor body temperature every 6 hours",
  "Avoid oily, cold, and heavy spicy food",
  "Follow up in 5-7 days if symptoms persist",
  "Routine CBC & Blood panel recommended",
];

const VideoCall = ({
  sessionId,
  token,
  appointmentId,
  initialAppointment = null,
  userRole = "PATIENT",
}) => {
  const effectiveRole = userRole || "PATIENT";
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isPublisherReady, setIsPublisherReady] = useState(false);

  // In-call Consultation State
  const [appointment, setAppointment] = useState(initialAppointment);
  const [notes, setNotes] = useState(initialAppointment?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);

  const sessionRef = useRef(null);
  const publisherRef = useRef(null);
  const localStreamRef = useRef(null);

  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;
  const isMockSession =
    sessionId?.startsWith("mock_session_") ||
    token?.startsWith("mock_token_");

  // Call duration counter
  useEffect(() => {
    let timer = null;
    if (isConnected) {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  const formatCallDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startMockSession = async () => {
    setIsLoading(false);
    setIsConnected(true);
    setIsPublisherReady(true);

    try {
      if (typeof navigator !== "undefined" && navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        const pubElement = document.getElementById("publisher");
        if (pubElement) {
          pubElement.innerHTML = "";
          const videoEl = document.createElement("video");
          videoEl.autoplay = true;
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.srcObject = stream;
          videoEl.className = "w-full h-full object-cover rounded-2xl";
          pubElement.appendChild(videoEl);
        }
      }
    } catch (mediaErr) {
      console.warn("Camera/mic permission for mock stream:", mediaErr.message);
    }
  };

  const initializeSession = () => {
    if (!sessionId || !token) {
      toast.error("Missing required video call parameters");
      router.push(effectiveRole === "DOCTOR" ? "/doctor" : "/dashboard?tab=doctors");
      return;
    }

    if (isMockSession) {
      startMockSession();
      return;
    }

    if (!appId) {
      toast.error("Missing Vonage Application ID");
      router.push(effectiveRole === "DOCTOR" ? "/doctor" : "/dashboard?tab=doctors");
      return;
    }

    try {
      sessionRef.current = window.OT.initSession(appId, sessionId);

      sessionRef.current.on("streamCreated", (event) => {
        sessionRef.current.subscribe(
          event.stream,
          "subscriber",
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
          },
          (error) => {
            if (error) {
              toast.error("Error connecting to other participant's stream");
            }
          }
        );
      });

      publisherRef.current = window.OT.initPublisher(
        "publisher",
        {
          insertMode: "replace",
          width: "100%",
          height: "100%",
          publishAudio: isAudioEnabled,
          publishVideo: isVideoEnabled,
        },
        (error) => {
          if (error) {
            console.error("Publisher error:", error);
            toast.error("Error initializing your camera and microphone");
          } else {
            console.log("Publisher initialized successfully");
            setIsPublisherReady(true);
          }
        }
      );

      sessionRef.current.on("sessionDisconnected", () => {
        setIsConnected(false);
      });

      sessionRef.current.connect(token, (error) => {
        if (error) {
          toast.error("Error connecting to video session");
        } else {
          setIsConnected(true);
          setIsLoading(false);

          if (publisherRef.current) {
            sessionRef.current.publish(publisherRef.current, (error) => {
              if (error) {
                console.error("Error publishing stream:", error);
                if (error.name !== "OT_USER_MEDIA_ACCESS_DENIED") {
                  toast.error("Error publishing your stream");
                }
              } else {
                console.log("Stream published successfully");
              }
            });
          }
        }
      });
    } catch (error) {
      toast.error("Failed to initialize video call");
      setIsLoading(false);
    }
  };

  // If it's a mock session, initialize immediately without waiting for OpenTok script
  useEffect(() => {
    if (isMockSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScriptLoaded(true);
      initializeSession();
    }
  }, [isMockSession]);

  const handleScriptLoad = () => {
    setScriptLoaded(true);

    if (isMockSession) {
      return;
    }

    if (!window.OT) {
      toast.error("Failed to load Vonage Video API");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      initializeSession();
    }, 100);
  };

  const toggleVideo = () => {
    if (isMockSession && localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
      setIsVideoEnabled((prev) => !prev);
      return;
    }

    if (publisherRef.current) {
      publisherRef.current.publishVideo(!isVideoEnabled);
      setIsVideoEnabled((prev) => !prev);
    }
  };

  const toggleAudio = () => {
    if (isMockSession && localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
      setIsAudioEnabled((prev) => !prev);
      return;
    }

    if (publisherRef.current) {
      publisherRef.current.publishAudio(!isAudioEnabled);
      setIsAudioEnabled((prev) => !prev);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (publisherRef.current) {
      publisherRef.current.destroy();
      publisherRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }

    toast.info("Video consultation ended");
    router.push(effectiveRole === "DOCTOR" ? "/doctor" : "/dashboard?tab=doctors");
  };

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (publisherRef.current) {
        publisherRef.current.destroy();
      }

      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  // Doctor: Save consultation notes live during meet
  const handleSaveNotes = async () => {
    if (isSavingNotes) return;
    setIsSavingNotes(true);
    setNotesSavedSuccess(false);

    try {
      const activeId = appointmentId || appointment?.id;
      if (!activeId) {
        toast.error("Appointment ID not found");
        return;
      }

      const formData = new FormData();
      formData.append("appointmentId", activeId);
      formData.append("notes", notes);

      const res = await addAppointmentNotes(formData);
      if (res?.success) {
        setNotesSavedSuccess(true);
        if (res.appointment) {
          setAppointment(res.appointment);
        }
        toast.success("Consultation notes & advice saved and delivered to patient!");
        setTimeout(() => setNotesSavedSuccess(false), 3000);
      } else {
        toast.error(res?.error || "Failed to save notes");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddQuickSuggestion = (suggestion) => {
    setNotes((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n• ${suggestion}` : `• ${suggestion}`;
    });
  };

  const handleCopyNotes = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    toast.success("Doctor advice copied to clipboard!");
  };

  if (!sessionId || !token || (!appId && !isMockSession)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="p-8 rounded-2xl bg-card border border-red-900/40 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 mx-auto flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Invalid Video Consultation</h1>
          <p className="text-muted-foreground text-sm">
            Missing required video call parameters or session token has expired.
          </p>
          <Button
            onClick={() =>
              router.push(effectiveRole === "DOCTOR" ? "/doctor" : "/dashboard?tab=doctors")
            }
            className="bg-teal-600 hover:bg-teal-700 w-full"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const otherPersonName =
    effectiveRole === "DOCTOR"
      ? appointment?.patient?.name || "Patient"
      : `Dr. ${appointment?.doctor?.name || "Specialist"}`;

  return (
    <>
      <Script
        src="https://unpkg.com/@vonage/client-sdk-video@latest/dist/js/opentok.js"
        onLoad={handleScriptLoad}
        onError={() => {
          toast.error("Failed to load video call script");
          setIsLoading(false);
        }}
      />

      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Top Consultation Status Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-4 rounded-xl bg-card/90 border border-teal-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-950/60 border border-teal-800/50 text-teal-400">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
                  Consultation with {otherPersonName}
                </h1>
                {isConnected && !isMockSession && (
                  <Badge className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[11px] gap-1 px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live
                  </Badge>
                )}
                {isMockSession && (
                  <Badge className="bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] gap-1 px-2 py-0.5">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Dev Demo Room
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                <span>Encrypted Telehealth Room</span>
                {isConnected && (
                  <>
                    <span>•</span>
                    <Clock className="h-3 w-3 text-teal-400" />
                    <span className="font-mono text-teal-300">
                      Duration: {formatCallDuration(callSeconds)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Toggle Notes Drawer Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className={`text-xs gap-1.5 border-teal-800/40 ${
                isNotesOpen
                  ? "bg-teal-900/30 text-teal-300 border-teal-600/50"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {isNotesOpen ? (
                <>
                  <PanelRightClose className="h-3.5 w-3.5 text-teal-400" />
                  <span>Hide Notes Panel</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="h-3.5 w-3.5 text-teal-400" />
                  <span>Show Notes & Advice</span>
                  {notes && (
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  )}
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={endCall}
              className="text-xs gap-1.5 bg-red-600/90 hover:bg-red-700"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span>Leave Room</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !scriptLoaded ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/40 rounded-2xl border border-teal-900/30">
            <Loader2 className="h-12 w-12 text-teal-400 animate-spin mb-4" />
            <h3 className="text-white text-lg font-semibold">Connecting to Encrypted Video Stream...</h3>
            <p className="text-muted-foreground text-xs mt-1">Initializing camera, microphone and OpenTok WebRTC</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Video Feeds (Dynamic 8 or 12 cols) */}
            <div
              className={`space-y-4 transition-all duration-300 ${
                isNotesOpen ? "lg:col-span-8" : "lg:col-span-12"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Remote Video (Other Participant) */}
                <div className="relative border border-teal-900/30 rounded-2xl overflow-hidden bg-background shadow-xl">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-900/40 text-teal-300 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-teal-400" />
                    <span>{otherPersonName}</span>
                  </div>

                  <div
                    id="subscriber"
                    className="w-full h-[320px] sm:h-[400px] bg-muted/20"
                  >
                    {isMockSession ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gradient-to-b from-teal-950/20 to-background/50">
                        <div className="bg-teal-900/30 rounded-full p-6 mb-3 border border-teal-500/30 animate-pulse">
                          <User className="h-10 w-10 text-teal-300" />
                        </div>
                        <p className="text-white text-sm font-semibold">{otherPersonName}</p>
                        <Badge variant="outline" className="mt-2 text-[10px] text-teal-300 border-teal-700/50 bg-teal-950/40">
                          Simulated Telehealth Peer
                        </Badge>
                        <p className="text-[11px] text-muted-foreground mt-2 max-w-xs">
                          Dev mock mode active. Live consultation notes, quick suggestions, and prescription modal are fully operational.
                        </p>
                      </div>
                    ) : (!isConnected || !scriptLoaded) ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="bg-muted/20 rounded-full p-6 mb-3 border border-teal-900/30">
                          <User className="h-10 w-10 text-teal-400" />
                        </div>
                        <p className="text-white text-sm font-medium">Waiting for {otherPersonName}...</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Stream will appear automatically when they connect</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Local Video (You) */}
                <div className="relative border border-teal-900/30 rounded-2xl overflow-hidden bg-background shadow-xl">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-900/40 text-teal-300 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-teal-400" />
                    <span>You ({effectiveRole === "DOCTOR" ? "Doctor" : "Patient"})</span>
                  </div>

                  <div
                    id="publisher"
                    className="w-full h-[320px] sm:h-[400px] bg-muted/20"
                  >
                    {!scriptLoaded && (
                      <div className="flex items-center justify-center h-full">
                        <div className="bg-muted/20 rounded-full p-6 border border-teal-900/30">
                          <User className="h-10 w-10 text-teal-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Video Controls Floating Bar */}
              <div className="p-3 rounded-2xl bg-card/90 border border-teal-900/40 backdrop-blur-md flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleVideo}
                  className={`rounded-full h-12 w-12 p-0 transition-all ${
                    isVideoEnabled
                      ? "border-teal-700/50 bg-teal-950/40 text-teal-300 hover:bg-teal-900/40"
                      : "bg-red-950/40 border-red-700 text-red-400 hover:bg-red-900/50"
                  }`}
                  disabled={!isPublisherReady}
                  title={isVideoEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleAudio}
                  className={`rounded-full h-12 w-12 p-0 transition-all ${
                    isAudioEnabled
                      ? "border-teal-700/50 bg-teal-950/40 text-teal-300 hover:bg-teal-900/40"
                      : "bg-red-950/40 border-red-700 text-red-400 hover:bg-red-900/50"
                  }`}
                  disabled={!isPublisherReady}
                  title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className={`rounded-full h-12 w-12 p-0 transition-all ${
                    isNotesOpen
                      ? "border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-900/40"
                      : "border-teal-800/40 text-teal-400 hover:bg-teal-900/30"
                  }`}
                  title="Toggle Consultation Notes & Advice Drawer"
                >
                  <FileText className="h-5 w-5" />
                </Button>

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endCall}
                  className="rounded-full h-12 w-12 p-0 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-950/50"
                  title="End Consultation"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Column: In-Call Consultation & Notes Drawer */}
            {isNotesOpen && (
              <div className="lg:col-span-4 space-y-4 animate-in fade-in slide-in-from-right duration-200">
                <Card className="border-teal-900/40 bg-card shadow-2xl">
                  <CardHeader className="pb-3 border-b border-teal-900/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-400" />
                        {effectiveRole === "DOCTOR"
                          ? "Consultation Notes & Advice"
                          : "Doctor's Advice & Instructions"}
                      </CardTitle>
                      <Badge variant="outline" className="text-[11px] border-teal-700 text-teal-300">
                        {effectiveRole === "DOCTOR" ? "Physician View" : "Patient View"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Patient Complaint / Symptoms (Always visible for clinical context) */}
                    {appointment?.patientDescription && (
                      <div className="p-3 rounded-xl bg-muted/20 border border-teal-900/30 space-y-1">
                        <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Patient Symptoms & Chief Complaint:
                        </span>
                        <p className="text-xs text-white leading-relaxed whitespace-pre-line">
                          {appointment.patientDescription}
                        </p>
                      </div>
                    )}

                    {/* DOCTOR VIEW: Interactive Notes Editor + Quick Suggestions */}
                    {effectiveRole === "DOCTOR" ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1.5">
                            Physician Notes, Diet & Home Suggestions:
                          </label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Write clinical observations, dietary suggestions, precautions, or lab test instructions for the patient..."
                            className="bg-background/80 border-teal-900/30 text-xs min-h-[140px] focus-visible:ring-teal-500"
                          />
                        </div>

                        {/* Quick Suggestion Chips for Fast Entry */}
                        <div>
                          <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">
                            1-Click Suggestions:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {QUICK_SUGGESTIONS.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleAddQuickSuggestion(item)}
                                className="text-[10px] px-2 py-1 rounded-md bg-teal-950/40 border border-teal-800/40 text-teal-300 hover:bg-teal-900/40 hover:border-teal-600 transition-all text-left"
                              >
                                + {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 space-y-2">
                          <Button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-md shadow-teal-900/30"
                          >
                            {isSavingNotes ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving & Delivering to Patient...
                              </>
                            ) : notesSavedSuccess ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                                Saved & Sent to Patient!
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Save & Send Notes to Patient
                              </>
                            )}
                          </Button>

                          {/* Digital E-Prescription Builder modal directly inside the meet */}
                          {appointment && (
                            <div className="pt-1">
                              <PrescriptionModal appointment={appointment} />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* PATIENT VIEW: Live Notes & Prescriptions Display */
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-800/30 space-y-2 min-h-[120px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                              Doctor&apos;s Advice & Care Summary:
                            </span>
                            {notes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyNotes}
                                className="h-6 px-2 text-[11px] text-teal-400 hover:text-teal-300"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            )}
                          </div>

                          {notes ? (
                            <p className="text-xs text-white whitespace-pre-line leading-relaxed">
                              {notes}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic pt-2">
                              Dr. {appointment?.doctor?.name || "The physician"} will note down
                              clinical advice and recommendations here during your consultation.
                            </p>
                          )}
                        </div>

                        {/* Prescribed Medications Preview if Doctor issued any */}
                        {appointment?.prescription?.items?.length > 0 && (
                          <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-700/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-teal-300 flex items-center gap-1">
                                <Pill className="h-3.5 w-3.5" />
                                Prescribed Medicines:
                              </span>
                              <Badge className="text-[10px] bg-teal-900/50 text-teal-300 border-teal-600">
                                {appointment.prescription.items.length} items
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {appointment.prescription.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="text-xs text-slate-300 flex justify-between bg-card/60 p-1.5 rounded border border-teal-900/30"
                                >
                                  <span className="font-medium text-white">{item.medicineName}</span>
                                  <span className="text-teal-400 font-mono">{item.dosage}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground pt-1">
                              You can order these from verified nearby Dukaans immediately after the consultation in your dashboard.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default VideoCall;
