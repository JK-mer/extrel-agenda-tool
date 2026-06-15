import type { AgendaState } from "../types";
import type { AgendaRepository } from "./repository";

const STORAGE_KEY = "extrel-agenda/v3";

export class LocalStorageRepository implements AgendaRepository {
  async load(): Promise<AgendaState | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AgendaState;
    } catch (err) {
      console.warn("Could not read saved agenda; starting fresh.", err);
      return null;
    }
  }

  async save(state: AgendaState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Could not persist agenda.", err);
    }
  }
}

let instance: AgendaRepository | null = null;

/** Single place that decides which backend the app talks to. */
export function getRepository(): AgendaRepository {
  if (!instance) instance = new LocalStorageRepository();
  return instance;
}
