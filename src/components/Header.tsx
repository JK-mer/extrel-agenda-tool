import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Eye, Presentation, Moon, Sun } from "lucide-react";
import { useAgendaStore } from "../store/useAgendaStore";
import type { CategoryKey } from "../types";
import { countTree, isAsleep } from "../lib/tree";

function formatWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Header() {
  const meetings = useAgendaStore((s) => s.meetings);
  const activeId = useAgendaStore((s) => s.activeMeetingId);
  const setActiveMeeting = useAgendaStore((s) => s.setActiveMeeting);
  const startNewWeek = useAgendaStore((s) => s.startNewWeek);
  const jumpToNow = useAgendaStore((s) => s.jumpToNow);
  const updateMeetingDate = useAgendaStore((s) => s.updateMeetingDate);
  const revealSleeping = useAgendaStore((s) => s.revealSleeping);
  const toggleRevealSleeping = useAgendaStore((s) => s.toggleRevealSleeping);
  const setFocus = useAgendaStore((s) => s.setFocus);
  const theme = useAgendaStore((s) => s.theme);
  const toggleTheme = useAgendaStore((s) => s.toggleTheme);

  const meeting = meetings[activeId];
  const dateInputRef = useRef<HTMLInputElement>(null);

  const sortedIds = useMemo(
    () =>
      Object.values(meetings)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((m) => m.id),
    [meetings],
  );
  const idx = sortedIds.indexOf(activeId);
  const prevId = idx > 0 ? sortedIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < sortedIds.length - 1 ? sortedIds[idx + 1] : null;

  const progress = useMemo(() => {
    if (!meeting) return { total: 0, done: 0 };
    return (Object.keys(meeting.items) as CategoryKey[]).reduce(
      (acc, cat) => {
        const c = countTree(meeting.items[cat]);
        acc.total += c.total;
        acc.done += c.done;
        return acc;
      },
      { total: 0, done: 0 },
    );
  }, [meeting]);

  const sleepingCount = useMemo(() => {
    if (!meeting) return 0;
    return (Object.keys(meeting.items) as CategoryKey[]).reduce(
      (n, cat) => n + meeting.items[cat].filter((i) => isAsleep(i, meeting.date)).length,
      0,
    );
  }, [meeting]);

  function openCalendar() {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
  }

  if (!meeting) return null;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <header className="toolbar-wrapper">
      <div className="toolbar">
        <div className="toolbar-brand">
          <img
            src={`${import.meta.env.BASE_URL}merics-logo.png`}
            alt="MERICS"
            className="toolbar-logo"
          />
          <span className="toolbar-divider" aria-hidden />
          <div className="toolbar-titles">
            <span className="toolbar-title">External Relations</span>
            <span className="toolbar-subtitle">Weekly Agenda</span>
          </div>
        </div>

        <span className="toolbar-spacer" />

        <div className="week-nav">
          <button
            className="week-btn"
            disabled={!prevId}
            onClick={() => prevId && setActiveMeeting(prevId)}
            title="Previous meeting"
            aria-label="Previous meeting"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="week-now"
            onClick={jumpToNow}
            title="Jump to the current / next meeting"
          >
            Now
          </button>
          <span className="week-date-wrap">
            <button
              className="week-date"
              onClick={openCalendar}
              title="Click to reschedule this meeting"
            >
              {formatWeek(meeting.date)}
            </button>
            <input
              ref={dateInputRef}
              type="date"
              className="week-date-native"
              value={meeting.date}
              onChange={(e) => e.target.value && updateMeetingDate(activeId, e.target.value)}
            />
          </span>
          <button
            className="week-btn"
            onClick={() => (nextId ? setActiveMeeting(nextId) : startNewWeek())}
            title={nextId ? "Next meeting" : "Create next meeting (+7 days)"}
            aria-label="Next meeting"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <span className="toolbar-spacer" />

        <div className="toolbar-tools">
          <button
            className={`tool-toggle${revealSleeping ? " is-on" : ""}`}
            onClick={toggleRevealSleeping}
            disabled={sleepingCount === 0 && !revealSleeping}
            title={
              sleepingCount === 0
                ? "No sleeping items"
                : revealSleeping
                  ? "Hide sleeping items"
                  : "Show all sleeping items"
            }
          >
            <Eye size={15} />
            {sleepingCount > 0 ? sleepingCount : null}
          </button>
          <button
            className="tool-toggle"
            onClick={() => setFocus(true)}
            title="Focus / present mode"
          >
            <Presentation size={15} />
          </button>
          <button
            className="tool-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="toolbar-progress" title={`${progress.done} of ${progress.total} covered`}>
          <span className="toolbar-label">Covered</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-num">
            {progress.done}
            <span className="muted">/{progress.total}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
