"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Lock, MessageCircleHeart, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { InlineBanner } from "@/components/ui/InlineBanner";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusPill } from "@/components/ui/StatusPill";

// TODO(V1-VAULT): wire to a real Vault persistence + sharing model (current fantasy schema is drifted, see docs/ROADMAP.md)

interface VaultEntryDraft {
  title: string;
  content: string;
  tags: string[];
}

type ViewState = "form" | "detail";

const EMPTY_DRAFT: VaultEntryDraft = { title: "", content: "", tags: [] };

export default function NewVaultEntryPage() {
  const [view, setView] = useState<ViewState>("form");
  const [draft, setDraft] = useState<VaultEntryDraft>(EMPTY_DRAFT);
  const [tagInput, setTagInput] = useState("");
  const [savedEntry, setSavedEntry] = useState<VaultEntryDraft | null>(null);

  const [teaseOpen, setTeaseOpen] = useState(false);
  const [teaseText, setTeaseText] = useState("");
  const [teaseSent, setTeaseSent] = useState(false);

  const [revealOpen, setRevealOpen] = useState(false);
  const [revealConfirmed, setRevealConfirmed] = useState(false);

  const canSave = draft.title.trim().length > 0 && draft.content.trim().length > 0;

  function addTagsFromInput() {
    const newTags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && !draft.tags.includes(tag));

    if (newTags.length > 0) {
      setDraft((current) => ({ ...current, tags: [...current.tags, ...newTags] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setDraft((current) => ({ ...current, tags: current.tags.filter((t) => t !== tag) }));
  }

  function handleSave() {
    if (!canSave) return;
    // No backend call here on purpose — see TODO above. This only moves the
    // entered content into local component state so the detail/tease/reveal
    // preview below has something real to act on for this session.
    setSavedEntry(draft);
    setView("detail");
  }

  function startNewEntry() {
    setDraft(EMPTY_DRAFT);
    setTagInput("");
    setSavedEntry(null);
    setTeaseOpen(false);
    setTeaseText("");
    setTeaseSent(false);
    setRevealOpen(false);
    setRevealConfirmed(false);
    setView("form");
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/vault"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Vault
      </Link>

      {view === "form" && (
        <>
          <SectionHeading
            title="New Vault entry"
            description="Write a thought, desire, or fantasy for yourself. It's private by default — sharing is always a separate, later step."
          />

          <Card>
            <CardContent className="space-y-4 pt-4">
              <Input
                label="Title or theme"
                placeholder="Give this entry a name"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />

              <Textarea
                label="Describe your desire or fantasy"
                placeholder="Write freely — this stays just yours unless you choose to share it."
                rows={8}
                value={draft.content}
                onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              />

              <div className="space-y-2">
                <label htmlFor="vault-tag-input" className="block text-sm font-medium text-foreground">
                  Tags (optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="vault-tag-input"
                    placeholder="e.g. slow-burn, roleplay"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTagsFromInput();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={addTagsFromInput}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Separate multiple tags with commas.</p>
                {draft.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {draft.tags.map((tag) => (
                      <li key={tag}>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                        >
                          {tag}
                          <X className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Remove tag {tag}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button variant="cta" size="lg" disabled={!canSave} onClick={handleSave} className="w-full sm:w-auto">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Save privately
            </Button>

            <FeaturePlaceholder
              title="This is a design preview"
              description="Entries aren't saved to your account yet — nothing here is written to a server, and it won't be there if you reload or come back later."
            />
          </div>
        </>
      )}

      {view === "detail" && savedEntry && (
        <>
          {teaseSent === false && revealConfirmed === false && (
            <InlineBanner tone="success">Saved privately.</InlineBanner>
          )}

          <SectionHeading
            title={savedEntry.title}
            actions={
              <StatusPill tone="muted">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Private
              </StatusPill>
            }
          />

          <Card>
            <CardContent className="space-y-4 pt-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{savedEntry.content}</p>
              {savedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {savedEntry.tags.map((tag) => (
                    <StatusPill key={tag} tone="sage">
                      {tag}
                    </StatusPill>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <FeaturePlaceholder
            title="This is a design preview"
            description="This entry only exists in this browser tab right now — it isn't saved to your account and won't be here after you reload."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircleHeart className="h-5 w-5 text-[color:var(--accent-rose)]" aria-hidden="true" />
                  Share a tease
                </CardTitle>
                <CardDescription>Send a short teaser about this entry without revealing everything.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setTeaseOpen(true)}>
                  Share a tease
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-[color:var(--accent-rose)]" aria-hidden="true" />
                  Reveal fully
                </CardTitle>
                <CardDescription>Share the complete entry with your partner.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setRevealOpen(true)}>
                  Reveal fully
                </Button>
              </CardContent>
            </Card>
          </div>

          <Button variant="ghost" onClick={startNewEntry}>
            Write another entry
          </Button>
        </>
      )}

      {teaseOpen && (
        <Modal
          title="Share a tease"
          onClose={() => {
            setTeaseOpen(false);
          }}
        >
          <div className="space-y-4">
            {teaseSent ? (
              <InlineBanner tone="success">Tease saved for this preview.</InlineBanner>
            ) : (
              <Textarea
                label="Teaser text"
                placeholder="A short hint about this entry — not the full thing."
                rows={3}
                value={teaseText}
                onChange={(event) => setTeaseText(event.target.value)}
              />
            )}

            <FeaturePlaceholder
              title="Not wired to partner sharing yet"
              description="This is a design preview of the tease flow. It doesn't send anything to a partner — there's no real partner-sharing pipeline connected here yet."
            />

            <div className="flex flex-wrap gap-3">
              {!teaseSent && (
                <Button variant="cta" disabled={!teaseText.trim()} onClick={() => setTeaseSent(true)}>
                  Confirm tease
                </Button>
              )}
              <Button variant="secondary" onClick={() => setTeaseOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {revealOpen && (
        <Modal
          title="Reveal fully"
          onClose={() => {
            setRevealOpen(false);
          }}
        >
          <div className="space-y-4">
            {revealConfirmed ? (
              <InlineBanner tone="success">Marked as revealed for this preview.</InlineBanner>
            ) : (
              <p className="text-sm text-foreground">
                This would share the complete entry with your partner. Are you sure you want to reveal it fully?
              </p>
            )}

            <FeaturePlaceholder
              title="This is a design preview of the reveal flow"
              description="It doesn't share anything with a partner yet — there's no real partner-sharing pipeline connected here yet, and no one is notified."
            />

            <div className="flex flex-wrap gap-3">
              {!revealConfirmed && (
                <Button variant="cta" onClick={() => setRevealConfirmed(true)}>
                  Yes, reveal fully
                </Button>
              )}
              <Button variant="secondary" onClick={() => setRevealOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
