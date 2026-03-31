import { useCallback, useMemo, useState } from "react";
import type { ChatbotConfig } from "@duran-chatbot/config";
import { getEmbedCode } from "@/lib/embed";
import { AdminShell } from "@/components/layout/admin-shell";
import { ConfigSummaryCard } from "@/components/cards/config-summary-card";
import { EmbedCodeCard } from "@/components/cards/embed-code-card";
import { StatusBanner } from "@/components/cards/status-banner";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { getConfigSections } from "@/features/config-editor/sections";
import type { ConfigSectionId } from "@/features/config-editor/types";
import { useConfig } from "@/hooks/useConfig";
import { savePreviewConfig } from "@/lib/preview";
import { WidgetPreviewPage } from "@/pages/widget-preview-page";

function App() {
  const { config, loading, error, saving, updateConfig } = useConfig();
  const [activeSection, setActiveSection] =
    useState<ConfigSectionId>("appearance");
  const [editedConfig, setEditedConfig] = useState<ChatbotConfig | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPreviewPage = new URLSearchParams(window.location.search).get("preview") === "1";

  const currentConfig = editedConfig ?? config;

  const handleConfigChange = useCallback((newConfig: ChatbotConfig) => {
    setEditedConfig(newConfig);
    setSaveStatus("");
  }, []);

  const handleSave = async () => {
    if (!editedConfig) {
      return;
    }

    const success = await updateConfig(editedConfig);
    if (success) {
      setSaveStatus("Saved successfully");
      setEditedConfig(null);
      window.setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const updateSection = useCallback(
    <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) => {
      if (!currentConfig) {
        return;
      }
      handleConfigChange({
        ...currentConfig,
        [key]: value,
      });
    },
    [currentConfig, handleConfigChange],
  );

  const sections = useMemo(
    () =>
      currentConfig
        ? getConfigSections({
            appearance: currentConfig.appearance,
            ai: currentConfig.ai,
            quickLinks: currentConfig.quickLinks,
            dataset: currentConfig.dataset,
            behavior: currentConfig.behavior,
            onAppearanceChange: (appearance) =>
              updateSection("appearance", appearance),
            onAIChange: (ai) => updateSection("ai", ai),
            onQuickLinksChange: (quickLinks) =>
              updateSection("quickLinks", quickLinks),
            onDatasetChange: (dataset) => updateSection("dataset", dataset),
            onBehaviorChange: (behavior) => updateSection("behavior", behavior),
          })
        : [],
    [currentConfig, updateSection],
  );

  const currentPanel =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  if (isPreviewPage) {
    return <WidgetPreviewPage />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          <p className="text-sm text-slate-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (error || !currentConfig || !currentPanel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm">
          <StatusBanner
            tone="error"
            title="Unable to load configuration"
            description={error || "Failed to load configuration"}
          />
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      sidebarOpen={sidebarOpen}
      onSidebarClose={() => setSidebarOpen(false)}
      header={
        <TopBar
          saving={saving}
          dirty={Boolean(editedConfig)}
          saveStatus={saveStatus}
          onSave={handleSave}
          onPreview={() => {
            savePreviewConfig(currentConfig);
            window.open("/?preview=1", "_blank", "noopener,noreferrer");
          }}
          onMenuClick={() => setSidebarOpen(true)}
          activeLabel={currentPanel.label}
        />
      }
      sidebar={
        <SidebarNav
          items={sections}
          activeId={currentPanel.id}
          onSelect={(id) => {
            setActiveSection(id as ConfigSectionId);
            setSidebarOpen(false);
          }}
          dirty={Boolean(editedConfig)}
        />
      }
      main={
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="px-6 py-6">{currentPanel.render()}</div>
        </div>
      }
      aside={
        <>
          {error ? (
            <StatusBanner tone="error" title="Save issue" description={error} />
          ) : (
            <StatusBanner
              title="Editing workflow"
              description="Adjust any section, review and save when ready."
            />
          )}
          <ConfigSummaryCard config={currentConfig} />
          <EmbedCodeCard code={getEmbedCode(currentConfig)} />
        </>
      }
    />
  );
}

export default App;
