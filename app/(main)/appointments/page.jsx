import { redirect } from "next/navigation";

export default function PatientAppointmentsPage() {
  redirect("/dashboard?tab=doctors");
}
