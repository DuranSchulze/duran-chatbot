import type { ChatbotConfig } from "@duran-chatbot/config";
import { ConfigSummaryCard } from "@/components/cards/config-summary-card";
import { EmbedCodeCard } from "@/components/cards/embed-code-card";
import { StatusBanner } from "@/components/cards/status-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { getEmbedCode } from "@/lib/embed";

export function OverviewPanel({ config, profileSlug }: {
  config: ChatbotConfig;
  profileSlug: string;
}) {
  return (
    <div>
      <SectionHeader
        title="Overview & embed"
        description="Review this profile’s configuration and copy the snippet to add its chatbot to your website."
      />
      <div className="min-w-0 space-y-6">
        <StatusBanner
          title="Editing workflow"
          description="Adjust any section, review and save when ready."
        />
        <ConfigSummaryCard config={config} />
        <EmbedCodeCard code={getEmbedCode(config, profileSlug)} />
      </div>
    </div>
  );
}
