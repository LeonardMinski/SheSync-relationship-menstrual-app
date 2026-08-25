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
    <section className="ss-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Heart
          className="h-7 w-7 text-[color:var(--design-peach)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          Data Management
        </h2>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          variant="secondary"
          className="rounded-full border-[color:var(--design-border)] bg-white text-[color:var(--design-ink)]"
          onClick={onExport}
        >
          <Download className="h-5 w-5" aria-hidden="true" />
          Export My Data
        </Button>
        <Button
          variant="secondary"
          className="rounded-full border-error/30 bg-white text-error hover:border-error"
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          Delete All Data
        </Button>
      </div>
    </section>
  );
}
