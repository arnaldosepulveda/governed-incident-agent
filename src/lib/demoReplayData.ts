// Hackathon demo scaffolding. Offline replay fallback for WiFi failure.
// See docs/BOSTON_HACKATHON_DEMO_PLAN.md and docs/CONTROL_LOOP_SPEC.md.

import type { ControlEvent, ControlEventCategory, ControlEventStage, ControlEventStatus } from './eventStore';

// ReplayEvent: same payload shape as addEvent's argument, plus timing and update flag.
// isUpdate: true means the replay runner calls updateEvent on the previous event
// at the same stage rather than addEvent (used for HHEM PENDING → PASS transition).
export type ReplayEvent = Omit<ControlEvent, 'id' | 'timestamp' | 'demoMode'> & {
  delay_ms: number;
  isUpdate?: boolean;
};

// ─── Query 1: Atmospheric testing — SERVE path (7 events) ────────────────────

export const REPLAY_QUERY_1_EVENTS: ReplayEvent[] = [
  {
    delay_ms: 0,
    category: 'controller' as ControlEventCategory,
    stage: 'rbac' as ControlEventStage,
    label: 'RBAC authorization',
    detail: 'Operator authorized for query',
    status: 'PASS' as ControlEventStatus,
    duration_ms: 0,
  },
  {
    delay_ms: 200,
    category: 'plant',
    stage: 'retrieval',
    label: 'Retrieval: atmospheric testing requirements',
    detail: '3 documents, top score 0.87',
    status: 'PASS',
    value: 0.87,
    threshold: 0.70,
    duration_ms: 142,
  },
  {
    delay_ms: 620,
    category: 'sensor',
    stage: 'acl',
    label: 'ACL filter',
    detail: '5 of 5 documents authorized',
    status: 'PASS',
    value: 5,
    duration_ms: 2,
  },
  {
    delay_ms: 820,
    category: 'controller',
    stage: 'evidence',
    label: 'Evidence threshold',
    detail: 'combined score 0.87, threshold 0.70',
    status: 'PASS',
    value: 0.87,
    threshold: 0.70,
    duration_ms: 1,
  },
  {
    delay_ms: 1050,
    category: 'controller',
    stage: 'hhem',
    label: 'HHEM factual consistency',
    detail: 'scoring response against retrieved sources...',
    status: 'PENDING',
  },
  {
    // Applied via updateEvent on the PENDING hhem event above
    delay_ms: 1897,
    isUpdate: true,
    category: 'controller',
    stage: 'hhem',
    label: 'HHEM factual consistency',
    detail: 'response grounded in sources',
    status: 'PASS',
    value: 0.91,
    threshold: 0.65,
    duration_ms: 847,
  },
  {
    delay_ms: 2097,
    category: 'feedback',
    stage: 'audit',
    label: 'Controller decision: SERVE',
    detail: '1 procedure retrieved. Audit chained.',
    status: 'CHAINED',
    duration_ms: 12,
  },
];

// ─── Query 2: Petroleum collapse — SERVE + BLOCK + ROUTE path (11 events) ────

