"use client";

import { useState, type KeyboardEvent } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { BoundariesTab } from "@/components/connect/BoundariesTab";
import { ExploreTab } from "@/components/connect/ExploreTab";
import { PartnerConnectSummary } from "@/components/connect/PartnerConnectSummary";
import { ReflectionsTab } from "@/components/connect/ReflectionsTab";

type ConnectTab = "explore" | "boundaries" | "reflections" | "partner";

const TABS: { id: ConnectTab; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "boundaries", label: "Boundaries" },
  { id: "reflections", label: "Reflections" },
  { id: "partner", label: "Partner" },
];

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState<ConnectTab>("explore");

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab.id);
    document.getElementById(`connect-tab-${nextTab.id}`)?.focus();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <SectionHeading
        title="Connect with intention."
        description="Explore relationship connection cards, align on boundaries, and manage your partner connection."
      />

      <div
        role="tablist"
        aria-label="Connect sections"
        className="flex flex-wrap gap-2 border-b border-border pb-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`connect-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="connect-tabpanel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={handleTabKeyDown}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
              activeTab === tab.id
                ? "bg-bg-elevated text-foreground"
                : "text-muted-foreground hover:bg-bg-elevated hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="connect-tabpanel"
        aria-labelledby={`connect-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "boundaries" && <BoundariesTab />}
        {activeTab === "reflections" && <ReflectionsTab />}
        {activeTab === "partner" && <PartnerConnectSummary />}
      </div>
    </div>
  );
}
