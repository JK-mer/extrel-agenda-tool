# ExtRel Agenda-Tool

A tile-based agenda for the MERICS **External Relations** team's weekly meeting —
a faster, more intuitive replacement for the previous OneNote copy-paste workflow.

Agenda items live in six topic tiles plus a catch-all, resize with their content,
and reorder by drag. Each item can be checked off, parked (auto-carried to next
week), or slept (hidden until a date), and opens a detail view for notes,
assignee, due date and sub-items. A focus/present mode walks the meeting one item
at a time.

## Features

- **Tile board** — Admin, Events, Memberships, Stakeholder, Fellows, Recurring, Other.
  Masonry layout (tiles pack by content height), drag-to-reorder.
- **Agenda items** — nested sub-items with collapse, inline rename, drag reorder,
  per-item detail modal (notes, assignee, due date + reminder, sub-items, delete).
- **Resolution** — check off (done), **park** (auto-carried into next week), or
  **sleep** (hidden until a chosen date). Mutually exclusive; resolved items float
  to the bottom without changing the stored order.
- **Events** order by their event date.
- **Weekly timeline** — move forward continuously (each new meeting is +7 days,
  carrying open + parked items); reschedule any meeting via the date picker;
  two meetings can share a week. "Now" jumps to the current/next session.
- **Focus mode** — full-screen presentation with section tabs; cycle items with
  ← → / Space, Esc to exit.
- **Dark mode**, MERICS corporate design (Neo Sans Pro + corporate palette).
- Data persists to **localStorage** behind a swappable repository layer.

## Tech stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [dnd-kit](https://dndkit.com/) for drag-and-drop
- [zustand](https://github.com/pmndrs/zustand) for state
- [lucide-react](https://lucide.dev/) icons

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
npm run preview    # preview the production build
```

## Project structure

```
src/
  components/   Header, TileBoard, CategoryTile, AgendaItemRow, ItemModal, FocusMode
  store/        useAgendaStore.ts — zustand store + localStorage persistence
  data/         repository interface, localStorage impl, seed/mock data
  lib/          tree helpers, masonry row-span hook, date utils
  categories.ts category metadata (labels, accents)
  types.ts      domain model
public/         MERICS logo + Neo Sans Pro fonts
docs/           dynamics-integration.md — planned Dynamics events sync
```

## Roadmap

1. **Now** — local mock data in the browser (this build).
2. **Backend + auth** — move to Azure DevOps with a database and **Microsoft SSO**.
   The data layer (`src/data/`) is already isolated behind `AgendaRepository`.
3. **Integrations** — auto-pull Events from **Dynamics 365** (see
   [`docs/dynamics-integration.md`](docs/dynamics-integration.md)); sync
   assignees / due dates / reminders to **Microsoft To Do / Outlook** via Graph.

## Note on assets

`public/` contains the MERICS logo and the proprietary **Neo Sans Pro** font, which
the app needs to render in the corporate design. Keep this repository private, or
remove those assets before making it public.
