/**
 * Fantasy Vault
 *
 * Parked Phase 3 feature.
 *
 * Current responsibilities:
 * - Create and edit fantasy entries
 * - Filter entries by privacy and type
 * - Control partner sharing state
 *
 * Future:
 * - Move persistence to Supabase service layer
 * - Add RLS-backed sharing
 * - Add real moodboard/audio uploads
 * - Replace local modal with Radix/shadcn Dialog
 */

"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Music,
  Pencil,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import Navigation from "@/components/layout/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useApp } from "@/context/AppContext";
import type { FantasyEntry } from "@/types";
import { cn } from "@/utils/cn";

type PrivacyFilter = "all" | "private" | "shared";

type FantasyEntryType = "text" | "moodboard" | "audio";

type FantasyFormState = {
  title: string;
  content: string;
  type: FantasyEntryType;
  tags: string[];
  isSharedWithPartner: boolean;
  mood: number;
};

const EMPTY_FORM: FantasyFormState = {
  title: "",
  content: "",
  type: "text",
  tags: [],
  isSharedWithPartner: false,
  mood: 5,
};

const privacyFilters: PrivacyFilter[] = ["all", "private", "shared"];

const typeFilters: Array<"all" | FantasyEntryType> = [
  "all",
  "text",
  "moodboard",
  "audio",
];

const entryTypes: FantasyEntryType[] = ["text", "moodboard", "audio"];

const suggestedTags = [
  "romantic",
  "adventure",
  "spa day",
  "travel",
  "intimate",
  "playful",
  "relaxing",
  "exciting",
  "dreamy",
  "passionate",
  "cozy",
  "spontaneous",
];

