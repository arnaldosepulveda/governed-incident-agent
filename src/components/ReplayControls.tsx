// Hackathon demo scaffolding.
// See docs/BOSTON_HACKATHON_DEMO_PLAN.md and docs/CONTROL_LOOP_SPEC.md.

"use client";

import { useEventStore } from "@/lib/eventStore";
import { REPLAY_QUERIES, ReplayQueryId } from "@/lib/demoReplayData";

export function ReplayControls() {
  const clear = useEventStore((s) => s.clear);
  const replayQuery = useEventStore((s) => s.replayQuery);
  const replayStatus = useEventStore((s) => s.replayStatus);
  const activeQueryId = useEventStore((s) => s.activeQueryId);

  return (
    <div className="flex items-center gap-2">
      {(Object.entries(REPLAY_QUERIES) as [ReplayQueryId, (typeof REPLAY_QUERIES)[ReplayQueryId]][]).map(
        ([id, query]) => (
          <button
            key={id}
            onClick={() => {
              clear();
              setTimeout(() => replayQuery(id), 50);
            }}
            disabled={replayStatus === "playing"}
            className={`font-mono text-[11px] px-2 py-1 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeQueryId === id
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300"
            }`}
          >
            {query.label}
          </button>
        )
      )}
    </div>
  );
}
