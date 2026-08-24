"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Check, X } from "lucide-react";
import {
  updateBoundary,
  deleteBoundaryAction,
} from "@/services/intimacy/actions";
import { getBoundaryStatusDisplay } from "@/features/intimacy/intimacy.selectors";
import type { BoundaryItemRecord } from "@/schemas/intimacy";

interface BoundaryManagerProps {
  boundaries: BoundaryItemRecord[];
}

export default function BoundaryManager({ boundaries }: BoundaryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBoundary, setNewBoundary] = useState<{
    label: string;
    status: "yes" | "maybe" | "no";
  }>({ label: "", status: "yes" });
  const [editingDraft, setEditingDraft] = useState<{
    label: string;
    status: "yes" | "maybe" | "no";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBoundary = async () => {
    if (!newBoundary.label.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("label", newBoundary.label.trim());
    formData.append("status", newBoundary.status);

    const result = await updateBoundary(formData);

    if (result.success) {
      setNewBoundary({ label: "", status: "yes" });
      setIsAdding(false);
    }

    setIsSubmitting(false);
  };

  const handleEditBoundary = async (boundary: BoundaryItemRecord) => {
    if (!editingDraft?.label.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("id", boundary.id);
    formData.append("label", editingDraft.label.trim());
    formData.append("status", editingDraft.status);

    const result = await updateBoundary(formData);

    if (result.success) {
      setEditingId(null);
      setEditingDraft(null);
    }

    setIsSubmitting(false);
  };

  const startEditing = (boundary: BoundaryItemRecord) => {
    setEditingId(boundary.id);
    setEditingDraft({
      label: boundary.label,
      status: boundary.status,
    });
  };

  const handleDeleteBoundary = async (boundaryId: string) => {
    if (!confirm("Are you sure you want to delete this boundary?")) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("id", boundaryId);

    await deleteBoundaryAction(formData);
    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "yes":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "maybe":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "no":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Boundaries */}
      {boundaries.map((boundary) => (
        <div
          key={boundary.id}
          className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
        >
          {editingId === boundary.id ? (
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={editingDraft?.label ?? boundary.label}
                onChange={(e) =>
                  setEditingDraft((current) => ({
                    label: e.target.value,
                    status: current?.status ?? boundary.status,
                  }))
                }
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground placeholder:text-muted focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Boundary label"
              />
              <select
                value={editingDraft?.status ?? boundary.status}
                onChange={(e) =>
                  setEditingDraft((current) => ({
                    label: current?.label ?? boundary.label,
                    status: e.target.value as "yes" | "maybe" | "no",
                  }))
                }
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
              <button
                onClick={() => handleEditBoundary(boundary)}
                disabled={isSubmitting}
                className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingDraft(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-foreground font-medium">{boundary.label}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(boundary.status)}`}
              >
                {getBoundaryStatusDisplay(boundary.status)}
              </span>
              <button
                onClick={() => startEditing(boundary)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDeleteBoundary(boundary.id)}
                disabled={isSubmitting}
                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ))}

      {/* Add New Boundary */}
      {isAdding ? (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <input
            type="text"
            value={newBoundary.label}
            onChange={(e) =>
              setNewBoundary({ ...newBoundary, label: e.target.value })
            }
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground placeholder:text-muted focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="What's your boundary?"
            autoFocus
          />
          <select
            value={newBoundary.status}
            onChange={(e) =>
              setNewBoundary({
                ...newBoundary,
                status: e.target.value as "yes" | "maybe" | "no",
              })
            }
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          >
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>
          <button
            onClick={handleAddBoundary}
            disabled={!newBoundary.label.trim() || isSubmitting}
            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewBoundary({ label: "", status: "yes" });
            }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-muted hover:text-foreground hover:border-rose-300 dark:hover:border-rose-600 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Add a boundary</span>
        </button>
      )}

      {boundaries.length === 0 && !isAdding && (
        <div className="text-center py-8">
          <p className="text-muted text-sm mb-4">
            Set your boundaries to communicate your needs and comfort levels.
          </p>
          <p className="text-help text-xs">
            Examples: &quot;Hugs are welcome&quot;, &quot;Ask before
            touching&quot;, &quot;No physical contact today&quot;
          </p>
        </div>
      )}
    </div>
  );
}
