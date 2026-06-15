import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useAgendaStore } from "../store/useAgendaStore";
import type { CategoryKey } from "../types";
import { CATEGORIES } from "../categories";
import { CategoryTile } from "./CategoryTile";

export function TileBoard() {
  const meeting = useAgendaStore((s) => s.meetings[s.activeMeetingId]);
  const reorderCategories = useAgendaStore((s) => s.reorderCategories);
  const [dragging, setDragging] = useState<CategoryKey | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!meeting) return null;
  const order = meeting.categoryOrder;

  function onDragStart(e: DragStartEvent) {
    setDragging(e.active.id as CategoryKey);
  }
  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      reorderCategories(active.id as CategoryKey, over.id as CategoryKey);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <main className="board">
          {order.map((key, i) => (
            <CategoryTile key={key} categoryKey={key} index={i} />
          ))}
        </main>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className="tile tile--overlay" style={tileVars(dragging)}>
            <div className="tile-head">
              <span className="tile-label">{CATEGORIES[dragging].label}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function tileVars(key: CategoryKey): React.CSSProperties {
  const meta = CATEGORIES[key];
  return {
    // exposed as CSS variables consumed by the tile styles
    ["--accent" as string]: meta.accent,
    ["--tint" as string]: meta.tint,
  };
}
