import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronRight,
  GripVertical,
  Pin,
  Plus,
  Trash2,
  Maximize2,
} from "lucide-react";
import { useAgendaStore } from "../store/useAgendaStore";
import type { AgendaItem, CategoryKey } from "../types";
import { AddItemInline } from "./AddItemInline";
import { formatShortDate } from "../lib/date";

interface RowProps {
  item: AgendaItem;
  categoryKey: CategoryKey;
  depth: number;
  sortable?: boolean;
  /** When true (board), clicking the title opens the detail modal.
   *  When false (inside the modal), clicking the title edits inline. */
  openInModal?: boolean;
}

export function AgendaItemRow(props: RowProps) {
  return props.sortable ? <SortableRow {...props} /> : <RowBody {...props} />;
}

/**
 * The left-hand status control. Open items pop a small Check / Park menu;
 * an already resolved item toggles straight back to open. Parked items show a
 * pin in place of the checkmark — no separate pin button needed.
 */
function StatusControl({
  item,
  onDone,
  onPark,
}: {
  item: AgendaItem;
  onDone: () => void;
  onPark: () => void;
}) {
  const [menu, setMenu] = useState(false);

  function handleClick() {
    if (item.done) return onDone(); // un-check
    if (item.parked) return onPark(); // un-park
    setMenu(true);
  }

  return (
    <div className="status-wrap">
      <button
        className={`row-check${item.done ? " is-done" : ""}${
          item.parked ? " is-parked" : ""
        }`}
        onClick={handleClick}
        aria-label={
          item.done
            ? "Checked off — click to undo"
            : item.parked
              ? "Parked — click to undo"
              : "Resolve item"
        }
        title={
          item.done
            ? "Checked off"
            : item.parked
              ? "Parked → next week"
              : "Check off or park"
        }
      >
        {item.done ? (
          <Check size={13} strokeWidth={3} />
        ) : item.parked ? (
          <Pin size={12} />
        ) : null}
      </button>
      {menu && (
        <>
          <div className="status-pop-backdrop" onClick={() => setMenu(false)} />
          <div className="status-pop" role="menu">
            <button
              onClick={() => {
                onDone();
                setMenu(false);
              }}
            >
              <Check size={14} /> Check off
            </button>
            <button
              onClick={() => {
                onPark();
                setMenu(false);
              }}
            >
              <Pin size={14} /> Park
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SortableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.item.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };
  return (
    <RowBody
      {...props}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}

interface RowBodyProps extends RowProps {
  setNodeRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  handleProps?: Record<string, unknown>;
}

function RowBody({
  item,
  categoryKey,
  depth,
  openInModal = true,
  setNodeRef,
  style,
  isDragging,
  handleProps,
}: RowBodyProps) {
  const toggleDone = useAgendaStore((s) => s.toggleDone);
  const togglePark = useAgendaStore((s) => s.togglePark);
  const toggleCollapse = useAgendaStore((s) => s.toggleCollapse);
  const removeItem = useAgendaStore((s) => s.removeItem);
  const updateItem = useAgendaStore((s) => s.updateItem);
  const addChild = useAgendaStore((s) => s.addChild);
  const openItem = useAgendaStore((s) => s.openItem);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const [adding, setAdding] = useState(false);

  const hasChildren = item.children.length > 0;
  const collapsed = item.collapsed && hasChildren;

  function commitEdit() {
    const t = draft.trim();
    if (t) updateItem(categoryKey, item.id, { title: t });
    else setDraft(item.title);
    setEditing(false);
  }

  function onTitleClick() {
    setDraft(item.title);
    setEditing(true);
  }

  const stateClass = item.done ? " row--done" : item.parked ? " row--parked" : "";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`row row--d${depth}${isDragging ? " row--dragging" : ""}${stateClass}`}
    >
      <div className="row-main">
        {handleProps ? (
          <button className="row-grip" {...handleProps} aria-label="Reorder item">
            <GripVertical size={15} />
          </button>
        ) : (
          <span className="row-grip row-grip--ghost" />
        )}

        <StatusControl
          item={item}
          onDone={() => toggleDone(categoryKey, item.id)}
          onPark={() => togglePark(categoryKey, item.id)}
        />

        {hasChildren ? (
          <button
            className={`row-chevron${collapsed ? "" : " row-chevron--open"}`}
            onClick={() => toggleCollapse(categoryKey, item.id)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronRight size={15} />
          </button>
        ) : (
          <span className="row-chevron-spacer" />
        )}

        {editing ? (
          <input
            className="row-edit"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(item.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="row-title" onClick={onTitleClick}>
            {item.title}
            {categoryKey === "events" && item.eventDate && (
              <span className="row-eventdate">{formatShortDate(item.eventDate)}</span>
            )}
            {item.assignee && <span className="row-assignee">{item.assignee}</span>}
          </span>
        )}

        <div className="row-tools">
          <div className="row-actions">
            {openInModal && (
              <button
                onClick={() => openItem(categoryKey, item.id)}
                aria-label="Open details"
                title="Open details"
              >
                <Maximize2 size={13} />
              </button>
            )}
            <button onClick={() => setAdding((v) => !v)} aria-label="Add sub-item">
              <Plus size={15} />
            </button>
            <button
              className="row-del"
              onClick={() => removeItem(categoryKey, item.id)}
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {adding && (
        <div className="row-addchild">
          <AddItemInline
            placeholder="Add sub-item…"
            autoFocus
            onSubmit={(title) => addChild(categoryKey, item.id, title)}
            onClose={() => setAdding(false)}
          />
        </div>
      )}

      {hasChildren && !collapsed && (
        <ul className="item-list item-list--nested">
          {item.children.map((child) => (
            <AgendaItemRow
              key={child.id}
              item={child}
              categoryKey={categoryKey}
              depth={depth + 1}
              openInModal={openInModal}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
