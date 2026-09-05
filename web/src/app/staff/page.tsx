import { redirect } from "next/navigation";
import { shopDate } from "@/lib/appointments/time";

// /staff always means "today", in shop time — not the server's timezone.
export default function StaffIndex() {
  redirect(`/staff/day/${shopDate(new Date())}`);
}
