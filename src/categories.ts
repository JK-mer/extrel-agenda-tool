import type { CategoryKey } from "./types";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  /** One-line purpose, shown as a quiet subtitle on empty tiles. */
  blurb: string;
  /** Accent colour driving the whole tile's identity (from the MERICS palette). */
  accent: string;
  /** Soft tint used for the tile's background wash. */
  tint: string;
}

/* Accents drawn from the MERICS secondary palette (Colours.pdf).
   The primary Light Red (#E8412B) is reserved for app chrome / primary
   actions, so categories use the secondary colours only. */
export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  admin: {
    key: "admin",
    label: "Admin",
    blurb: "Internal operations & housekeeping",
    accent: "#116179", // Dark Blue
    tint: "rgba(17, 97, 121, 0.07)",
  },
  events: {
    key: "events",
    label: "Events",
    blurb: "Upcoming formats, logistics & follow-ups",
    accent: "#EC6500", // Orange
    tint: "rgba(236, 101, 0, 0.08)",
  },
  memberships: {
    key: "memberships",
    label: "Memberships",
    blurb: "Renewals, onboarding & member care",
    accent: "#516234", // Dark Green
    tint: "rgba(81, 98, 52, 0.08)",
  },
  stakeholder: {
    key: "stakeholder",
    label: "Stakeholder",
    blurb: "Partners, sponsors & relationships",
    accent: "#DD0646", // Raspberry
    tint: "rgba(221, 6, 70, 0.07)",
  },
  fellows: {
    key: "fellows",
    label: "Fellows",
    blurb: "Cohort, nominations & engagement",
    accent: "#D1B300", // Mustard
    tint: "rgba(209, 179, 0, 0.10)",
  },
  recurring: {
    key: "recurring",
    label: "Recurring",
    blurb: "Standing items we revisit every week",
    accent: "#A69044", // Olive
    tint: "rgba(166, 144, 68, 0.10)",
  },
  other: {
    key: "other",
    label: "Other",
    blurb: "Anything that doesn't fit the boxes above",
    accent: "#70706F", // Grey
    tint: "rgba(112, 112, 111, 0.08)",
  },
};

export const DEFAULT_CATEGORY_ORDER: CategoryKey[] = [
  "admin",
  "events",
  "memberships",
  "stakeholder",
  "fellows",
  "recurring",
  "other",
];
