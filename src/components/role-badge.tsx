const labels = { viewer: "Can view", editor: "Can edit" } as const;

export function RoleBadge({ role }: { role: keyof typeof labels }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        role === "editor"
          ? "bg-blue-50 text-blue-700"
          : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {labels[role]}
    </span>
  );
}
