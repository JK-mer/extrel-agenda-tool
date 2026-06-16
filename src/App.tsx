import { useEffect } from "react";
import { useAgendaStore } from "./store/useAgendaStore";
import { Header } from "./components/Header";
import { TileBoard } from "./components/TileBoard";
import { ItemModal } from "./components/ItemModal";
import { FocusMode } from "./components/FocusMode";

export default function App() {
  const hydrated = useAgendaStore((s) => s.hydrated);
  const hydrate = useAgendaStore((s) => s.hydrate);
  const activeMeetingId = useAgendaStore((s) => s.activeMeetingId);
  const meeting = useAgendaStore((s) => s.meetings[s.activeMeetingId]);
  const resetSampleData = useAgendaStore((s) => s.resetSampleData);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated || !meeting) {
    return (
      <div className="app-loading">
        <span>Preparing the agenda…</span>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <div className="content">
        {/* key forces a fresh staggered entrance when switching weeks */}
        <TileBoard key={activeMeetingId} />
        <footer className="app-foot">
          <button
            className="reset-link"
            onClick={() => {
              if (confirm("Reset to fresh sample data? This clears your local changes."))
                resetSampleData();
            }}
          >
            Reset sample data
          </button>
        </footer>
      </div>
      <ItemModal />
      <FocusMode />
    </div>
  );
}
