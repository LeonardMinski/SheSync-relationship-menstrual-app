"use client";

import { useState, type KeyboardEvent } from "react";

import { BoundariesTab } from "@/components/connect/BoundariesTab";
import {
  EXPLORE_CATEGORIES,
  ExploreTab,
  TODAYS_SUGGESTION,
  type CardCategory,
  type IntimacyCard,
} from "@/components/connect/ExploreTab";
import { PartnerConnectSummary } from "@/components/connect/PartnerConnectSummary";
import { ReflectionsTab } from "@/components/connect/ReflectionsTab";
import { SupportiveActions } from "@/components/connect/SupportiveActions";
import { TodaysIntimacySuggestion } from "@/components/connect/TodaysIntimacySuggestion";
import { RelationshipHub } from "@/components/relationship/RelationshipHub";
import { resolveActivePartner } from "@/features/partner/activePartner";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

type ConnectTab = "explore" | "boundaries" | "reflections";

const TABS: { id: ConnectTab; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "boundaries", label: "Boundaries" },
  { id: "reflections", label: "Reflections" },
];

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState<ConnectTab>("explore");
  const [activeCategory, setActiveCategory] = useState<CardCategory | "All">("All");
  const [activeCard, setActiveCard] = useState<IntimacyCard | null>(null);
  const { ownerLink, viewerLink, partnerData } = usePartnerPortalData();
  const activePartner = resolveActivePartner(ownerLink, viewerLink);
  const connectedSince = ownerLink?.status === "active" ? ownerLink.created_at : viewerLink?.status === "active" ? viewerLink.created_at : null;

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
      <div>
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-rose)]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          Your Intimate Space
        </p>
        <h1 className="font-display mt-2 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Connect
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Share what matters, build understanding, and explore intimacy on your terms.
        </p>
      </div>

      {activePartner && (
        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-6">
          <RelationshipHub
            partnerName={activePartner.name}
            partnerId={activePartner.id}
            connectedSince={connectedSince}
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <PartnerConnectSummary />
          {activeTab === "explore" && (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter cards by category"
            >
              {EXPLORE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-[44px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start ${
                    activeCategory === category
                      ? "border-cta-start bg-cta-start text-[color:var(--cta-foreground)]"
                      : "border-border bg-bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === "explore" && (
          <TodaysIntimacySuggestion
            prompt={TODAYS_SUGGESTION.prompt}
            onExplore={() => setActiveCard(TODAYS_SUGGESTION)}
          />
        )}
      </div>

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
                ? "bg-cta-start text-[color:var(--cta-foreground)] shadow-sm"
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
        {activeTab === "explore" && (
          <ExploreTab
            activeCategory={activeCategory}
            activeCard={activeCard}
            onSelectCard={setActiveCard}
            onCloseCard={() => setActiveCard(null)}
          />
        )}
        {activeTab === "boundaries" && <BoundariesTab />}
        {activeTab === "reflections" && <ReflectionsTab />}
      </div>

      <SupportiveActions
        partnerIsSharing={partnerData?.privacySettings.shareWithPartner === true}
      />
    </div>
  );
}
