"use client";

import { useState } from "react";
import { Share2, Eye, EyeOff } from "lucide-react";
import { toggleShare } from "@/services/intimacy/actions";

interface ShareToggleProps {
  date: string;
  shared: boolean;
}

export default function ShareToggle({ date, shared }: ShareToggleProps) {
  const [isShared, setIsShared] = useState(shared);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("date", date);
    formData.append("shared", (!isShared).toString());

    const result = await toggleShare(formData);

    if (result.success) {
      setIsShared(!isShared);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center space-x-2">
        {isShared ? (
          <Eye size={16} className="text-green-600 dark:text-green-400" />
        ) : (
          <EyeOff size={16} className="text-gray-500" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isShared ? "Shared with partner" : "Private"}
        </span>
      </div>

      <button
        onClick={handleToggle}
        disabled={isSubmitting}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isShared
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        {isSubmitting ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        ) : (
          <Share2 size={14} />
        )}
        <span>{isShared ? "Hide" : "Share"}</span>
      </button>
    </div>
  );
}
