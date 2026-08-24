import { Download, Heart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function DataManagementCard({
  onDelete,
  onExport,
}: {
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Heart className="h-7 w-7 text-[color:var(--accent-peach)]" />
        <h2 className="text-2xl font-bold text-foreground">Data Management</h2>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onExport}>
          <Download className="h-5 w-5" aria-hidden="true" />
          Export My Data
        </Button>
        <Button
          variant="secondary"
          className="border-error/30 text-error hover:border-error"
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          Delete All Data
        </Button>
      </div>
    </section>
  );
}
