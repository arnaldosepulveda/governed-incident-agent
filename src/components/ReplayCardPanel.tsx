// Hackathon demo scaffolding.
// See docs/BOSTON_HACKATHON_DEMO_PLAN.md and docs/CONTROL_LOOP_SPEC.md.

"use client";

import { useEventStore } from "@/lib/eventStore";
import {
  REPLAY_QUERIES,
  REPLAY_CARD_CONTENT,
  ReplayQueryId,
} from "@/lib/demoReplayData";

export function ReplayCardPanel() {
  const activeQueryId = useEventStore((s) => s.activeQueryId);
  const replayStatus = useEventStore((s) => s.replayStatus);

  if (!activeQueryId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
        <p className="font-mono text-sm font-semibold text-amber-600 uppercase tracking-widest">
          REPLAY MODE
        </p>
        <p className="text-xs text-gray-400">
          Select a query above to replay the governance cascade. No network
          connection required.
        </p>
      </div>
    );
  }

  const query = REPLAY_QUERIES[activeQueryId as ReplayQueryId];
  const content = REPLAY_CARD_CONTENT[activeQueryId as ReplayQueryId];
  const isRefuse = content.outcome === "REFUSE";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-4 gap-4">
      {/* Query bubble — right-aligned, mimics user message */}
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800">
          {query.queryText}
        </div>
      </div>

      {/* State: running */}
      {replayStatus === "playing" && (
        <div className="flex items-center gap-2 px-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
          <span className="text-sm text-gray-500">
            Governance cascade running...
          </span>
        </div>
      )}

      {/* State: done — render result cards */}
      {replayStatus === "done" && (
        <div className="flex flex-col gap-3">
          {content.cards.map((card, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 shadow-sm ${
                isRefuse
                  ? "border-amber-300 bg-amber-50"
                  : "border-emerald-300 bg-emerald-50"
              }`}
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3
                  className={`font-semibold text-sm ${
                    isRefuse ? "text-amber-900" : "text-emerald-900"
                  }`}
                >
                  {card.title}
                </h3>
                <span
                  className={`shrink-0 text-[11px] font-mono px-2 py-0.5 rounded border ${
                    isRefuse
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}
                >
                  {content.outcome}
                </span>
              </div>

              {/* Citation */}
              {card.citation && (
                <p
                  className={`text-xs mb-2 ${
                    isRefuse ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {card.procedureId && (
                    <span className="font-mono font-medium">
                      {card.procedureId} ·{" "}
                    </span>
                  )}
                  {card.citation}
                </p>
              )}

              {/* Summary */}
              <pre
                className={`text-xs whitespace-pre-wrap font-sans ${
                  isRefuse ? "text-amber-900" : "text-emerald-900"
                }`}
              >
                {card.summary}
              </pre>
            </div>
          ))}

          {/* Footer */}
          <p className="font-mono text-[10px] text-gray-400 text-center pt-1">
            REPLAY MODE | No LLM call | Hardcoded event playback
          </p>
        </div>
      )}
    </div>
  );
}
