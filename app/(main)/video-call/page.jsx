import React from "react";
import VideoCall from "./_components/video-call";
import { getAppointmentById } from "@/actions/appointments";

const VideoCallPage = async ({ searchParams }) => {
  const params = await searchParams;
  const sessionId = params?.sessionId;
  const token = params?.token;
  const appointmentId = params?.appointmentId;

  let appointment = null;
  let currentUserRole = null;

  if (appointmentId) {
    const res = await getAppointmentById(appointmentId);
    if (res?.success) {
      appointment = res.appointment;
      currentUserRole = res.currentUserRole;
    }
  }

  return (
    <VideoCall
      sessionId={sessionId}
      token={token}
      appointmentId={appointmentId}
      initialAppointment={appointment}
      userRole={currentUserRole}
    />
  );
};

export default VideoCallPage;
