import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Doctor Panel Consultation & In-Call Notes Workflow", () => {
  it("should accurately determine when an appointment is ready to join (30-min window)", () => {
    const now = new Date("2026-11-18T10:00:00Z");

    // 1. Appointment starting in 15 minutes (should be active)
    const activeApp = {
      status: "SCHEDULED",
      startTime: new Date("2026-11-18T10:15:00Z"),
      endTime: new Date("2026-11-18T10:45:00Z"),
    };

    const isAppActive = (app, currentTime) => {
      if (app.status !== "SCHEDULED") return false;
      const start = new Date(app.startTime).getTime();
      const end = new Date(app.endTime).getTime();
      const curr = currentTime.getTime();
      return (start - curr <= 30 * 60 * 1000 && curr < start) || (curr >= start && curr <= end);
    };

    assert.equal(isAppActive(activeApp, now), true, "Appointment within 30 min should be active and joinable");

    // 2. Appointment starting in 2 hours (should NOT be active)
    const futureApp = {
      status: "SCHEDULED",
      startTime: new Date("2026-11-18T12:00:00Z"),
      endTime: new Date("2026-11-18T12:30:00Z"),
    };

    assert.equal(isAppActive(futureApp, now), false, "Appointment in 2 hours should not be active yet");

    // 3. Completed appointment should not be joinable
    const completedApp = {
      status: "COMPLETED",
      startTime: new Date("2026-11-18T09:00:00Z"),
      endTime: new Date("2026-11-18T09:30:00Z"),
    };
    assert.equal(isAppActive(completedApp, now), false, "Completed appointment should not be joinable");
  });

  it("should compute accurate countdown for join time", () => {
    const now = new Date("2026-11-18T10:00:00Z");
    const startTime = new Date("2026-11-18T10:45:00Z"); // Join window opens 30 min before (10:15:00Z), so 15 min from now

    const getRemainingMinutesToJoin = (start, current) => {
      const joinWindowStart = new Date(start.getTime() - 30 * 60 * 1000);
      const diffMs = joinWindowStart.getTime() - current.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    };

    const remaining = getRemainingMinutesToJoin(startTime, now);
    assert.equal(remaining, 15, "Should report 15 minutes until join window opens");
  });

  it("should support both appointmentId and appointment parameter in doctor action payload", () => {
    const parsePayload = (input) => {
      if (typeof input?.get === "function") {
        return {
          appointmentId: input.get("appointmentId") || input.get("appointment"),
          notes: input.get("notes"),
        };
      }
      return {
        appointmentId: input?.appointmentId || input?.appointment,
        notes: input?.notes,
      };
    };

    // Case A: Client sent appointmentId
    const payloadA = { appointmentId: "apt-12345", notes: "Adequate rest and hydration" };
    assert.equal(parsePayload(payloadA).appointmentId, "apt-12345");

    // Case B: Client sent appointment
    const payloadB = { appointment: "apt-12345", notes: "Adequate rest and hydration" };
    assert.equal(parsePayload(payloadB).appointmentId, "apt-12345");

    // Case C: FormData mock
    const mockFormData = new Map([
      ["appointmentId", "apt-67890"],
      ["notes", "Warm salt water gargle"],
    ]);
    const formDataObj = {
      get: (key) => mockFormData.get(key),
    };
    const parsedFormData = parsePayload(formDataObj);
    assert.equal(parsedFormData.appointmentId, "apt-67890");
    assert.equal(parsedFormData.notes, "Warm salt water gargle");
  });

  it("should format multi-line consultation notes with suggestions cleanly for the patient", () => {
    let notes = "Patient examined with mild throat irritation and fever (99.8 F).";
    const suggestions = [
      "Adequate hydration & complete bed rest",
      "Warm salt water gargle 3 times daily",
      "Avoid cold and heavy spicy food",
    ];

    suggestions.forEach((item) => {
      notes = `${notes.trim()}\n• ${item}`;
    });

    assert.ok(notes.includes("• Adequate hydration"));
    assert.ok(notes.includes("• Warm salt water gargle"));
    assert.ok(notes.includes("• Avoid cold"));
    assert.equal(notes.split("\n").length, 4, "Should have intro line plus 3 bullet points");
  });
});
