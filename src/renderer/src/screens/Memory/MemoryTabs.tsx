import { Database, User, Cloud, Drama } from "lucide-react";
import { useI18n } from "../../components/useI18n";
import type { MemoryTab } from "./types";

interface MemoryTabsProps {
  activeTab: MemoryTab;
  onTabChange: (tab: MemoryTab) => void;
}

export function MemoryTabs({
  activeTab,
  onTabChange,
}: MemoryTabsProps): React.JSX.Element {
  const { t } = useI18n();

  const tabs: { id: MemoryTab; icon: typeof Database; label: string }[] = [
    { id: "entries", icon: Database, label: t("memory.agentMemory") },
    { id: "profile", icon: User, label: t("memory.userProfile") },
    { id: "providers", icon: Cloud, label: t("memory.providersTitle") },
    { id: "soul", icon: Drama, label: t("soul.title") },
  ];

  return (
    <div
      className="memory-tabs mx-tabs"
      role="tablist"
      aria-label={t("memory.title")}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`memory-tab mx-tab ${selected ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
