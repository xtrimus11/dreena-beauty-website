import Link from "next/link";
import { formatForStaff } from "@/lib/appointments/time";
import type { AppointmentWithGuests, ResolvedGuest, Staff } from "@/lib/appointments/types";

interface Props {
  date: string;
  columns: Staff[];
  bookings: AppointmentWithGuests[];
  selectedTherapistId: string | null;
  offToday: { staffId: string; reason: string | null }[];
}

/**
 * The phone view: one therapist's day, read only. Below 768px there is no
 * room for six columns and no room to safely edit — mis-tapping the diary on
 * a 5-inch screen is how a customer loses their slot. Staff pick a therapist
 * and read. The filter is a URL parameter, so the page stays shareable and
 * needs no client JavaScript.
 */
export default function DayAgenda({ date, columns, bookings, selectedTherapistId, offToday }: Props) {
  const offIds = new Set(offToday.map((o) => o.staffId));

  const nameOf = (g: ResolvedGuest) =>
    g.customer?.fullName ?? (g.relationship ? `+ ${g.relationship}` : "Guest");

  const guests: ResolvedGuest[] = bookings
    .flatMap((b) => b.guests)
    .filter((g) => g.status !== "cancelled")
    .filter((g) => !selectedTherapistId || g.therapistId === selectedTherapistId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div className="md:hidden">
      {/* Therapist picker */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          <FilterChip href={`/staff/day/${date}`} active={!selectedTherapistId} label="Everyone" />
          {columns.map((s) => (
            <FilterChip
              key={s.id}
              href={`/staff/day/${date}?t=${s.id}`}
              active={selectedTherapistId === s.id}
              label={s.displayName}
              off={offIds.has(s.id)}
              colour={s.colour}
            />
          ))}
        </div>
      </div>

      {guests.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#8e8e8e]">
          {selectedTherapistId ? "Nothing booked for this therapist." : "Nothing booked."}
        </p>
      ) : (
        <ul className="space-y-2">
          {guests.map((g) => (
            <li
              key={g.id}
              // Stretched-link pattern: the card is a plain container with an
              // absolutely-positioned link covering it, so the whole card is
              // tappable WITHOUT nesting the tel: link inside another anchor
              // (invalid HTML, and it breaks hydration).
              className="relative rounded-xl border border-[rgba(10,10,10,0.1)] bg-white p-3.5"
            >
              <Link
                href={`/staff/booking/${g.appointmentId}`}
                className="absolute inset-0 rounded-xl"
                aria-label={`Open booking for ${nameOf(g)}`}
              />

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold tabular-nums">
                  {formatForStaff(g.startsAt)} – {formatForStaff(g.endsAt)}
                </span>
                <StatusLabel status={g.status} />
              </div>

              <div className="mt-1.5 flex items-baseline gap-1.5">
                {g.customer?.customerCode && (
                  <span className="shrink-0 rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                    {g.customer.customerCode}
                  </span>
                )}
                <span className={`font-semibold ${g.customer ? "" : "italic"}`}>{nameOf(g)}</span>
              </div>

              {g.treatment && (
                <div className="mt-0.5 text-sm text-[#5a5a5a]">{g.treatment.name}</div>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#8e8e8e]">
                <span>
                  {g.therapist ? (
                    <>
                      <span
                        className="mr-1.5 inline-block size-2 rounded-full align-middle"
                        style={{ background: g.therapist.colour }}
                      />
                      {g.therapist.displayName}
                    </>
                  ) : (
                    <em className="text-[#8a6f4f]">Unassigned</em>
                  )}
                </span>
                {g.customer?.phone && (
                  // z-10 lifts it above the stretched link so a therapist can
                  // ring the customer straight from the phone in their hand.
                  <a
                    href={`tel:${g.customer.phone.replace(/\s/g, "")}`}
                    className="relative z-10 tabular-nums underline underline-offset-2"
                  >
                    {g.customer.phone}
                  </a>
                )}
              </div>

              {g.preferenceMismatch && (
                <div className="mt-1.5 text-[12px] font-semibold text-[#b45309]">
                  Not their preferred therapist
                </div>
              )}
              {g.notes && <div className="mt-1.5 text-[13px] text-[#5a5a5a]">{g.notes}</div>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 rounded-lg bg-[#f1efe9] px-3 py-2.5 text-[13px] text-[#5a5a5a]">
        View only on phone. Use a tablet or the PC to make or change a booking.
      </p>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  off,
  colour,
}: {
  href: string;
  active: boolean;
  label: string;
  off?: boolean;
  colour?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm ${
        active
          ? "border-[#0a0a0a] bg-[#0a0a0a] font-semibold text-white"
          : "border-[rgba(10,10,10,0.16)] bg-white"
      }`}
    >
      {colour && <span className="inline-block size-2 rounded-full" style={{ background: colour }} />}
      <span className={off ? "line-through opacity-60" : ""}>{label}</span>
      {off && <span className="text-[10px] font-bold uppercase opacity-70">off</span>}
    </Link>
  );
}

/** Spelled out, never colour alone — the grid uses hue, this does not. */
function StatusLabel({ status }: { status: ResolvedGuest["status"] }) {
  const label: Record<string, string> = {
    pending: "Booked",
    confirmed: "Confirmed",
    arrived: "Arrived",
    in_progress: "In progress",
    completed: "Done",
    no_show: "No show",
  };
  const tone: Record<string, string> = {
    pending: "bg-[#f1efe9] text-[#5a5a5a]",
    // Red, matching the C on the sheet.
    confirmed: "bg-[#fdf0ef] font-semibold text-[#dc2626]",
    arrived: "bg-[#e6f4f1] text-[#0f766e]",
    in_progress: "bg-[#e6f4f1] text-[#0f766e]",
    completed: "bg-[#f1efe9] text-[#8e8e8e]",
    no_show: "bg-[#fdf0ef] text-[#9f1239]",
  };
  return (
    <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${tone[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}
