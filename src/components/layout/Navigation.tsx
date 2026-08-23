"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Heart,
  Shield,
  Users,
  Settings,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { uploadProfileImage, deleteProfileImage } from "@/lib/supabase/storage";
import { getUserProfileImage, saveUserProfileImage } from "@/lib/storage";
import { getPhaseEmoji } from "@/utils/mockData";

type UserMeta = {
  name?: string;
  full_name?: string;
};

const Navigation = () => {
  const pathname = usePathname();
  const { state, toggleTheme } = useApp();
  const { isDarkMode, currentPhase } = state;
  const { user, signOut } = useAuth();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName =
    (user?.user_metadata as UserMeta)?.full_name ||
    (user?.user_metadata as UserMeta)?.name ||
    user?.email?.split("@")[0] ||
    "User";

  useEffect(() => {
    if (user?.id) {
      const savedImageUrl = getUserProfileImage(user.id);
      setProfileImageUrl(savedImageUrl);
    }
  }, [user?.id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user?.id) return;

    if (!file.type.startsWith("image/")) {
      setUploadStatus({
        type: "error",
        message: "Please select an image file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        type: "error",
        message: "Image must be smaller than 5MB",
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      const { url, error } = await uploadProfileImage(file, user.id);

      if (error) {
        setUploadStatus({ type: "error", message: error });
      } else if (url) {
        setProfileImageUrl(url);
        saveUserProfileImage(user.id, url);
        setUploadStatus({
          type: "success",
          message: "Profile image updated successfully!",
        });

        setTimeout(() => {
          setShowProfileModal(false);
          setUploadStatus({ type: null, message: "" });
        }, 2000);
      }
    } catch {
      setUploadStatus({ type: "error", message: "Failed to upload image" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!user?.id) return;

    setUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      const { error } = await deleteProfileImage(user.id);

      if (error) {
        setUploadStatus({ type: "error", message: error });
      } else {
        setProfileImageUrl(null);
        saveUserProfileImage(user.id, "");
        setUploadStatus({
          type: "success",
          message: "Profile image removed successfully!",
        });

        setTimeout(() => {
          setShowProfileModal(false);
          setUploadStatus({ type: null, message: "" });
        }, 2000);
      }
    } catch {
      setUploadStatus({ type: "error", message: "Failed to delete image" });
    } finally {
      setUploading(false);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Calendar,
      emoji: getPhaseEmoji(currentPhase),
    },
    {
      name: "Cycle",
      href: "/cycle",
      icon: Calendar,
    },
    {
      name: "Privacy",
      href: "/settings/privacy",
      icon: Shield,
    },
    {
      name: "Partner",
      href: "/partner",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      <header className="border-b sticky top-0 z-50 bg-white dark:bg-[#17121F] dark:border-[#34263F]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-gradient)] shadow-md">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <div className="text-xl font-bold gradient-text">SheSync+</div>
              <div className="text-lg">{getPhaseEmoji(currentPhase)}</div>
            </div>

            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-rose-500 to-purple-600"
                  >
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={`${displayName} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-white m-auto" />
                    )}
                  </button>

                  <span className="text-sm hidden sm:inline">
                    {displayName}
                  </span>

                  <button onClick={signOut} className="text-sm text-rose-500">
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="text-sm text-rose-500">
                  Sign In
                </Link>
              )}

              <button onClick={toggleTheme}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-[#17121F]">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center text-xs ${
                  isActive ? "text-rose-500" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {item.emoji ? (
                  <span>{item.emoji}</span>
                ) : (
                  <item.icon size={20} />
                )}
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {showProfileModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="mb-4 font-bold">Profile Picture</h3>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Upload
            </button>

            {profileImageUrl && (
              <button onClick={handleDeleteImage} disabled={uploading}>
                Remove
              </button>
            )}

            {uploadStatus.message && <p>{uploadStatus.message}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
