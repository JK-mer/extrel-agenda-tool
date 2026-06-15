# Dynamics events auto-pull — design note (future phase)

Goal: auto-populate the **Events** tile from MERICS Dynamics 365 (Dataverse),
the same source the [Dynamics Kanban](../../Dynamics%20Kanban/merics-dynamics-kanban/)
board reads. Not built yet — this records the plan so today's code leaves room
for it.

## Source

- **Entity:** `msevtmgt_event` (Dataverse Marketing Events + MERICS custom fields)
- **API:** `https://merics.crm4.dynamics.com/api/data/v9.2` (OData)
- **Auth:** Entra ID / MSAL, scope `https://merics.crm4.dynamics.com/user_impersonation`
  — same tenant as the planned Microsoft SSO, so one sign-in covers both.
- **Reference client:** `Dynamics Kanban/merics-dynamics-kanban/js/dynamics.js`
  (fetch + OData annotation normalization), config in `js/config.js`.

## Field mapping (Dynamics → AgendaItem)

| AgendaItem      | Dynamics field             |
| --------------- | -------------------------- |
| `title`         | `msevtmgt_name`            |
| `eventDate`     | `msevtmgt_eventstartdate`  |
| (end, later)    | `msevtmgt_eventenddate`    |
| `source.id`     | `msevtmgt_eventid` (GUID)  |
| `source.entity` | `"msevtmgt_events"`        |

Active-events filter (from the Kanban): `statecode eq 0 and pd_event_type_opt ne 862180005`.

## How today's code is ready

- `AgendaItem.source?: ItemSource` already exists. Pulled events carry their
  Dynamics GUID here so a re-pull can **match & update** instead of duplicating,
  and hand-added items (`source: null`) are never touched by a sync.
- Data access is already behind `AgendaRepository`; a Dynamics fetch becomes an
  `EventSource` that yields `AgendaItem`s merged into the Events category.
- Events already sort by `eventDate`, so pulled events slot in by date for free.

## Open questions for when we build it

- One-way pull (Dynamics → agenda) first; write-back (e.g. notes) is out of scope.
- Reconciliation: keep local-only fields (notes, assignee, done/park/sleep) when
  refreshing a synced event — merge by `source.id`, overwrite only mapped fields.
- Where to trigger the pull (on load, manual "Sync events" button, scheduled).
