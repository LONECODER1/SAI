import { redirect } from "next/navigation";

/**
 * The standalone /doctors route is unified into the Single Patient Dashboard.
 * Redirects directly to /dashboard with the Doctor Consultations interface active.
 */
export default function DoctorsRouteRedirect() {
  redirect("/dashboard?tab=doctors");
}
