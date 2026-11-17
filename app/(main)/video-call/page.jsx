import React from "react";
import VideoCall from "./_components/video-call";
import { getAppointmentById } from "@/actions/appointments";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const VideoCallPage = async ({ searchParams }) => {
  let params = {};
  try {
    params = (await searchParams) || {};
  } catch (err) {
    params = {};
  }

  const sessionId = params?.sessionId || null;
  const token = params?.token || null;
  const appointmentId = params?.appointmentId || null;

  let appointment = null;
  let currentUserRole = "PATIENT";

  try {
    const { userId } = await auth();
    if (userId) {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { role: true },
      });
      if (user?.role) {
        currentUserRole = user.role;
      }
    }

    if (appointmentId) {
      const res = await getAppointmentById(appointmentId);
      if (res?.success && res.appointment) {
        // Serialize clean plain JSON to eliminate any RSC Date or prototype transfer errors
        appointment = JSON.parse(JSON.stringify(res.appointment));
        if (res.currentUserRole) {
          currentUserRole = res.currentUserRole;
        }
      }
    }
  } catch (err) {
    console.error("VideoCallPage data fetch error:", err);
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
