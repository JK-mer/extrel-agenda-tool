import { useEffect, useRef } from "react";
import {
  Check,
  Pin,
  Moon,
  X,
  CalendarClock,
  CalendarDays,
  User,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useAgendaStore } from "../store/useAgendaStore";
import { CATEGORIES } from "../categories";
import { findItemById, displayOrder } from "../lib/tree";
import { isoInDays } from "../lib/date";
import { AgendaItemRow } from "./AgendaItemRow";
import { AddItemInline } from "./AddItemInline";

const REMINDERS = [
  { value: "none", label: "No reminder" },
  { value: "at", label: "At due time" },
  { value: "1d", label: "1 day before" },
  { value: "1w", label: "1 week before" },
];

export function ItemModal() {
  const ref = useAgendaStore((s) => s.openItemRef);
  const meeting = useAgendaStore((s) => s.meetings[s.activeMeetingId]);
  const closeItem = useAgendaStore((s) => s.closeItem);
  const updateItem = useAgendaStore((s) => s.updateItem);
  const toggleDone = useAgendaStore((s) => s.toggleDone);
  const togglePark = useAgendaStore((s) => s.togglePark);
  const setSleep = useAgendaStore((s) => s.setSleep);
  const removeItem = useAgendaStore((s) => s.removeItem);
  const addChild = useAgendaStore((s) => s.addChild);

  const item = ref && meeting ? findItemById(meeting.items[ref.cat], ref.id) : null;

  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeItem();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ref, closeItem]);

  // Grow the title box to fit longer titles instead of clipping them.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [item?.title, ref?.id]);

  if (!ref || !meeting || !item) return null;

  const meta = CATEGORIES[ref.cat];
  const style = {
    ["--accent" as string]: meta.accent,
    ["--tint" as string]: meta.tint,
  } as React.CSSProperties;

  return (
    <div className="modal-backdrop" onClick={closeItem}>
      <div
        className="modal-panel"
        style={style}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="modal-cat">
            <span className="modal-cat-dot" />
            {meta.label}
          </span>
          <button className="modal-close" onClick={closeItem} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <textarea
          ref={titleRef}
          className="modal-title"
          rows={1}
          value={item.title}
          placeholder="Item title"
          onChange={(e) => updateItem(ref.cat, ref.id, { title: e.target.value })}
        />

        <div className="modal-status">
          <button
            className={`status-btn${item.done ? " is-on done" : ""}`}
            onClick={() => toggleDone(ref.cat, ref.id)}
          >
            <Check size={15} /> {item.done ? "Checked off" : "Check off"}
          </button>
          <button
            className={`status-btn${item.parked ? " is-on park" : ""}`}
            onClick={() => togglePark(ref.cat, ref.id)}
          >
            <Pin size={15} /> {item.parked ? "Parked → next week" : "Park"}
          </button>
          <button
            className={`status-btn${item.sleepUntil ? " is-on sleep" : ""}`}
            onClick={() => setSleep(ref.cat, ref.id, item.sleepUntil ? null : isoInDays(7))}
          >
            <Moon size={15} /> {item.sleepUntil ? "Sleeping" : "Sleep"}
          </button>
          <button
            className="status-btn danger"
            onClick={() => {
              removeItem(ref.cat, ref.id);
              closeItem();
            }}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>

        {item.sleepUntil && (
          <div className="modal-sleep">
            <Moon size={13} />
            <span>Hidden from the agenda until</span>
            <input
              type="date"
              value={item.sleepUntil}
              onChange={(e) => setSleep(ref.cat, ref.id, e.target.value || null)}
            />
            <button className="modal-wake" onClick={() => setSleep(ref.cat, ref.id, null)}>
              Wake now
            </button>
          </div>
        )}

        <div className="modal-grid">
          {ref.cat === "events" && (
            <label className="modal-field">
              <span className="modal-field-label">
                <CalendarDays size={13} /> Event date
              </span>
              <input
                type="date"
                value={item.eventDate ?? ""}
                onChange={(e) =>
                  updateItem(ref.cat, ref.id, { eventDate: e.target.value || null })
                }
              />
            </label>
          )}

          <label className="modal-field">
            <span className="modal-field-label">
              <User size={13} /> Assigned to
            </span>
            <input
              type="text"
              placeholder="Unassigned"
              value={item.assignee ?? ""}
              onChange={(e) =>
                updateItem(ref.cat, ref.id, { assignee: e.target.value || null })
              }
            />
          </label>

          <label className="modal-field">
            <span className="modal-field-label">
              <CalendarClock size={13} /> Due date
            </span>
            <input
              type="date"
              value={item.dueDate ?? ""}
              onChange={(e) =>
                updateItem(ref.cat, ref.id, { dueDate: e.target.value || null })
              }
            />
          </label>

          <label className="modal-field">
            <span className="modal-field-label">Reminder</span>
            <select
              value={item.reminder ?? "none"}
              onChange={(e) =>
                updateItem(ref.cat, ref.id, { reminder: e.target.value })
              }
            >
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="modal-hint">
          Assignments &amp; reminders will sync with Microsoft Tasks / Outlook in a later phase.
        </p>

        <div className="modal-section">
          <span className="modal-section-label">
            <MessageSquare size={13} /> Notes
          </span>
          <textarea
            className="modal-notes"
            placeholder="Discussion notes, context, decisions…"
            value={item.notes ?? ""}
            onChange={(e) => updateItem(ref.cat, ref.id, { notes: e.target.value })}
          />
        </div>

        <div className="modal-section">
          <span className="modal-section-label">
            Sub-items
            {item.children.length > 0 && (
              <span className="modal-subcount">{item.children.length}</span>
            )}
          </span>
          {item.children.length > 0 && (
            <ul className="item-list">
              {displayOrder(item.children).map((child) => (
                <AgendaItemRow
                  key={child.id}
                  item={child}
                  categoryKey={ref.cat}
                  depth={0}
                  openInModal={false}
                />
              ))}
            </ul>
          )}
          <AddItemInline
            placeholder="Add sub-item…"
            onSubmit={(title) => addChild(ref.cat, ref.id, title)}
          />
        </div>
      </div>
    </div>
  );
}
