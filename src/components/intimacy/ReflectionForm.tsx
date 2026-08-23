"use client";

import { useState } from "react";
import { Edit3, Save, X } from "lucide-react";
import { updateReflection } from "@/services/intimacy/actions";

interface ReflectionFormProps {
  date: string;
  initialReflection: string;
}

export default function ReflectionForm({
  date,
  initialReflection,
}: ReflectionFormProps) {
  const [reflection, setReflection] = useState(initialReflection);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("date", date);
    formData.append("reflection", reflection);

    const result = await updateReflection(formData);

    if (result.success) {
      setIsEditing(false);
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setReflection(initialReflection);
    setIsEditing(false);
  };

  if (!isEditing && !reflection.trim()) {
    return (
      <div className="elevated p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Reflection
        </h3>
        <p className="text-muted text-sm mb-4">
          Take a moment to reflect on your connection experience today.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Edit3 size={16} />
          <span>Add Reflection</span>
        </button>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="elevated p-4 rounded-xl">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">Reflection</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Edit3 size={16} />
          </button>
        </div>
        <p className="text-foreground leading-relaxed">{reflection}</p>
      </div>
    );
  }

  return (
    <div className="elevated p-4 rounded-xl">
      <h3 className="text-lg font-semibold text-foreground mb-3">Reflection</h3>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="How did this connection activity make you feel? What did you learn about yourself or your partner?"
        className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground placeholder:text-muted focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
        rows={4}
        autoFocus
      />
      <div className="flex items-center space-x-3 mt-4">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-[var(--btn-primary-text)] rounded-lg font-semibold hover:from-rose-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save</span>
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
