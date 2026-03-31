import { useMemo, useState } from "react";
import type { ChatbotConfig } from "@duran-chatbot/config";
import { getEmbedCode } from "lib/embed";

import { AdminShell } from "@/components/layout/admin-shell";
import { ConfigSummaryCard } from "@/components/cards/config-summary-card";
import { EmbedCodeCard } from "@/components/cards/embed-code-card";
import { StatusBanner } from "@/components/cards/status-banner";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getConfigSections } from "@/features/config-editor/sections";
import type { ConfigSectionId } from "@/features/config-editor/types";
import { useConfig } from "@/hooks/useConfig";

function App() {
  const { config, loading, error, saving, updateConfig } = useConfig();
  const [activeSection, setActiveSection] =
    useState<ConfigSectionId>("appearance");
  const [editedConfig, setEditedConfig] = useState<ChatbotConfig | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  const currentConfig = editedConfig ?? config;

  const handleConfigChange = (newConfig: ChatbotConfig) => {
    setEditedConfig(newConfig);
    setSaveStatus("");
  };

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

  const updateSection = <K extends keyof ChatbotConfig>(
    key: K,
    value: ChatbotConfig[K],
  ) => {
    if (!currentConfig) {
      return;
    }

    handleConfigChange({
      ...currentConfig,
      [key]: value,
    });
  };

  const getEmbedCode = () => {
    if (!currentConfig) {
      return "";
    }

    return `<!-- Chatbot Widget -->
<div id="chatbot-widget"></div>
<script>
  window.ChatbotConfig = {
    appearance: {
      position: '${currentConfig.appearance.position}',
      companyName: '${currentConfig.appearance.companyName}',
      primaryColor: '${currentConfig.appearance.primaryColor}'
    }
  };
</script>
<script src="https://your-domain.com/widget.js" async></script>`;
  };

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
    [currentConfig],
  );

  const currentPanel =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-medium text-foreground">
              Loading admin workspace...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !currentConfig || !currentPanel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl">
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
      header={
        <TopBar
          saving={saving}
          dirty={Boolean(editedConfig)}
          saveStatus={saveStatus}
          onSave={handleSave}
        />
      }
      sidebar={
        <SidebarNav
          items={sections}
          activeId={currentPanel.id}
          onSelect={(id) => setActiveSection(id as ConfigSectionId)}
          dirty={Boolean(editedConfig)}
        />
      }
      main={
        <Card className="min-h-full bg-white shadow-sm">
          <CardContent className="pt-6">{currentPanel.render()}</CardContent>
        </Card>
      }
      aside={
        <>
          {error ? (
            <StatusBanner tone="error" title="Save issue" description={error} />
          ) : (
            <StatusBanner
              title="Editing workflow"
              description="Adjust any section, review the current setup on the right, and save once your draft is ready."
            />
          )}
          <ConfigSummaryCard config={currentConfig} />
          <EmbedCodeCard code={getEmbedCode()} />
        </>
      }
    />
  );
}

export default App;