export default function FantasyVault() {
  const { state, addFantasyEntry, updateFantasyEntry } = useApp();

  const { fantasyEntries, currentPhase, isLoading } = state;

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingEntry, setEditingEntry] = useState<FantasyEntry | null>(null);

  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all");

  const [typeFilter, setTypeFilter] = useState<"all" | FantasyEntryType>("all");

  const [formData, setFormData] = useState<FantasyFormState>(EMPTY_FORM);

  const filteredEntries = useMemo(() => {
    return fantasyEntries.filter((entry) => {
      if (privacyFilter === "shared" && !entry.isSharedWithPartner) {
        return false;
      }

      if (privacyFilter === "private" && entry.isSharedWithPartner) {
        return false;
      }

      if (typeFilter !== "all" && entry.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [fantasyEntries, privacyFilter, typeFilter]);

  const resetForm = () => {
    setEditingEntry(null);
    setFormData(EMPTY_FORM);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (entry: FantasyEntry) => {
    setEditingEntry(entry);

    setFormData({
      title: entry.title,
      content: entry.content,
      type: entry.type,
      tags: entry.tags,
      isSharedWithPartner: entry.isSharedWithPartner,
      mood: entry.mood ?? 5,
    });

    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const title = formData.title.trim();
    const content = formData.content.trim();

    if (!title || !content) {
      return;
    }

    if (editingEntry) {
      updateFantasyEntry(editingEntry.id, {
        title,
        content,
        type: formData.type,
        tags: formData.tags,
        isSharedWithPartner: formData.isSharedWithPartner,
        mood: formData.mood,
      });
    } else {
      const newEntry: FantasyEntry = {
        id: uuidv4(),
        title,
        content,
        type: formData.type,
        tags: formData.tags,
        isSharedWithPartner: formData.isSharedWithPartner,
        mood: formData.mood,
        phase: currentPhase,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addFantasyEntry(newEntry);
    }

    closeDialog();
  };

  const toggleShare = (entry: FantasyEntry) => {
    updateFantasyEntry(entry.id, {
      isSharedWithPartner: !entry.isSharedWithPartner,
    });
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim();

    if (!cleanTag || formData.tags.includes(cleanTag)) {
      return;
    }

    setFormData((current) => ({
      ...current,
      tags: [...current.tags, cleanTag],
    }));
  };

  const removeTag = (tag: string) => {
    setFormData((current) => ({
      ...current,
      tags: current.tags.filter((currentTag) => currentTag !== tag),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingSpinner size="lg" text="Loading your fantasy vault..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-8">
      <Navigation />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <FantasyHeader onCreate={openCreateDialog} />

        <FantasyFilters
          privacyFilter={privacyFilter}
          typeFilter={typeFilter}
          onPrivacyChange={setPrivacyFilter}
          onTypeChange={setTypeFilter}
        />

        {filteredEntries.length === 0 ? (
          <FantasyEmptyState
            hasEntries={fantasyEntries.length > 0}
            onCreate={openCreateDialog}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <FantasyCard
                key={entry.id}
                entry={entry}
                onEdit={() => openEditDialog(entry)}
                onToggleShare={() => toggleShare(entry)}
              />
            ))}
          </div>
        )}
      </main>

      {dialogOpen && (
        <FantasyEntryDialog
          editing={Boolean(editingEntry)}
          formData={formData}
          onChange={setFormData}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

type FantasyHeaderProps = {
  onCreate: () => void;
};

function FantasyHeader({ onCreate }: FantasyHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cta-start/10 text-cta-start">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Fantasy Vault
          </h1>

          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A private space for your thoughts, ideas and desires.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-gradient)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        New entry
      </button>
    </section>
  );
}

type FantasyFiltersProps = {
  privacyFilter: PrivacyFilter;
  typeFilter: "all" | FantasyEntryType;
  onPrivacyChange: (filter: PrivacyFilter) => void;
  onTypeChange: (filter: "all" | FantasyEntryType) => void;
};

function FantasyFilters({
  privacyFilter,
  typeFilter,
  onPrivacyChange,
  onTypeChange,
}: FantasyFiltersProps) {
  return (
    <section
      aria-label="Fantasy filters"
      className="space-y-4 rounded-2xl border border-border bg-bg-surface p-4"
    >
      <FilterGroup
        label="Visibility"
        options={privacyFilters}
        selected={privacyFilter}
        onChange={(option) => onPrivacyChange(option as PrivacyFilter)}
      />

      <FilterGroup
        label="Type"
        options={typeFilters}
        selected={typeFilter}
        onChange={(option) => onTypeChange(option as "all" | FantasyEntryType)}
      />
    </section>
  );
}

type FilterGroupProps = {
  label: string;
  options: readonly string[];
  selected: string;
  onChange: (option: string) => void;
};

function FilterGroup({ label, options, selected, onChange }: FilterGroupProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                active
                  ? "border-cta-start bg-cta-start/10 text-cta-start"
                  : "border-border bg-bg-elevated text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type FantasyCardProps = {
  entry: FantasyEntry;
  onEdit: () => void;
  onToggleShare: () => void;
};

function FantasyCard({ entry, onEdit, onToggleShare }: FantasyCardProps) {
  const TypeIcon = getEntryTypeIcon(entry.type);

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-bg-surface p-5 transition-shadow hover:shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TypeIcon className="h-4 w-4" />

          <span className="text-xs font-medium capitalize">{entry.type}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleShare}
            aria-label={
              entry.isSharedWithPartner
                ? "Make entry private"
                : "Share entry with partner"
            }
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              entry.isSharedWithPartner
                ? "bg-cta-start/10 text-cta-start"
                : "bg-bg-elevated text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.isSharedWithPartner ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${entry.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-base font-semibold text-foreground">
          {entry.title}
        </h2>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {entry.content}
        </p>

        {entry.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-bg-elevated px-2.5 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}

            {entry.tags.length > 3 && (
              <span className="rounded-full bg-bg-elevated px-2.5 py-1 text-xs text-muted-foreground">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Mood {entry.mood ?? "—"}/10</span>

        <span>{format(entry.createdAt, "d MMM yyyy")}</span>
      </div>
    </article>
  );
}

type FantasyEmptyStateProps = {
  hasEntries: boolean;
  onCreate: () => void;
};

function FantasyEmptyState({ hasEntries, onCreate }: FantasyEmptyStateProps) {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-bg-surface px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cta-start/10 text-cta-start">
        <Sparkles className="h-7 w-7" />
      </div>

      <h2 className="text-lg font-semibold text-foreground">
        {hasEntries ? "No matching entries" : "Your vault is empty"}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {hasEntries
          ? "Try changing the current filters."
          : "Create your first private entry whenever you're ready."}
      </p>

      {!hasEntries && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent-gradient)] px-4 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Create first entry
        </button>
      )}
    </section>
  );
}

type FantasyEntryDialogProps = {
  editing: boolean;
  formData: FantasyFormState;
  onChange: React.Dispatch<React.SetStateAction<FantasyFormState>>;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function FantasyEntryDialog({
  editing,
  formData,
  onChange,
  onAddTag,
  onRemoveTag,
  onClose,
  onSubmit,
}: FantasyEntryDialogProps) {
  const invalid = !formData.title.trim() || !formData.content.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fantasy-dialog-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-bg-surface p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="fantasy-dialog-title"
              className="text-xl font-semibold text-foreground"
            >
              {editing ? "Edit entry" : "New entry"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Keep this private or choose to share it with your partner.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <Field label="Title">
            <input
              type="text"
              value={formData.title}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Give your entry a title"
              className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-cta-start focus:ring-2 focus:ring-cta-start/20"
            />
          </Field>

          <Field label="Type">
            <div className="grid grid-cols-3 gap-2">
              {entryTypes.map((type) => {
                const Icon = getEntryTypeIcon(type);

                const active = formData.type === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      onChange((current) => ({
                        ...current,
                        type,
                      }))
                    }
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium capitalize transition-colors",
                      active
                        ? "border-cta-start bg-cta-start/10 text-cta-start"
                        : "border-border bg-bg-elevated text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {type}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Content">
            <textarea
              value={formData.content}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="Write whatever is on your mind..."
              rows={6}
              className="w-full resize-y rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-cta-start focus:ring-2 focus:ring-cta-start/20"
            />
          </Field>

          <Field label={`Mood: ${formData.mood}/10`}>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.mood}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  mood: Number(event.target.value),
                }))
              }
              className="w-full"
            />
          </Field>

          <Field label="Tags">
            {formData.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="rounded-full bg-cta-start/10 px-3 py-1 text-xs text-cta-start"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {suggestedTags
                .filter((tag) => !formData.tags.includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onAddTag(tag)}
                    className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg-elevated p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Share with partner
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Your entry remains private unless you explicitly share it.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={formData.isSharedWithPartner}
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  isSharedWithPartner: !current.isSharedWithPartner,
                }))
              }
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                formData.isSharedWithPartner ? "bg-cta-start" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                  formData.isSharedWithPartner
                    ? "translate-x-6"
                    : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-bg-elevated"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={invalid}
            className="min-h-11 flex-1 rounded-xl bg-[var(--accent-gradient)] px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? "Save changes" : "Create entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>

      {children}
    </div>
  );
}

function getEntryTypeIcon(type: FantasyEntryType) {
  switch (type) {
    case "moodboard":
      return ImageIcon;

    case "audio":
      return Music;

    case "text":
    default:
      return FileText;
  }
}
