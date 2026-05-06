// Hackathon demo scaffolding.
// See docs/BOSTON_HACKATHON_DEMO_PLAN.md and docs/CONTROL_LOOP_SPEC.md.

"use client";

import { useEventStore, ControlEvent, ControlEventCategory, ControlEventStatus } from "@/lib/eventStore";
import { useEffect, useState } from "react";

const CATEGORY_COLORS: Record<ControlEventCategory, string> = {
  controller: "bg-green-500",
  plant: "bg-blue-500",
  sensor: "bg-amber-500",
  block: "bg-red-500",
  feedback: "bg-gray-400",
};

const CATEGORY_LABELS: Record<ControlEventCategory, string> = {
  controller: "Controller",
  plant: "Plant",
  sensor: "Sensor",
  block: "Blocked",
  feedback: "Feedback",
};

const STATUS_BADGES: Record<ControlEventStatus, { text: string; className: string }> = {
  PENDING: { text: "...", className: "bg-yellow-100 text-yellow-800 animate-pulse" },
  PASS: { text: "PASS", className: "bg-green-100 text-green-800" },
  FAIL: { text: "FAIL", className: "bg-red-100 text-red-800" },
  BLOCKED: { text: "BLOCKED", className: "bg-red-100 text-red-800 font-bold" },
  ALERT: { text: "ALERT", className: "bg-amber-100 text-amber-800" },
  ROUTED: { text: "PENDING", className: "bg-purple-100 text-purple-800 animate-pulse" },
  CHAINED: { text: "CHAINED", className: "bg-gray-100 text-gray-700" },
};

function EventRow({ event }: { event: ControlEvent }) {
  const dot = CATEGORY_COLORS[event.category];
  const badge = STATUS_BADGES[event.status];

  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-gray-100 last:border-b-0 transition-all duration-200 ease-out animate-in">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot} ${event.status === "PENDING" ? "animate-pulse" : ""}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{event.label}</span>
          <div className="flex items-center gap-2 shrink-0">
            {event.value !== undefined && (
              <span className="text-xs font-mono text-gray-600">
                {event.value.toFixed(2)}
                {event.threshold !== undefined && (
                  <span className="text-gray-400"> / {event.threshold.toFixed(2)}</span>
                )}
              </span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>
              {badge.text}
            </span>
            {event.duration_ms !== undefined && (
              <span className="text-xs text-gray-400 font-mono w-12 text-right">
                {event.duration_ms}ms
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{event.detail}</p>
      </div>
    </div>
  );
}

// Hardcoded test events for visual verification (Step 3 only, removed when wiring in Step 7)
const DEMO_TEST_EVENTS: Omit<ControlEvent, "id" | "timestamp" | "demoMode">[] = [
  { category: "controller", stage: "rbac", label: "RBAC authorization", detail: "operator1 authorized for query", status: "PASS", duration_ms: 0 },
  { category: "plant", stage: "retrieval", label: "Retrieval: confined space rescue", detail: "3 documents, top score 0.87", status: "PASS", value: 0.87, duration_ms: 142 },
  { category: "plant", stage: "retrieval", label: "Retrieval: atmospheric hazards petroleum", detail: "2 documents, top score 0.79", status: "PASS", value: 0.79, duration_ms: 198 },
  { category: "sensor", stage: "acl", label: "ACL filter", detail: "5 of 5 documents authorized", status: "PASS", value: 5, duration_ms: 2 },
  { category: "controller", stage: "evidence", label: "Evidence threshold", detail: "combined score 0.83, threshold 0.70", status: "PASS", value: 0.83, threshold: 0.70, duration_ms: 1 },
  { category: "controller", stage: "hhem", label: "HHEM factual consistency", detail: "response grounded in sources", status: "PASS", value: 0.91, threshold: 0.65, duration_ms: 847 },
  { category: "sensor", stage: "tool_auth", label: "Tool: check_procedure_currency", detail: "SOP-CS-001 updated 3 days ago", status: "ALERT", duration_ms: 23 },
  { category: "block", stage: "tool_auth", label: "Tool: queue_notification (severity-1)", detail: "Operator role lacks send permission", status: "BLOCKED", duration_ms: 4 },
  { category: "controller", stage: "hitl", label: "Routed to supervisor approval queue", detail: "Awaiting supervisor review", status: "ROUTED", duration_ms: 6 },
  { category: "feedback", stage: "audit", label: "Audit entry #4721", detail: "HMAC chain: 8f3a...c291 verified", status: "CHAINED", duration_ms: 12 },
];

export function ControlFeedback() {
  const events = useEventStore((state) => state.events);
  const clear = useEventStore((state) => state.clear);
  const addEvent = useEventStore((state) => state.addEvent);
  const [useDemoData, setUseDemoData] = useState(true);

  // Load demo data on mount for visual verification
  useEffect(() => {
    if (useDemoData && events.length === 0) {
      DEMO_TEST_EVENTS.forEach((event) => addEvent(event));
    }
  }, [useDemoData, events.length, addEvent]);

  const displayEvents = events;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Control Feedback</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { clear(); setUseDemoData(false); }}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayEvents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            Waiting for agent action...
          </div>
        ) : (
          displayEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Controller</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Plant</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Sensor</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Blocked</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Feedback</span>
        </div>
      </div>
    </div>
  );
}
