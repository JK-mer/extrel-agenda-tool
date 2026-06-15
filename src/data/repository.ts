import type { AgendaState } from "../types";

/**
 * Storage boundary for the whole app.
 *
 * Today this is backed by localStorage. When we move to Azure DevOps + a real
 * database with Microsoft SSO, we implement this same interface against the API
 * and swap the instance in `getRepository()` — no component or store changes.
 */
export interface AgendaRepository {
  load(): Promise<AgendaState | null>;
  save(state: AgendaState): Promise<void>;
}