export const REPLAY_QUERY_2_EVENTS: ReplayEvent[] = [
  {
    delay_ms: 0,
    category: 'controller',
    stage: 'rbac',
    label: 'RBAC authorization',
    detail: 'Operator authorized for query',
    status: 'PASS',
    duration_ms: 0,
  },
  {
    delay_ms: 200,
    category: 'plant',
    stage: 'retrieval',
    label: 'Retrieval (1 of 2): confined space rescue',
    detail: '3 documents, top score 0.89',
    status: 'PASS',
    value: 0.89,
    threshold: 0.70,
    duration_ms: 142,
  },
  {
    delay_ms: 600,
    category: 'plant',
    stage: 'retrieval',
    label: 'Retrieval (2 of 2): atmospheric hazards petroleum',
    detail: '2 documents, top score 0.84',
    status: 'PASS',
    value: 0.84,
    threshold: 0.70,
    duration_ms: 198,
  },
  {
    delay_ms: 900,
    category: 'sensor',
    stage: 'acl',
    label: 'ACL filter',
    detail: '5 of 5 documents authorized',
    status: 'PASS',
    value: 5,
    duration_ms: 2,
  },
  {
    delay_ms: 1100,
    category: 'controller',
    stage: 'evidence',
    label: 'Evidence threshold',
    detail: 'combined score 0.86, threshold 0.70',
    status: 'PASS',
    value: 0.86,
    threshold: 0.70,
    duration_ms: 1,
  },
  {
    delay_ms: 1300,
    category: 'controller',
    stage: 'hhem',
    label: 'HHEM factual consistency',
    detail: 'scoring response against retrieved sources...',
    status: 'PENDING',
  },
  {
    // Applied via updateEvent on the PENDING hhem event above
    delay_ms: 2147,
    isUpdate: true,
    category: 'controller',
    stage: 'hhem',
    label: 'HHEM factual consistency',
    detail: 'response grounded in sources',
    status: 'PASS',
    value: 0.88,
    threshold: 0.65,
    duration_ms: 847,
  },
  {
    delay_ms: 2447,
    category: 'sensor',
    stage: 'tool_auth',
    label: 'Tool: check_procedure_currency',
    detail: 'SOP-CS-001 updated 3 days ago — stale guidance risk',
    status: 'ALERT',
    duration_ms: 23,
  },
  {
    delay_ms: 2647,
    category: 'block',
    stage: 'tool_auth',
    label: 'Tool: queue_notification (severity-1)',
    detail: 'Operator role lacks send permission',
    status: 'BLOCKED',
    duration_ms: 4,
  },
  {
    delay_ms: 2847,
    category: 'controller',
    stage: 'hitl',
    label: 'Routed to supervisor approval queue',
    detail: 'Awaiting supervisor review',
    status: 'ROUTED',
    duration_ms: 6,
  },
  {
    delay_ms: 3047,
    category: 'feedback',
    stage: 'audit',
    label: 'Controller decision: SERVE + BLOCK + ROUTE',
    detail: '2 procedures retrieved. Notification blocked. Audit chained.',
    status: 'CHAINED',
    duration_ms: 12,
  },
];

// ─── Query 3: GHG / TIER reporting — REFUSE path (4 events) ──────────────────

export const REPLAY_QUERY_3_EVENTS: ReplayEvent[] = [
  {
    delay_ms: 0,
    category: 'controller',
    stage: 'rbac',
    label: 'RBAC authorization',
    detail: 'Operator authorized for query',
    status: 'PASS',
    duration_ms: 0,
  },
  {
    delay_ms: 200,
    category: 'plant',
    stage: 'retrieval',
    label: 'Retrieval: GHG emissions reporting',
    detail: '2 documents, top score 0.41',
    status: 'PASS',
    value: 0.41,
    threshold: 0.70,
    duration_ms: 198,
  },
  {
    delay_ms: 620,
    category: 'controller',
    stage: 'evidence',
    label: 'Evidence threshold',
    detail: 'combined score 0.41, threshold 0.70 — below setpoint',
    status: 'FAIL',
    value: 0.41,
    threshold: 0.70,
    duration_ms: 1,
  },
  {
    delay_ms: 820,
    category: 'feedback',
    stage: 'audit',
    label: 'Controller decision: REFUSE',
    detail: 'Evidence below threshold. Fail-closed.',
    status: 'CHAINED',
    duration_ms: 12,
  },
];

// ─── Query registry ───────────────────────────────────────────────────────────

export type ReplayQueryId = 'atmospheric_testing' | 'petroleum_collapse' | 'ghg_refuse';

export const REPLAY_QUERIES: Record<
  ReplayQueryId,
  { label: string; queryText: string; events: ReplayEvent[] }
