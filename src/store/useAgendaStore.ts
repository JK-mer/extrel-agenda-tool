import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { AgendaItem, AgendaState, CategoryKey, Meeting } from "../types";
import { DEFAULT_CATEGORY_ORDER } from "../categories";
import { getRepository } from "../data/localStorageRepository";
import { createSeedState, otherStarterItems } from "../data/seed";
import {
  addChildById,
  carryOver,
  makeItem,
  removeItemById,
  uid,
  updateItemById,
} from "../lib/tree";
import { toISODate, todayISO } from "../lib/date";

/** Clone a meeting forward to `date`, carrying over open + parked items. */
function cloneForward(base: Meeting, date: string): Meeting {
  const items: Meeting["items"] = { ...base.items };
  (Object.keys(base.items) as CategoryKey[]).forEach((cat) => {
    items[cat] = carryOver(base.items[cat]);
  });
  return {
    id: uid(),
    date,
    title: base.title,
    categoryOrder: [...base.categoryOrder],
    items,
  };
}

type Theme = "light" | "dark";

interface Store extends AgendaState {
  hydrated: boolean;
  /** Item currently open in the detail modal. */
  openItemRef: { cat: CategoryKey; id: string } | null;
  /** Global toggle to reveal sleeping items in every tile. */
  revealSleeping: boolean;
  /** Focus (present) mode overlay. */
  focusOpen: boolean;
  theme: Theme;
  hydrate: () => Promise<void>;

  addItem: (cat: CategoryKey, title: string) => void;
  addChild: (cat: CategoryKey, parentId: string, title: string) => void;
  updateItem: (cat: CategoryKey, id: string, patch: Partial<AgendaItem>) => void;
  removeItem: (cat: CategoryKey, id: string) => void;
  toggleDone: (cat: CategoryKey, id: string) => void;
  togglePark: (cat: CategoryKey, id: string) => void;
  setSleep: (cat: CategoryKey, id: string, until: string | null) => void;
  toggleCollapse: (cat: CategoryKey, id: string) => void;
  reorderItems: (cat: CategoryKey, activeId: string, overId: string) => void;
  reorderCategories: (activeKey: CategoryKey, overKey: CategoryKey) => void;

  openItem: (cat: CategoryKey, id: string) => void;
  closeItem: () => void;

  startNewWeek: () => void;
  jumpToNow: () => void;
  updateMeetingDate: (id: string, date: string) => void;
  setActiveMeeting: (id: string) => void;
  resetSampleData: () => void;

  toggleRevealSleeping: () => void;
  setFocus: (open: boolean) => void;
  toggleTheme: () => void;
}

const THEME_KEY = "extrel-agenda/theme";

