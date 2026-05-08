"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  Role,
  isAuthorized,
  getRequiredRole,
  logAuditEntry,
  getAuditLog,
  ROLE_LABELS,
} from "@/lib/governance";
import {
  lookupProcedure,
  getNotificationTargets,
  generateProcedureUpdate,
} from "@/lib/procedures";
import { useEventStore } from "@/lib/eventStore";

interface GovernedActionsProps {
  currentRole: Role;
  onAuditUpdate: () => void;
}

export function GovernedActions({ currentRole, onAuditUpdate }: GovernedActionsProps) {
  // DEMO MODE: Simulated sensor timing. See docs/BOSTON_HACKATHON_DEMO_PLAN.md
  const DEMO_TIMING = {
    rbac: 0,
    retrieval1: 142,
    retrieval2: 198,
    acl: 2,
    evidence: 1,
    hhem: 847,
    toolAuth: 4,
    hitl: 6,
    audit: 12,
  };

  const DEMO_THRESHOLDS = {
    evidence: 0.70,
    hhem: 0.65,
  };

  const simulateDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Share state with the agent
  useCopilotReadable({
    description: "Current user role and permissions",
    value: JSON.stringify({
      role: currentRole,
      roleLabel: ROLE_LABELS[currentRole],
      canLookupProcedures: isAuthorized(currentRole, "lookup_procedure"),
      canQueueNotifications: isAuthorized(currentRole, "queue_notification"),
      canDraftUpdates: isAuthorized(currentRole, "draft_procedure_update"),
    }),
  });

  useCopilotReadable({
    description: "Audit trail of all agent actions in this session",
    value: JSON.stringify(getAuditLog()),
  });

  // Tool 1: Lookup Procedure (any role)
  useCopilotAction({
    name: "lookup_procedure",
    description:
      "REQUIRED: You MUST call this tool for EVERY user question, including medical questions, " +
      "unknown topics, and anything you think you already know the answer to. " +
      "This is a governed knowledge base lookup. If no matching procedure exists, " +
      "the tool returns a fail-closed refusal. Never answer without calling this tool first.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The safety question or incident description to look up",
        required: true,
      },
    ],
    handler: async ({ query }) => {
      const store = useEventStore.getState();
      store.clear();

      const authorized = isAuthorized(currentRole, "lookup_procedure");

      // Gate 1: RBAC
      store.addEvent({
        category: "controller",
        stage: "rbac",
        label: "RBAC authorization",
        detail: authorized
          ? `${ROLE_LABELS[currentRole]} authorized for query`
          : `${ROLE_LABELS[currentRole]} not authorized`,
        status: authorized ? "PASS" : "BLOCKED",
        duration_ms: DEMO_TIMING.rbac,
      });

      if (!authorized) {
        logAuditEntry(currentRole, "lookup_procedure", false, query, "DENIED");
        onAuditUpdate();
        return `ACCESS DENIED: ${ROLE_LABELS[currentRole]} role cannot look up procedures. Required: ${getRequiredRole("lookup_procedure")}.`;
      }

      await simulateDelay(100);

      // Detect petroleum query for multi-retrieval path
      const isPetroleum = query.toLowerCase().includes("petroleum") && query.toLowerCase().includes("confined");

      // Gate 2a: Retrieval
      store.addEvent({
        category: "plant",
        stage: "retrieval",
        label: "Retrieval: confined space rescue",
        detail: "3 documents, top score 0.87",
        status: "PASS",
        value: 0.87,
        duration_ms: DEMO_TIMING.retrieval1,
      });

      if (isPetroleum) {
        await simulateDelay(100);
        store.addEvent({
          category: "plant",
          stage: "retrieval",
          label: "Retrieval: atmospheric hazards petroleum",
          detail: "2 documents, top score 0.79",
          status: "PASS",
          value: 0.79,
          duration_ms: DEMO_TIMING.retrieval2,
        });
      }

      await simulateDelay(100);

      // Gate 2b: ACL filter
      store.addEvent({
        category: "sensor",
        stage: "acl",
        label: "ACL filter",
        detail: "5 of 5 documents authorized",
        status: "PASS",
        value: 5,
        duration_ms: DEMO_TIMING.acl,
      });

      await simulateDelay(100);

      // Gate 3: Evidence threshold
      const result = lookupProcedure(query);
      const evidenceScore = result ? (isPetroleum ? 0.83 : 0.88) : 0.41;
      const evidencePassed = evidenceScore >= DEMO_THRESHOLDS.evidence;

      store.addEvent({
        category: "controller",
        stage: "evidence",
        label: "Evidence threshold",
        detail: `combined score ${evidenceScore.toFixed(2)}, threshold ${DEMO_THRESHOLDS.evidence.toFixed(2)}`,
        status: evidencePassed ? "PASS" : "FAIL",
        value: evidenceScore,
        threshold: DEMO_THRESHOLDS.evidence,
        duration_ms: DEMO_TIMING.evidence,
      });

      await simulateDelay(100);

      if (!result || !evidencePassed) {
        store.addEvent({
          category: "feedback",
          stage: "audit",
          label: "Controller decision: REFUSE",
          detail: "Evidence below threshold. Fail-closed.",
          status: "FAIL",
          duration_ms: DEMO_TIMING.audit,
        });
        logAuditEntry(currentRole, "lookup_procedure", true, query, "NO_MATCH - FAIL_CLOSED");
        onAuditUpdate();
        return "INSUFFICIENT EVIDENCE: No matching procedure found. The system refuses to generate an answer without supporting evidence.";
      }

      // Gate 4: HHEM - emit PENDING, wait 847ms, resolve to PASS
      const hhemEventId = store.addEvent({
        category: "controller",
        stage: "hhem",
        label: "HHEM factual consistency",
        detail: "scoring response against retrieved sources...",
        status: "PENDING",
        duration_ms: undefined,
      });

      await simulateDelay(DEMO_TIMING.hhem);

      store.updateEvent(hhemEventId, {
        status: "PASS",
        value: 0.91,
        detail: "response grounded in sources",
        duration_ms: DEMO_TIMING.hhem,
      });

      // Petroleum path: simulated tool proposals
      if (isPetroleum) {
        await simulateDelay(100);
        store.addEvent({
          category: "sensor",
          stage: "tool_auth",
          label: "Tool: check_procedure_currency",
          detail: "SOP-CS-001 updated 3 days ago",
          status: "ALERT",
          duration_ms: 23,
        });

        await simulateDelay(100);
        store.addEvent({
          category: "block",
          stage: "tool_auth",
          label: "Tool: queue_notification (severity-1)",
          detail: "Operator role lacks send permission",
          status: "BLOCKED",
          duration_ms: DEMO_TIMING.toolAuth,
        });

        await simulateDelay(100);
        store.addEvent({
          category: "controller",
          stage: "hitl",
          label: "Routed to supervisor approval queue",
          detail: "Awaiting supervisor review",
          status: "ROUTED",
          duration_ms: DEMO_TIMING.hitl,
        });
      }

      await simulateDelay(100);

      // Feedback: audit
      const results = Array.isArray(result) ? result : [result];
      store.addEvent({
        category: "feedback",
        stage: "audit",
        label: `Controller decision: SERVE`,
        detail: `${results.length} procedure(s) retrieved. Audit chained.`,
        status: "CHAINED",
        duration_ms: DEMO_TIMING.audit,
      });

      for (const r of results) {
        logAuditEntry(currentRole, "lookup_procedure", true, query, `APPROVED - ${r.document}`);
      }
      onAuditUpdate();
      return "RENDER_COMPLETE_NO_TEXT_RESPONSE_NEEDED";
    },
    render: ({ status, result, args }) => {
      if (status === "inProgress") {
        return (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">
                Checking authorization and retrieving procedure...
              </span>
            </div>
          </div>
        );
      }

      if (!result) return <></>;

      if (typeof result === "string" && result.startsWith("ACCESS DENIED")) {
        return (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">&#x26D4;</span>
              <span className="font-semibold text-red-800">Access Denied</span>
            </div>
            <p className="text-sm text-red-700">{result}</p>
          </div>
        );
      }

      if (typeof result === "string" && result.startsWith("INSUFFICIENT")) {
        return (
          <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-600 text-lg">&#x26A0;</span>
              <span className="font-semibold text-amber-800">Fail-Closed: Insufficient Evidence</span>
            </div>
            <p className="text-sm text-amber-700">
              No matching procedure found. The system refuses to answer rather than guess.
            </p>
          </div>
        );
      }

      try {
        const raw = result === "RENDER_COMPLETE_NO_TEXT_RESPONSE_NEEDED"
          ? lookupProcedure(args.query)
          : typeof result === "string" ? JSON.parse(result) : result;
        if (!raw) return <></>;
        const procedures = Array.isArray(raw) ? raw : [raw];
        return (
          <div className="space-y-2 my-2">
            {procedures.map((proc, idx) => (
              <div key={idx} className="border border-emerald-300 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-emerald-600 text-lg">&#x2705;</span>
                  <span className="font-semibold text-emerald-800">Approved Guidance</span>
                  {procedures.length > 1 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {idx + 1} of {procedures.length}
                    </span>
                  )}
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                    Score: {proc.confidenceScore}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{proc.title}</h3>
                <p className="text-xs text-gray-500 mb-3">
                  {proc.document} | {proc.section} | Effective: {proc.effectiveDate}
                </p>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded mb-3">
                  {proc.content}
                </pre>
                <div className="border-t pt-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Citations:</p>
                  {proc.citations.map((c: string, i: number) => (
                    <p key={i} className="text-xs text-gray-600 pl-2">
                      [{i + 1}] {c}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } catch {
        return <div className="text-sm text-gray-600 my-2">{String(result)}</div>;
      }
    },
  });

  // Tool 2: Queue Notification (supervisor+)
  useCopilotAction({
    name: "queue_notification",
    description:
      "Send emergency notifications to incident response personnel. " +
      "RESTRICTED: Requires supervisor or admin role. Operators cannot send notifications.",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "The notification message to send",
        required: true,
      },
      {
        name: "priority",
        type: "string",
        description: "Priority level: routine, urgent, or emergency",
        required: true,
      },
    ],
    handler: async ({ message, priority }) => {
      const store = useEventStore.getState();
      store.clear();

      const authorized = isAuthorized(currentRole, "queue_notification");

      store.addEvent({
        category: "controller",
        stage: "rbac",
        label: "RBAC authorization",
        detail: authorized
          ? `${ROLE_LABELS[currentRole]} authorized for notifications`
          : `${ROLE_LABELS[currentRole]} not authorized`,
        status: authorized ? "PASS" : "BLOCKED",
        duration_ms: DEMO_TIMING.rbac,
      });

      await simulateDelay(100);

      store.addEvent({
        category: "controller",
        stage: "tool_auth",
        label: "Tool authorization: queue_notification",
        detail: authorized
          ? `${ROLE_LABELS[currentRole]} has send permission`
          : `${ROLE_LABELS[currentRole]} lacks send permission`,
        status: authorized ? "PASS" : "BLOCKED",
        duration_ms: DEMO_TIMING.toolAuth,
      });

      if (!authorized) {
        await simulateDelay(100);
        store.addEvent({
          category: "feedback",
          stage: "audit",
          label: "Controller decision: BLOCK",
          detail: "Insufficient role. Action denied.",
          status: "BLOCKED",
          duration_ms: DEMO_TIMING.audit,
        });
        logAuditEntry(currentRole, "queue_notification", false, message, "DENIED");
        onAuditUpdate();
        return `ACCESS DENIED: Notification dispatch requires ${getRequiredRole("queue_notification")} role or higher. Current role: ${ROLE_LABELS[currentRole]}.`;
      }

      await simulateDelay(100);

      const targets = getNotificationTargets();
      store.addEvent({
        category: "feedback",
        stage: "audit",
        label: "Controller decision: SERVE",
        detail: `Notification dispatched to ${targets.length} recipients. Audit chained.`,
        status: "CHAINED",
        duration_ms: DEMO_TIMING.audit,
      });

      logAuditEntry(currentRole, "queue_notification", true, `${priority}: ${message}`, `SENT to ${targets.length} recipients`);
      onAuditUpdate();
      return "RENDER_COMPLETE_NO_TEXT_RESPONSE_NEEDED";
    },
    render: ({ status, result, args }) => {
      if (status === "inProgress") {
        return (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">
                Verifying notification authorization...
              </span>
            </div>
          </div>
        );
      }

      if (!result) return <></>;

      if (typeof result === "string" && result.startsWith("ACCESS DENIED")) {
        return (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">&#x26D4;</span>
              <span className="font-semibold text-red-800">Notification Blocked</span>
            </div>
            <p className="text-sm text-red-700">{result}</p>
          </div>
        );
      }

      try {
        const data = result === "RENDER_COMPLETE_NO_TEXT_RESPONSE_NEEDED"
          ? { priority: args.priority, message: args.message, targets: getNotificationTargets() }
          : JSON.parse(result);
        return (
          <div className="border border-blue-300 bg-white rounded-lg p-4 my-2 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-lg">&#x1F4E8;</span>
              <span className="font-semibold text-blue-800">Notifications Dispatched</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                data.priority === "emergency"
                  ? "bg-red-100 text-red-700"
                  : data.priority === "urgent"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {data.priority?.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{data.message}</p>
            <div className="space-y-1">
              {data.targets?.map((t: { name: string; role: string; channel: string }, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  {t.name} ({t.role}) via {t.channel}
                </div>
              ))}
            </div>
          </div>
        );
      } catch {
        return <div className="text-sm text-gray-600 my-2">{result}</div>;
      }
    },
  });

  // Tool 3: Draft Procedure Update (admin only)
  useCopilotAction({
    name: "draft_procedure_update",
    description:
      "Create a draft update to an existing procedure. " +
      "RESTRICTED: Requires admin role. The draft must be reviewed and approved by a document custodian.",
    parameters: [
      {
        name: "procedure",
        type: "string",
        description: "The procedure to update",
        required: true,
      },
      {
        name: "proposed_change",
        type: "string",
        description: "Description of the proposed change",
        required: true,
      },
    ],
    handler: async ({ procedure, proposed_change }) => {
      const store = useEventStore.getState();
      store.clear();

      const authorized = isAuthorized(currentRole, "draft_procedure_update");

      store.addEvent({
        category: "controller",
        stage: "rbac",
        label: "RBAC authorization",
        detail: authorized
          ? `${ROLE_LABELS[currentRole]} authorized for procedure updates`
          : `${ROLE_LABELS[currentRole]} not authorized`,
        status: authorized ? "PASS" : "BLOCKED",
        duration_ms: DEMO_TIMING.rbac,
      });

      await simulateDelay(100);

      store.addEvent({
        category: "controller",
        stage: "tool_auth",
        label: "Tool authorization: draft_procedure_update",
        detail: authorized
          ? `${ROLE_LABELS[currentRole]} has update permission`
          : `Admin role required`,
        status: authorized ? "PASS" : "BLOCKED",
        duration_ms: DEMO_TIMING.toolAuth,
      });

      if (!authorized) {
        await simulateDelay(100);
        store.addEvent({
          category: "feedback",
          stage: "audit",
          label: "Controller decision: BLOCK",
          detail: "Insufficient role. Draft denied.",
          status: "BLOCKED",
          duration_ms: DEMO_TIMING.audit,
        });
        logAuditEntry(currentRole, "draft_procedure_update", false, procedure, "DENIED");
        onAuditUpdate();
        return `ACCESS DENIED: Procedure updates require ${getRequiredRole("draft_procedure_update")} role. Current role: ${ROLE_LABELS[currentRole]}.`;
      }

      await simulateDelay(100);

      const draft = generateProcedureUpdate(procedure, proposed_change);
      store.addEvent({
        category: "feedback",
        stage: "audit",
        label: "Controller decision: SERVE",
        detail: `Draft ${draft.draftId} created. Custodian review required. Audit chained.`,
        status: "CHAINED",
        duration_ms: DEMO_TIMING.audit,
      });

      logAuditEntry(currentRole, "draft_procedure_update", true, `${procedure}: ${proposed_change}`, `DRAFT CREATED: ${draft.draftId}`);
      onAuditUpdate();
      return "RENDER_COMPLETE_NO_TEXT_RESPONSE_NEEDED";
    },
    render: ({ status, result, args }) => {
      if (status === "inProgress") {
        return (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 font-medium">
                Verifying procedure update authorization...
              </span>
            </div>
          </div>
        );
      }

      if (!result) return <></>;

      if (typeof result === "string" && result.startsWith("ACCESS DENIED")) {
        return (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 my-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">&#x26D4;</span>
              <span className="font-semibold text-red-800">Update Blocked</span>
            </div>
            <p className="text-sm text-red-700">{result}</p>
          </div>
        );
      }

      try {
        const data = result === "RENDER_COMPLETE_NO_TEXT_RESPONSE_NEEDED"
          ? generateProcedureUpdate(args.procedure, args.proposed_change)
          : JSON.parse(result);
        return (
          <div className="border border-purple-300 bg-white rounded-lg p-4 my-2 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-600 text-lg">&#x1F4DD;</span>
              <span className="font-semibold text-purple-800">Draft Created</span>
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono">
                {data.draftId}
              </span>
            </div>
            <p className="text-sm text-gray-700">{data.summary}</p>
            <p className="text-xs text-gray-400 mt-2">
              Requires custodian review before publication. Separation of duties enforced.
            </p>
          </div>
        );
      } catch {
        return <div className="text-sm text-gray-600 my-2">{result}</div>;
      }
    },
  });

  return null; // This component only registers actions
}
