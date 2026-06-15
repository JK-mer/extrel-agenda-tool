import { DEFAULT_CATEGORY_ORDER } from "../categories";
import type { AgendaState, CategoryKey, Meeting } from "../types";
import { makeItem, uid } from "../lib/tree";

/** Monday of the week containing `d`, as YYYY-MM-DD. */
function mondayOf(d: Date): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

/** A date `n` days from today, as YYYY-MM-DD. */
function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function emptyItems(): Record<CategoryKey, ReturnType<typeof makeItem>[]> {
  return {
    admin: [],
    events: [],
    memberships: [],
    stakeholder: [],
    fellows: [],
    recurring: [],
    other: [],
  };
}

/** Starter items for the "Other" tile — also used to backfill the tile
 *  for agendas saved before "Other" existed. */
export function otherStarterItems() {
  return [
    makeItem("AOB — any other business"),
    makeItem("Parking lot: idea for a members podcast", {
      children: [
        makeItem("Scope a pilot episode"),
        makeItem("Who would host?"),
      ],
    }),
    makeItem("Team lunch / social — pick a date"),
    makeItem("Shared drive clean-up reminder"),
    makeItem("Cross-team request from Research"),
  ];
}

export function createSeedState(): AgendaState {
  const items = emptyItems();

  items.admin = [
    makeItem("Approve Q3 travel & hospitality budget", { done: true }),
    makeItem("New shared-inbox routing — who owns what?", {
      children: [
        makeItem("Draft responsibility matrix", { done: true }),
        makeItem("Circulate to team for sign-off"),
      ],
    }),
    makeItem("Office move: confirm meeting-room booking process"),
    makeItem("Update team holiday calendar & cover plan"),
    makeItem("Review GDPR data-handling checklist"),
    makeItem("Procurement: renew Zoom & design-tool licences"),
  ];

  items.events = [
    makeItem("Summer Reception", {
      eventDate: inDays(13),
      children: [
        makeItem("Final headcount to caterer", { done: true }),
        makeItem("Speaker run-of-show & timings"),
        makeItem("Photographer confirmed?"),
      ],
    }),
    makeItem("Autumn Lecture Series — lock 3 dates"),
    makeItem("Post-event survey: review May workshop results"),
    makeItem("January gala", { eventDate: inDays(60) }),
    makeItem("Members webinar", { eventDate: inDays(34) }),
    makeItem("Catering vendor shortlist for autumn events"),
    makeItem("Save-the-date email — finalise recipient list"),
  ];

  items.memberships = [
    makeItem("June renewals — 12 outstanding, send reminder"),
    makeItem("Onboarding flow for new corporate members", {
      children: [makeItem("Welcome pack copy review"), makeItem("Portal access checklist")],
    }),
    makeItem("Lapsed members: win-back call list"),
  ];

  items.stakeholder = [
    makeItem("Sponsor renewal — Meridian Group (decision due)"),
    makeItem("University partnership MoU — legal review status"),
    makeItem("Quarterly stakeholder newsletter — sign off draft", { done: true }),
  ];

  items.fellows = [
    makeItem("2026 cohort nominations — shortlist ready for vote", {
      children: [
        makeItem("Confirm selection panel availability"),
        makeItem("Conflict-of-interest declarations collected"),
      ],
    }),
    makeItem("Alumni mentoring scheme — pair remaining 4 fellows"),
  ];

  items.recurring = [
    makeItem("Round-table: wins from last week"),
    makeItem("Pipeline & metrics check"),
    makeItem("Blockers / where we need help"),
    makeItem("Diary look-ahead — next 3 weeks"),
  ];

  items.other = otherStarterItems();

  const meeting: Meeting = {
    id: uid(),
    date: mondayOf(new Date()),
    title: "External Relations — Weekly Sync",
    categoryOrder: [...DEFAULT_CATEGORY_ORDER],
    items,
  };

  return {
    meetings: { [meeting.id]: meeting },
    activeMeetingId: meeting.id,
  };
}
