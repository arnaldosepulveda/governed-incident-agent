"use client";

import { useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { Role } from "@/lib/governance";
import { GovernedActions } from "@/components/GovernedActions";
import { AuditPanel } from "@/components/AuditPanel";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ControlFeedback } from "@/components/ControlFeedback";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>("operator");
  const [auditRefresh, setAuditRefresh] = useState(0);

  const handleAuditUpdate = () => {
    setAuditRefresh((prev) => prev + 1);
  };

  return (
    <>
      <GovernedActions
        currentRole={currentRole}
        onAuditUpdate={handleAuditUpdate}
      />
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                KEYSTONE AI — GOVERNED INCIDENT RESPONSE DEMO
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <RoleSwitcher
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
              />
              <div className="text-xs text-gray-400">
                AI Tinkerers Hackathon | May 2026
              </div>
            </div>
          </div>
        </header>

        {/* Main: 60/40 split */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left column: Chat (60%) */}
          <div className="w-full md:w-3/5 flex flex-col border-r border-gray-200 min-h-0">
            <CopilotChat
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
                  "I'm your incident response agent. I can look up safety procedures, send notifications, and draft procedure updates. All actions are governed by your role and logged to an audit trail.\n\nTry: \"What atmospheric testing is required before entering a confined space?\"",
              }}
              className="flex-1 min-h-0"
            />
          </div>

          {/* Right column: Control Feedback (40%) */}
          <div className="w-full md:w-2/5 flex flex-col min-h-0">
            <ControlFeedback />
          </div>
        </div>

        {/* Bottom: Demo Script only, Audit collapsed */}
        <div className="shrink-0 border-t border-gray-200 bg-white">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-3 border-r border-gray-200">
              <details className="text-xs">
                <summary className="font-semibold text-gray-900 text-xs cursor-pointer select-none">
                  Audit Trail (click to expand)
                </summary>
                <div className="mt-2">
                  <AuditPanel refreshKey={auditRefresh} />
                </div>
              </details>
            </div>
            <div className="w-full md:w-80 p-3">
              <h2 className="font-semibold text-gray-900 text-xs mb-2">Demo Script</h2>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex gap-2">
                  <span className="font-mono bg-green-50 text-green-700 px-1.5 rounded">1</span>
                  <span>&quot;What atmospheric testing is required before entering a confined space?&quot;</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono bg-blue-50 text-blue-700 px-1.5 rounded">2</span>
                  <span>&quot;Worker collapsed in a confined space at a petroleum facility&quot;</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono bg-amber-50 text-amber-700 px-1.5 rounded">3</span>
                  <span>&quot;What are the TIER reporting requirements for greenhouse gas emissions?&quot;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
