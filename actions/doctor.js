"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setAvailabilitySlots(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get form data
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    // Validate input
    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    const existingSlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
    });

    if (existingSlots.length > 0) {
      const slotsWithNoAppointments = existingSlots.filter(
        (slot) => !slot.appointment,
      );

      if (slotsWithNoAppointments.length > 0) {
        await db.availability.deleteMany({
          where: {
            id: {
              in: slotsWithNoAppointments.map((slot) => slot.id),
            },
          },
        });
      }
    }
    // Create new availability slot
    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "AVAILABLE",
      },
    });

    revalidatePath("/doctor");

    return {
      success: true,
      slot: newSlot,
    };
  } catch (error) {
    throw new Error("Failed to set availability: " + error.message);
  }
}

export async function getDoctorAvailability() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const availabilitySlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { slots: availabilitySlots };
  } catch (error) {
    throw new Error("Failed to fetch availability slots " + error.message);
  }
}

export async function getDoctorAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
      include: {
        patient: true,
        prescription: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return appointments;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch appointments");
  }
}

export async function cancelAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.patientId,
          amount: 2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctorId,
          amount: -2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Update patient's credit balance (increment)
      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: 2,
          },
        },
      });

      // Update doctor's credit balance (decrement)
      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            decrement: 2,
          },
        },
      });
    });

    if (user.role === "DOCTOR") {
      revalidatePath("/doctor");
    } else if (user.role === "PATIENT") {
      revalidatePath("/appointments");
    }

    return {
      success: true,
    };
  } catch (error) {
    throw new Error(error.message || "Failed to cancel appointment");
  }
}

export async function addAppointmentNotes(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointmentId = typeof formData?.get === "function"
      ? (formData.get("appointmentId") || formData.get("appointment"))
      : (formData?.appointmentId || formData?.appointment);
    const notes = typeof formData?.get === "function"
      ? formData.get("notes")
      : formData?.notes;

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
          },
        },
        prescription: {
          include: {
            items: true,
          },
        },
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/dashboard");
    revalidatePath("/video-call");
    revalidatePath("/appointments");

    return {
      success: true,
      appointment: updatedAppointment,
    };
  } catch (error) {
    throw new Error("Failed to update notes: " + error.message);
  }
}

export async function markAppointmentCompleted(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointmentId = typeof formData?.get === "function"
      ? (formData.get("appointmentId") || formData.get("appointment"))
      : (formData?.appointmentId || formData?.appointment);

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error(
        "Only scheduled appointments can be marked as completed"
      );
    }

    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot mark appointment as completed before the scheduled end time"
      );
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: "COMPLETED",
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/dashboard");
    revalidatePath("/video-call");
    revalidatePath("/appointments");

    return {
      success: true,
      appointment: updatedAppointment,
    };
  } catch (error) {
    throw new Error(
      "Failed to mark appointment as completed: " + error.message
    );
  }
}

// =============================================================
// DIGITAL E-PRESCRIPTION & LOCAL DEMAND EMITTER
// =============================================================

export async function issueDigitalPrescriptionAction({
  appointmentId,
  diagnosis,
  instructions,
  items = [],
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });

    if (!doctor) throw new Error("Doctor not found");

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId, doctorId: doctor.id },
      include: { patient: true },
    });

    if (!appointment) throw new Error("Appointment not found");

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Prescription must contain at least one medicine");
    }

    // Upsert Prescription in a transaction
    const prescription = await db.$transaction(async (tx) => {
      // Delete previous items if updating
      const existing = await tx.prescription.findUnique({
        where: { appointmentId },
      });

      if (existing) {
        await tx.prescriptionItem.deleteMany({
          where: { prescriptionId: existing.id },
        });
        await tx.prescription.delete({
          where: { id: existing.id },
        });
      }

      const created = await tx.prescription.create({
        data: {
          appointmentId,
          doctorId: doctor.id,
          patientId: appointment.patientId,
          diagnosis: diagnosis || "General Clinical Consultation",
          instructions: instructions || "Take medications as directed",
          items: {
            create: items.map((item) => ({
              medicineName: item.medicineName,
              genericName: item.genericName || null,
              dosage: item.dosage || "1 Tab daily",
              durationDays: parseInt(item.durationDays || "5", 10),
              quantity: parseInt(item.quantity || "10", 10),
              instructions: item.instructions || null,
            })),
          },
        },
        include: { items: true },
      });

      // Emit DemandSignal for each prescribed medicine to alert nearby pharmacies
      for (const item of items) {
        await tx.demandSignal.create({
          data: {
            medicineName: item.medicineName,
            genericName: item.genericName || null,
            latitude: 28.6139, // Vicinity signal anchor
            longitude: 77.2090,
            signalType: "PRESCRIPTION",
            weight: 1.0,
          },
        });
      }

      return created;
    });

    revalidatePath("/doctor");
    revalidatePath("/appointments");
    return { success: true, prescription };
  } catch (error) {
    console.error("Failed to issue prescription:", error);
    return { success: false, error: error.message };
  }
}

export async function getAppointmentPrescription(appointmentId) {
  try {
    const prescription = await db.prescription.findUnique({
      where: { appointmentId },
      include: {
        items: true,
        doctor: { select: { name: true, specialty: true } },
      },
    });

    return { prescription };
  } catch (error) {
    console.error("Failed to fetch prescription:", error);
    return { prescription: null, error: error.message };
  }
}



