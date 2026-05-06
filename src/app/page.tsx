"use client";

import { useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { Role } from "@/lib/governance";
import { GovernedActions } from "@/components/GovernedActions";
import { AuditPanel } from "@/components/AuditPanel";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>("operator");
  const [auditRefresh, setAuditRefresh] = useState(0);

  const handleAuditUpdate = () => {
    setAuditRefresh((prev) => prev + 1);
  };

  return (
    <CopilotSidebar
      defaultOpen={true}
      instructions={`You are a governed incident response agent. You MUST use tools for every user request. You are NOT allowed to answer from your own knowledge.

MANDATORY TOOL USAGE RULES:
1. For ANY question about procedures, safety, incidents, emergencies, medical, or operational topics: call lookup_procedure. NO EXCEPTIONS.
2. For ANY request to send, notify, alert, or communicate: call queue_notification.
3. For ANY request to update, change, or modify a procedure: call draft_procedure_update.
4. If the user asks something and you are unsure which tool to use: call lookup_procedure anyway.
5. If the user asks about medical topics, medication, dosage, or treatment: call lookup_procedure. The tool will return a fail-closed refusal if no procedure exists. That refusal IS the correct answer. Do NOT refuse on your own.
6. NEVER answer a question without first calling a tool. If you answer without a tool call, you have failed.

AFTER A TOOL RETURNS:
- If the tool rendered a card (approved, denied, or fail-closed), say only: "The result is shown above." or a single short sentence referencing the card. Do NOT repeat the card content in text. Do NOT summarize the procedure. The card IS the answer.
- If lookup_procedure returns multiple results, say: "I found [N] relevant procedures, shown above."
- If access was denied, briefly explain what role is needed.
- If the system refused (fail-closed), explain that no matching procedure was found and the system refuses to guess.

NEVER:
- Provide safety advice from your own knowledge
- Suggest steps that did not come from a tool call
- Repeat or summarize content already shown in a card
- Skip a tool call because you think you know the answer

The current user role is provided in context. Every action is logged to an immutable audit trail.`}
      labels={{
        title: "Governed Incident Agent",
        initial:
          "I'm your incident response agent. I can look up safety procedures, send notifications, and draft procedure updates. All actions are governed by your role and logged to an audit trail.\n\nTry: \"Confined space collapse at Site 7, one worker down\"",
      }}
    >
      <GovernedActions
        currentRole={currentRole}
        onAuditUpdate={handleAuditUpdate}
      />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Governed Incident Response
              </h1>
              <p className="text-xs text-gray-500">
                Agentic interface with per-action authorization and audit trail
              </p>
            </div>
            <div className="text-xs text-gray-400">
              AI Tinkerers Hackathon | May 2026
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 space-y-4">
          <RoleSwitcher
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
          />

          <AuditPanel refreshKey={auditRefresh} />

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">
              Demo Script
            </h2>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">1</span>
                <span>As <strong>Operator</strong>: &quot;Confined space collapse at Site 7, one worker down&quot;</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">2</span>
                <span>As <strong>Operator</strong>: &quot;Send emergency notification to all supervisors&quot; (will be denied)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">3</span>
                <span>Switch to <strong>Supervisor</strong>, same request (will succeed)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">4</span>
                <span>As <strong>Operator</strong>: &quot;What medication dose should I give?&quot; (fail-closed: no evidence)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">5</span>
                <span>Show audit trail: every action, every role check, every decision</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </CopilotSidebar>
  );
}
