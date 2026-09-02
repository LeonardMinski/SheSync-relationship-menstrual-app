import { Download, Heart } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function DataManagementCard({ onExport }: { onExport: () => void }) {
  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Heart className="h-7 w-7 text-[color:var(--accent-peach)]" />
        <h2 className="text-2xl font-bold text-foreground">Data Management</h2>
      </div>

      <div className="mt-6">
        <Button variant="secondary" onClick={onExport}>
          <Download className="h-5 w-5" aria-hidden="true" />
          Export My Data
        </Button>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Account and data deletion isn&apos;t available yet. If you need your
        account removed, contact support.
      </p>
    </section>
  );
}
