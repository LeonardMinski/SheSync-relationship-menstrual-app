"use client";

import { useEffect, useId, useRef } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  describedBy?: string;
  /** Defaults to "max-w-md" — pass a wider class for multi-column dialogs. */
  maxWidthClassName?: string;
  /** Defaults to "bg-black/80" — pass a different class to override the backdrop. */
  overlayClassName?: string;
  /** Defaults to the standard card border/background/shadow — override for a
   *  different look (e.g. a lighter shadow against a white overlay). */
  contentClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  onClose,
  children,
  describedBy,
  maxWidthClassName = "max-w-md",
  overlayClassName = "bg-black/80",
  contentClassName = "border border-border-subtle bg-bg-surface shadow-2xl shadow-black/60",
}: ModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement;

    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !container) return;

      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur ${overlayClassName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={`max-h-[90vh] w-full ${maxWidthClassName} overflow-y-auto rounded-[2rem] p-6 ${contentClassName}`}
      >
        <h2 id={titleId} className="mb-4 text-xl font-bold text-foreground">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
