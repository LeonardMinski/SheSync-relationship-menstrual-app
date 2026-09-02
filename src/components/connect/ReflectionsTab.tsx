import { MessagesSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";

export function ReflectionsTab() {
  return (
    <EmptyState
      icon={MessagesSquare}
      title="No shared reflections yet"
      description="When you and a connected partner respond to the same card or check in on a boundary, your conversation will show up here. This area isn't wired to a real backend yet, so it will always start empty."
    />
  );
}
