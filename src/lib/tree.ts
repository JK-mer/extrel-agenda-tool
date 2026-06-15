import type { AgendaItem } from "../types";

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function makeItem(title: string, partial: Partial<AgendaItem> = {}): AgendaItem {
  return {
    id: uid(),
    title,
    done: false,
    parked: false,
    sleepUntil: null,
    collapsed: true, // items start folded; unfold to discuss
    children: [],
    createdAt: new Date().toISOString(),
    dueDate: null,
    eventDate: null,
    reminder: null,
    assignee: null,
    source: null,
    ...partial,
  };
}

/**
 * True if the item is snoozed past the reference date and should be hidden.
 * `refDate` is the active meeting's date (YYYY-MM-DD), so viewing a future
 * meeting reveals items scheduled to wake by then.
 */
export function isAsleep(item: AgendaItem, refDate: string): boolean {
  return !!item.sleepUntil && item.sleepUntil > refDate;
}

/** Top-level items awake (visible) as of `refDate`. */
export function awakeItems(items: AgendaItem[], refDate: string): AgendaItem[] {
  return items.filter((it) => !isAsleep(it, refDate));
}

/**
 * Order items for display WITHOUT mutating the stored array:
 *  - resolved items (done or parked) appear at the bottom,
 *  - in the Events tile, items are ordered by event date (soonest first,
 *    undated last),
 *  - otherwise the authored order is preserved.
 * Keeping the real array untouched means parking carries the true order
 * forward into next week.
 */
export function displayOrder(
  items: AgendaItem[],
  opts: { byEventDate?: boolean } = {},
): AgendaItem[] {
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => {
      const ra = a.it.done || a.it.parked ? 1 : 0;
      const rb = b.it.done || b.it.parked ? 1 : 0;
      if (ra !== rb) return ra - rb;
      if (opts.byEventDate) {
        const da = a.it.eventDate || "";
        const db = b.it.eventDate || "";
        if (da && db && da !== db) return da < db ? -1 : 1;
        if (da && !db) return -1;
        if (!da && db) return 1;
      }
      return a.i - b.i;
    })
    .map((x) => x.it);
}

/** Find an item by id anywhere in the tree. */
export function findItemById(items: AgendaItem[], id: string): AgendaItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItemById(item.children, id);
    if (found) return found;
  }
  return null;
}

/** Return a new tree with the item matching `id` patched. */
export function updateItemById(
  items: AgendaItem[],
  id: string,
  patch: Partial<AgendaItem> | ((item: AgendaItem) => Partial<AgendaItem>),
): AgendaItem[] {
  return items.map((item) => {
    if (item.id === id) {
      const delta = typeof patch === "function" ? patch(item) : patch;
      return { ...item, ...delta };
    }
    if (item.children.length) {
      return { ...item, children: updateItemById(item.children, id, patch) };
    }
    return item;
  });
}

/** Return a new tree with the item matching `id` removed (at any depth). */
export function removeItemById(items: AgendaItem[], id: string): AgendaItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      item.children.length
        ? { ...item, children: removeItemById(item.children, id) }
        : item,
    );
}

/** Append a child under the item matching `parentId`. */
export function addChildById(
  items: AgendaItem[],
  parentId: string,
  child: AgendaItem,
): AgendaItem[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, collapsed: false, children: [...item.children, child] };
    }
    if (item.children.length) {
      return { ...item, children: addChildById(item.children, parentId, child) };
    }
    return item;
  });
}

export interface TreeCount {
  total: number;
  done: number;
}

/** Count leaf-aware progress across the whole tree. */
export function countTree(items: AgendaItem[]): TreeCount {
  return items.reduce<TreeCount>(
    (acc, item) => {
      acc.total += 1;
      if (item.done) acc.done += 1;
      const child = countTree(item.children);
      acc.total += child.total;
      acc.done += child.done;
      return acc;
    },
    { total: 0, done: 0 },
  );
}

/**
 * Build next week's list: drop checked-off items, carry everything still open
 * (including parked items). Notes / assignee / due date are kept; done, parked
 * and collapsed are reset to a fresh state.
 */
export function carryOver(items: AgendaItem[]): AgendaItem[] {
  return items
    .filter((item) => !item.done || item.children.some((c) => !c.done))
    .map((item) => ({
      ...item,
      id: uid(),
      done: false,
      parked: false,
      collapsed: true,
      createdAt: new Date().toISOString(),
      children: carryOver(item.children),
    }));
}
