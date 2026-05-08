// Hackathon demo scaffolding.
// Event contract is forward-compatible with production SSE.
// See docs/BOSTON_HACKATHON_DEMO_PLAN.md and docs/CONTROL_LOOP_SPEC.md.

import { create } from 'zustand';
import { REPLAY_QUERIES } from './demoReplayData';
import type { ReplayQueryId } from './demoReplayData';

export type ControlEventCategory =
  | 'controller'
  | 'plant'
  | 'sensor'
  | 'block'
  | 'feedback';

export type ControlEventStatus =
  | 'PENDING'
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'ALERT'
  | 'ROUTED'
  | 'CHAINED';

export type ControlEventStage =
  | 'rbac'
  | 'retrieval'
  | 'acl'
  | 'evidence'
  | 'generation'
  | 'hhem'
  | 'tool_auth'
  | 'tool_exec'
  | 'hitl'
  | 'audit';

export type ControlEvent = {
  id: string;
  timestamp: number;
  category: ControlEventCategory;
  stage: ControlEventStage;
  label: string;
  detail: string;
  status: ControlEventStatus;
  value?: number;
  threshold?: number;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
  demoMode: true;
};

type EventStore = {
  events: ControlEvent[];
  demoMode: 'live' | 'replay';
  replayStatus: 'idle' | 'playing' | 'done';
  activeQueryId: ReplayQueryId | null;
  addEvent: (event: Omit<ControlEvent, 'id' | 'timestamp' | 'demoMode'>) => string;
  updateEvent: (id: string, updates: Partial<Pick<ControlEvent, 'status' | 'value' | 'duration_ms' | 'detail'>>) => void;
  clear: () => void;
  setDemoMode: (mode: 'live' | 'replay') => void;
  replayQuery: (queryId: ReplayQueryId) => void;
};

// Held outside the store so both clear() and setDemoMode() can cancel in-flight replays.
let replayTimeouts: ReturnType<typeof setTimeout>[] = [];

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  demoMode: 'live',
  replayStatus: 'idle',
  activeQueryId: null,

  addEvent: (event) => {
    const id = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      events: [...state.events, {
        ...event,
        id,
        timestamp: Date.now(),
        demoMode: true,
      }],
    }));
    return id;
  },

  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    ),
  })),

  clear: () => {
    replayTimeouts.forEach(clearTimeout);
    replayTimeouts = [];
    set({ events: [], replayStatus: 'idle', activeQueryId: null });
  },

  setDemoMode: (mode) => {
    replayTimeouts.forEach(clearTimeout);
    replayTimeouts = [];
    set({ demoMode: mode, events: [], replayStatus: 'idle', activeQueryId: null });
  },

  replayQuery: (queryId: ReplayQueryId) => {
    const query = REPLAY_QUERIES[queryId];
    if (!query) return;

    replayTimeouts.forEach(clearTimeout);
    replayTimeouts = [];

    set({ events: [], replayStatus: 'playing', activeQueryId: queryId });

    const { addEvent, updateEvent } = get();
    let hhemPendingId: string | null = null;

    for (const event of query.events) {
      const { isUpdate, delay_ms, ...eventData } = event;
      const t = setTimeout(() => {
        if (isUpdate && hhemPendingId !== null) {
          updateEvent(hhemPendingId, {
            status: eventData.status,
            value: eventData.value,
            detail: eventData.detail,
            duration_ms: eventData.duration_ms,
          });
          hhemPendingId = null;
        } else {
          const id = addEvent(eventData);
          if (eventData.stage === 'hhem' && eventData.status === 'PENDING') {
            hhemPendingId = id;
          }
        }
      }, delay_ms);
      replayTimeouts.push(t);
    }

    const maxDelay = Math.max(...query.events.map((e) => e.delay_ms));
    const doneTimer = setTimeout(() => {
      set({ replayStatus: 'done' });
    }, maxDelay + 200);
    replayTimeouts.push(doneTimer);
  },
}));
