import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function DeleteDataDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-bg-surface p-6 shadow-lg">
        <div className="text-center">
          <Trash2 className="mx-auto mb-4 h-14 w-14 text-error" />
          <h3 className="mb-2 text-2xl font-bold text-foreground">
            Delete All Data?
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            This action cannot be undone. All cycle data, entries, and local
            settings will be permanently deleted.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="border-error bg-error/10 text-error hover:border-error"
              onClick={onConfirm}
            >
              Delete Everything
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
