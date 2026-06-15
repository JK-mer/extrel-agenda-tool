import { useEffect, useState } from "react";
import {
  Check,
  Pin,
  X,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
} from "lucide-react";
import { useAgendaStore } from "../store/useAgendaStore";
import { CATEGORIES } from "../categories";
import type { CategoryKey } from "../types";
import { awakeItems, displayOrder, findItemById } from "../lib/tree";

interface Section {
  cat: CategoryKey;
  ids: string[];
}

export function FocusMode() {
  const focusOpen = useAgendaStore((s) => s.focusOpen);
  const setFocus = useAgendaStore((s) => s.setFocus);
  const activeMeetingId = useAgendaStore((s) => s.activeMeetingId);
  const meeting = useAgendaStore((s) => s.meetings[s.activeMeetingId]);
  const toggleDone = useAgendaStore((s) => s.toggleDone);
  const togglePark = useAgendaStore((s) => s.togglePark);

  const [sections, setSections] = useState<Section[]>([]);
  const [activeCat, setActiveCat] = useState<CategoryKey | null>(null);
  const [index, setIndex] = useState(0);

  // Snapshot per-section order once when focus opens, so resolving items
  // mid-meeting doesn't reshuffle the walkthrough.
  useEffect(() => {
    if (!focusOpen) return;
    const m = useAgendaStore.getState().meetings[activeMeetingId];
    if (!m) return;
    const next: Section[] = m.categoryOrder.map((cat) => ({
      cat,
      ids: displayOrder(awakeItems(m.items[cat], m.date), {
        byEventDate: cat === "events",
      }).map((it) => it.id),
    }));
    setSections(next);
    setActiveCat(next.find((s) => s.ids.length > 0)?.cat ?? next[0]?.cat ?? null);
    setIndex(0);
  }, [focusOpen, activeMeetingId]);

  const section = sections.find((s) => s.cat === activeCat) ?? null;
  const ids = section?.ids ?? [];

  useEffect(() => {
    if (!focusOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, ids.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusOpen, ids.length, setFocus]);

  if (!focusOpen || !meeting || !activeCat) return null;

  const meta = CATEGORIES[activeCat];
  const item = ids[index] ? findItemById(meeting.items[activeCat], ids[index]) : null;
  const style = { ["--accent" as string]: meta.accent } as React.CSSProperties;

  function selectCat(cat: CategoryKey) {
    setActiveCat(cat);
    setIndex(0);
  }
  function advance() {
    setIndex((i) => Math.min(i + 1, ids.length - 1));
  }

  return (
    <div className="focus" style={style}>
      <div className="focus-top">
        <span className="focus-meeting">{meeting.title}</span>
        <span className="focus-progress">
          {ids.length ? `${index + 1} / ${ids.length}` : "0 / 0"}
        </span>
        <button className="focus-exit" onClick={() => setFocus(false)}>
          <X size={16} /> Exit (Esc)
        </button>
      </div>

      <nav className="focus-tabs">
        {sections.map((s) => {
          const m = CATEGORIES[s.cat];
          return (
            <button
              key={s.cat}
              className={`focus-tab${s.cat === activeCat ? " is-active" : ""}`}
              style={
                {
                  ["--accent" as string]: m.accent,
                  ["--tint" as string]: m.tint,
                } as React.CSSProperties
              }
              onClick={() => selectCat(s.cat)}
            >
              {m.label}
              <span className="focus-tab-count">{s.ids.length}</span>
            </button>
          );
        })}
      </nav>

      {item ? (
        <div className="focus-stage">
          <h2 className={`focus-title${item.done ? " is-done" : ""}`}>{item.title}</h2>

          {(item.assignee || item.dueDate || item.eventDate) && (
            <div className="focus-meta">
              {item.eventDate && <span>📅 {item.eventDate}</span>}
              {item.dueDate && <span>⏰ due {item.dueDate}</span>}
              {item.assignee && <span>👤 {item.assignee}</span>}
            </div>
          )}

          {item.notes && <p className="focus-notes">{item.notes}</p>}

          {item.children.length > 0 && (
            <ul className="focus-subs">
              {item.children.map((c) => (
                <li key={c.id} className={c.done ? "is-done" : ""}>
                  <button
                    className={`focus-subcheck${c.done ? " is-done" : ""}`}
                    onClick={() => toggleDone(activeCat, c.id)}
                  >
                    {c.done && <Check size={12} strokeWidth={3} />}
                  </button>
                  {c.title}
                </li>
              ))}
            </ul>
          )}

          <div className="focus-actions">
            <button
              className={`focus-btn${item.done ? " on-done" : ""}`}
              onClick={() => {
                toggleDone(activeCat, item.id);
                if (!item.done) advance();
              }}
            >
              <Check size={16} /> {item.done ? "Checked off" : "Check off"}
            </button>
            <button
              className={`focus-btn${item.parked ? " on-park" : ""}`}
              onClick={() => {
                togglePark(activeCat, item.id);
                if (!item.parked) advance();
              }}
            >
              <Pin size={15} /> {item.parked ? "Parked" : "Park"}
            </button>
          </div>
        </div>
      ) : (
        <div className="focus-stage focus-empty">
          <p>Nothing to discuss in {meta.label}.</p>
        </div>
      )}

      <div className="focus-nav">
        <button onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index <= 0}>
          <ChevronLeft size={18} /> Prev
        </button>
        <span className="focus-hint">
          <CornerDownLeft size={13} /> ← → or Space cycles this section
        </span>
        <button
          onClick={() => setIndex((i) => Math.min(i + 1, ids.length - 1))}
          disabled={index >= ids.length - 1}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
