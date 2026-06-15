import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GripVertical, Moon } from "lucide-react";
import { useAgendaStore } from "../store/useAgendaStore";
import { CATEGORIES } from "../categories";
import type { CategoryKey } from "../types";
import { awakeItems, countTree, displayOrder, isAsleep } from "../lib/tree";
import { formatShortDate } from "../lib/date";
import { useRowSpan } from "../lib/useRowSpan";
import { tileVars } from "./TileBoard";
import { AgendaItemRow } from "./AgendaItemRow";
import { AddItemInline } from "./AddItemInline";

export function CategoryTile({
  categoryKey,
  index,
}: {
  categoryKey: CategoryKey;
  index: number;
}) {
  const meta = CATEGORIES[categoryKey];
  const meeting = useAgendaStore((s) => s.meetings[s.activeMeetingId]);
  const addItem = useAgendaStore((s) => s.addItem);
  const reorderItems = useAgendaStore((s) => s.reorderItems);
  const openItem = useAgendaStore((s) => s.openItem);
  const revealSleeping = useAgendaStore((s) => s.revealSleeping);

  const [showSleeping, setShowSleeping] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: categoryKey });
  const { ref: innerRef, span } = useRowSpan<HTMLDivElement>();

  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (!meeting) return null;
  const items = meeting.items[categoryKey];
  const refDate = meeting.date;
  const awake = awakeItems(items, refDate);
  const sleeping = items.filter((i) => isAsleep(i, refDate));
  const ordered = displayOrder(awake, { byEventDate: categoryKey === "events" });
  const sleepingShown = revealSleeping || showSleeping;
  const { total, done } = countTree(awake);
  const pct = total ? Math.round((done / total) * 100) : 0;

  const style: React.CSSProperties = {
    ...tileVars(categoryKey),
    gridRowEnd: `span ${span}`,
    transform: CSS.Translate.toString(transform),
    transition,
    animationDelay: `${index * 60}ms`,
  };

  function onItemDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      reorderItems(categoryKey, String(active.id), String(over.id));
    }
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`tile tile--enter${isDragging ? " tile--dragging" : ""}`}
    >
      <div className="tile-accent" />
      <div className="tile-inner" ref={innerRef}>
      <header className="tile-head">
        <button
          className="tile-grip"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${meta.label} tile`}
        >
          <GripVertical size={16} />
        </button>
        <div className="tile-title">
          <span className="tile-label">{meta.label}</span>
          <span className="tile-count">{total === 0 ? "empty" : `${done}/${total}`}</span>
        </div>
        <div className="tile-ring" aria-hidden>
          <svg viewBox="0 0 36 36">
            <circle className="ring-bg" cx="18" cy="18" r="15.5" />
            <circle
              className="ring-fg"
              cx="18"
              cy="18"
              r="15.5"
              strokeDasharray={`${pct} 100`}
              pathLength={100}
            />
          </svg>
        </div>
      </header>

      <div className="tile-body">
        {awake.length === 0 && sleeping.length === 0 ? (
          <p className="tile-blurb">{meta.blurb}</p>
        ) : awake.length === 0 ? null : (
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            onDragEnd={onItemDragEnd}
          >
            <SortableContext
              items={ordered.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="item-list">
                {ordered.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    categoryKey={categoryKey}
                    depth={0}
                    sortable
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <AddItemInline
          placeholder="Add agenda item…"
          onSubmit={(title) => addItem(categoryKey, title)}
        />

        {sleeping.length > 0 && (
          <div className="tile-sleeping">
            <button
              className="tile-sleeping-toggle"
              onClick={() => setShowSleeping((v) => !v)}
            >
              <Moon size={13} />
              {sleeping.length} sleeping
            </button>
            {sleepingShown && (
              <ul className="sleeping-list">
                {sleeping.map((it) => (
                  <li key={it.id}>
                    <button
                      className="sleeping-row"
                      onClick={() => openItem(categoryKey, it.id)}
                      title="Open to wake or reschedule"
                    >
                      <Moon size={12} />
                      <span className="sleeping-title">{it.title}</span>
                      <span className="sleeping-until">
                        until {formatShortDate(it.sleepUntil!)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
