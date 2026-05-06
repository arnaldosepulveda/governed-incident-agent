"use client";

import { Role, ROLE_LABELS } from "@/lib/governance";

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const ROLES: Role[] = ["operator", "supervisor", "admin"];

const ROLE_COLORS: Record<Role, string> = {
  operator: "bg-blue-100 text-blue-800 border-blue-300",
  supervisor: "bg-amber-100 text-amber-800 border-amber-300",
  admin: "bg-purple-100 text-purple-800 border-purple-300",
};

const ROLE_ACTIVE: Record<Role, string> = {
  operator: "bg-blue-600 text-white border-blue-700",
  supervisor: "bg-amber-600 text-white border-amber-700",
  admin: "bg-purple-600 text-white border-purple-700",
};


export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex gap-2">
      {ROLES.map((role) => (
        <button
          key={role}
          onClick={() => onRoleChange(role)}
          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
            currentRole === role
              ? ROLE_ACTIVE[role]
              : ROLE_COLORS[role] + " hover:opacity-80"
          }`}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}