function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme) {
  try {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Backfill new fields on items saved before they existed. Legacy items
 *  (no `parked` field) are folded once so they honour collapse-by-default. */
function migrateItem(it: AgendaItem): AgendaItem {
  const legacy = it.parked === undefined;
  return {
    ...it,
    parked: it.parked ?? false,
    reminder: it.reminder ?? null,
    eventDate: it.eventDate ?? null,
    sleepUntil: it.sleepUntil ?? null,
    source: it.source ?? null,
    collapsed: legacy ? true : it.collapsed,
    children: (it.children ?? []).map(migrateItem),
  };
}

/** Ensure every meeting has all known categories (forward-compat with added tiles). */
function normalizeState(state: AgendaState): AgendaState {
  const meetings: Record<string, Meeting> = {};
  for (const [id, m] of Object.entries(state.meetings)) {
    const items = { ...m.items } as Meeting["items"];
    const order = [...m.categoryOrder];
    for (const key of DEFAULT_CATEGORY_ORDER) {
      // Newly-introduced "other" tile gets starter items; others default empty.
      if (!items[key]) items[key] = key === "other" ? otherStarterItems() : [];
      else items[key] = items[key].map(migrateItem);
      if (!order.includes(key)) order.push(key);
    }
    meetings[id] = { ...m, items, categoryOrder: order };
  }
  return { ...state, meetings };
}

/** Apply a transform to the items of one category in the active meeting. */
function withActiveCategory(
  state: AgendaState,
  cat: CategoryKey,
  fn: (items: AgendaItem[]) => AgendaItem[],
): Partial<AgendaState> {
  const meeting = state.meetings[state.activeMeetingId];
  if (!meeting) return {};
  const updated: Meeting = {
    ...meeting,
    items: { ...meeting.items, [cat]: fn(meeting.items[cat]) },
  };
  return { meetings: { ...state.meetings, [meeting.id]: updated } };
}

export const useAgendaStore = create<Store>((set, get) => ({
  meetings: {},
  activeMeetingId: "",
  hydrated: false,
  openItemRef: null,
  revealSleeping: false,
  focusOpen: false,
  theme: loadTheme(),

  hydrate: async () => {
    const repo = getRepository();
    const saved = await repo.load();
    const state = saved && Object.keys(saved.meetings).length ? saved : createSeedState();
    set({ ...normalizeState(state), hydrated: true });
  },

  addItem: (cat, title) =>
    set((s) => withActiveCategory(s, cat, (items) => [...items, makeItem(title)])),

  addChild: (cat, parentId, title) =>
    set((s) =>
      withActiveCategory(s, cat, (items) => addChildById(items, parentId, makeItem(title))),
    ),

  updateItem: (cat, id, patch) =>
    set((s) => withActiveCategory(s, cat, (items) => updateItemById(items, id, patch))),

  removeItem: (cat, id) =>
    set((s) => withActiveCategory(s, cat, (items) => removeItemById(items, id))),

  // Checking off / parking only toggles flags — the stored order is preserved
  // (resolved items are floated to the bottom at render time, see displayOrder).
  // done / parked / sleeping are mutually exclusive.
  toggleDone: (cat, id) =>
    set((s) =>
      withActiveCategory(s, cat, (items) =>
        updateItemById(items, id, (it) => ({
          done: !it.done,
          parked: false,
          sleepUntil: null,
        })),
      ),
    ),

  togglePark: (cat, id) =>
    set((s) =>
      withActiveCategory(s, cat, (items) =>
        updateItemById(items, id, (it) => ({
          parked: !it.parked,
          done: false,
          sleepUntil: null,
        })),
      ),
    ),

  setSleep: (cat, id, until) =>
    set((s) =>
      withActiveCategory(s, cat, (items) =>
        updateItemById(items, id, () =>
          until
            ? { sleepUntil: until, done: false, parked: false }
            : { sleepUntil: null },
        ),
      ),
    ),

  toggleCollapse: (cat, id) =>
    set((s) =>
      withActiveCategory(s, cat, (items) =>
        updateItemById(items, id, (it) => ({ collapsed: !it.collapsed })),
      ),
    ),

  reorderItems: (cat, activeId, overId) =>
    set((s) =>
      withActiveCategory(s, cat, (items) => {
        const from = items.findIndex((i) => i.id === activeId);
        const to = items.findIndex((i) => i.id === overId);
        if (from === -1 || to === -1 || from === to) return items;
        return arrayMove(items, from, to);
      }),
    ),

  reorderCategories: (activeKey, overKey) =>
    set((s) => {
      const meeting = s.meetings[s.activeMeetingId];
      if (!meeting) return {};
      const order = meeting.categoryOrder;
      const from = order.indexOf(activeKey);
      const to = order.indexOf(overKey);
      if (from === -1 || to === -1 || from === to) return {};
      const updated: Meeting = { ...meeting, categoryOrder: arrayMove(order, from, to) };
      return { meetings: { ...s.meetings, [meeting.id]: updated } };
    }),

  // Always extends the frontier: clones the latest meeting + 7 days, carrying
  // over open/parked items. Repeatable, so you can move forward continuously.
  startNewWeek: () =>
    set((s) => {
      const latest = Object.values(s.meetings).sort((a, b) => a.date.localeCompare(b.date)).pop();
      if (!latest) return {};
      const d = new Date(latest.date + "T00:00:00");
      d.setDate(d.getDate() + 7);
      const next = cloneForward(latest, toISODate(d));
      return { meetings: { ...s.meetings, [next.id]: next }, activeMeetingId: next.id };
    }),

  // Jump to the current/next session. If every meeting is in the past, roll the
  // frontier forward (weekly) to the next slot on/after today and land there.
  jumpToNow: () =>
    set((s) => {
      const today = todayISO();
      const sorted = Object.values(s.meetings).sort((a, b) => a.date.localeCompare(b.date));
      const upcoming = sorted.find((m) => m.date >= today);
      if (upcoming) return { activeMeetingId: upcoming.id, openItemRef: null };
      const latest = sorted[sorted.length - 1];
      if (!latest) return {};
      const d = new Date(latest.date + "T00:00:00");
      do {
        d.setDate(d.getDate() + 7);
      } while (toISODate(d) < today);
      const next = cloneForward(latest, toISODate(d));
      return {
        meetings: { ...s.meetings, [next.id]: next },
        activeMeetingId: next.id,
        openItemRef: null,
      };
    }),

  // Reschedule one meeting without touching any other.
  updateMeetingDate: (id, date) =>
    set((s) => {
      const m = s.meetings[id];
      if (!m || !date) return {};
      return { meetings: { ...s.meetings, [id]: { ...m, date } } };
    }),

  openItem: (cat, id) => set({ openItemRef: { cat, id } }),
  closeItem: () => set({ openItemRef: null }),

  setActiveMeeting: (id) =>
    set((s) => (s.meetings[id] ? { activeMeetingId: id, openItemRef: null } : {})),

  resetSampleData: () => set({ ...normalizeState(createSeedState()), openItemRef: null }),

  toggleRevealSleeping: () => set((s) => ({ revealSleeping: !s.revealSleeping })),
  setFocus: (open) => set({ focusOpen: open }),
  toggleTheme: () =>
    set((s) => {
      const theme: Theme = s.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      return { theme };
    }),
}));

// Persist every change back through the repository (debounced via microtask).
let pending = false;
useAgendaStore.subscribe((state) => {
  if (!state.hydrated || pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    getRepository().save({
      meetings: state.meetings,
      activeMeetingId: state.activeMeetingId,
    });
  });
});
