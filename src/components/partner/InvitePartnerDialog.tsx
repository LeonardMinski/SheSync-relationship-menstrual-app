"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function InvitePartnerDialog({
  onCancel,
  onSend,
}: {
  onCancel: () => void;
  onSend: (email: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter your partner's email address.");
      return;
    }

    setSending(true);
    setError(null);

    const success = await onSend(email.trim());

    setSending(false);

    if (!success) {
      setError("We couldn't send that invitation. Check the email and try again.");
    }
  };

  return (
    <Modal title="Invite your partner" onClose={onCancel}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground">
          They&apos;ll need a SheSync+ account with this email. Once they
          accept, you choose exactly what to share.
        </p>

        <Input
          label="Partner's email"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={error ?? undefined}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="partner@example.com"
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="cta"
            loading={sending}
            className="flex-1"
          >
            {sending ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