> = {
  atmospheric_testing: {
    label: 'Q1: SERVE',
    queryText: 'What atmospheric testing is required before entering a confined space?',
    events: REPLAY_QUERY_1_EVENTS,
  },
  petroleum_collapse: {
    label: 'Q2: SERVE + BLOCK + ROUTE',
    queryText: 'Worker collapsed in a confined space at a petroleum facility',
    events: REPLAY_QUERY_2_EVENTS,
  },
  ghg_refuse: {
    label: 'Q3: REFUSE',
    queryText: 'What are the TIER reporting requirements for greenhouse gas emissions?',
    events: REPLAY_QUERY_3_EVENTS,
  },
};

// ─── Card content for ReplayCardPanel ────────────────────────────────────────

export type ReplayCard = {
  title: string;
  procedureId: string | null;
  citation: string | null;
  summary: string;
};

export const REPLAY_CARD_CONTENT: Record<
  ReplayQueryId,
  { outcome: string; cards: ReplayCard[] }
> = {
  atmospheric_testing: {
    outcome: 'SERVE',
    cards: [
      {
        title: 'Atmospheric Testing Requirements for Confined Space Entry',
        procedureId: 'OHS-CS-002',
        citation: 'OHS-CS-002 Confined Space Management, Section 4.1: Atmospheric Testing Protocol',
        summary:
          'Prior to confined space entry, conduct atmospheric testing in this order:\n' +
          '1. Oxygen content (acceptable range: 19.5–23.5%)\n' +
          '2. Combustible gases (must be below 10% LEL)\n' +
          '3. Toxic substances (H₂S < 1 ppm, CO < 35 ppm)\n\n' +
          'Test at all levels of the space (top, middle, bottom). Document all readings before entry and continuously during occupation. Rescind entry permit and evacuate immediately if any reading moves out of range.',
      },
    ],
  },
  petroleum_collapse: {
    outcome: 'SERVE + BLOCK + ROUTE',
    cards: [
      {
        title: 'Confined Space Emergency Response — Collapse Protocol',
        procedureId: 'OHS-CS-003',
        citation: 'OHS-CS-003 Confined Space Entry and Rescue, Section 7.2: Emergency Collapse Protocol',
        summary:
          '1. Sound alarm and call 911 immediately.\n' +
          '2. Do NOT enter the space without SCBA and rescue harness.\n' +
          '3. Assign a safety watch at the entry point.\n' +
          '4. Begin atmospheric monitoring of the space.\n' +
          '5. Await trained confined space rescue team — do not attempt unequipped retrieval.',
      },
      {
        title: 'Petroleum Facility Atmospheric Hazards — Additional Requirements',
        procedureId: 'OHS-PF-011',
        citation: 'OHS-PF-011 Petroleum Facility Safety, Section 3.4: Confined Space Incidents',
        summary:
          'At petroleum facilities, apply these additional controls:\n' +
          '• Monitor continuously for H₂S (alarm at 1 ppm, evacuation at 10 ppm)\n' +
          '• Enforce ignition source control within 10 m of entry point\n' +
          '• Notify area supervisor immediately — do not wait for rescue team arrival\n' +
          '• Isolation and depressurization of connected lines required before rescue entry\n\n' +
          'Note: severity-1 notification to supervisors was blocked (Operator role). Action routed to supervisor approval queue.',
      },
    ],
  },
  ghg_refuse: {
    outcome: 'REFUSE',
    cards: [
      {
        title: 'Outside Governed Knowledge Base',
        procedureId: null,
        citation: null,
        summary:
          'The system could not find a matching procedure for TIER greenhouse gas emissions reporting.\n\n' +
          'Retrieval confidence: 0.41\n' +
          'Evidence threshold: 0.70\n\n' +
          'The evidence score is below the configured setpoint. The system refuses to answer rather than speculate from weak evidence. This is the correct and expected behaviour — fail-closed.\n\n' +
          'For TIER reporting requirements, consult your environmental compliance team or the TIER reporting documentation directly.',
      },
    ],
  },
};
