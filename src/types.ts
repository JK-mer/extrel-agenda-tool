// Domain model for the ExtRel Agenda tool.
// Kept deliberately storage-agnostic so the same shapes can later be served
// from an Azure-backed API instead of localStorage.

export type CategoryKey =
  | "admin"
  | "events"
  | "memberships"
  | "stakeholder"
  | "fellows"
  | "recurring"
  | "other";

export interface AgendaItem {
  id: string;
  title: string;
  notes?: string;
  /** Checked off — completed; dropped when starting a new week. */
  done: boolean;
  /** Parked — explicitly deferred; auto-carried to the next session. */
  parked?: boolean;
  /** Hidden from the agenda until this date (YYYY-MM-DD). Set via the modal. */
  sleepUntil?: string | null;
  /** Collapsed in the UI (children hidden). Items start collapsed. */
  collapsed?: boolean;
  children: AgendaItem[];
  createdAt: string;
  // --- Due dates / reminders (Microsoft Tasks/Outlook sync to follow). ---
  dueDate?: string | null;
  /** When the event itself happens — drives ordering in the Events tile. */
  eventDate?: string | null;
  /** Reminder lead time, e.g. "none" | "at" | "1d" | "1w". */
  reminder?: string | null;
  assignee?: string | null;
  /**
   * Link to an external record this item was pulled from (e.g. a Dynamics
   * event). Lets us dedupe / refresh auto-pulled items. Null for hand-added
   * items. Not yet populated — reserved for the Dynamics integration.
   */
  source?: ItemSource | null;
}

/** Provenance of an item pulled from an external system. */
export interface ItemSource {
  system: "dynamics";
  /** Dataverse entity set, e.g. "msevtmgt_events". */
  entity: string;
  /** Record id (GUID) in the source system. */
  id: string;
}

export interface Meeting {
  id: string;
  /** ISO date (YYYY-MM-DD) the meeting belongs to. */
  date: string;
  title?: string;
  /** Per-meeting tile order — this is what dragging tiles persists. */
  categoryOrder: CategoryKey[];
  items: Record<CategoryKey, AgendaItem[]>;
}

export interface AgendaState {
  meetings: Record<string, Meeting>;
  activeMeetingId: string;
}
