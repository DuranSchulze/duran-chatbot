import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";
import { MessageCircle, Phone, Send } from "lucide-react";
import type { IntegrationsConfig } from "@duran-chatbot/config";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Switch } from "@/components/ui/switch";

type IntegrationsPanelProps = {
  profileSlug: string;
  integrations: IntegrationsConfig;
  onChange: (integrations: IntegrationsConfig) => void;
};

type ChannelDefinition = {
  id: keyof IntegrationsConfig;
  name: string;
  icon: LucideIcon;
  iconClass: string;
  tagline: string;
  description: string;
  envVars: { name: string; label: string }[];
};

const CHANNELS: ChannelDefinition[] = [
  {
    id: "viber",
    name: "Viber",
    icon: Phone,
    iconClass: "bg-purple-100 text-purple-600",
    tagline: "Bot alerts through a Viber commercial bot.",
    description:
      "Arrange a commercial Viber bot, then subscribe from the account that should receive inquiry alerts.",
    envVars: [
      { name: "VIBER_AUTH_TOKEN", label: "Auth token from your Viber bot" },
      { name: "VIBER_ADMIN_USER_ID", label: "Your Viber user id (after subscribing)" },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    iconClass: "bg-emerald-100 text-emerald-600",
    tagline: "Official Meta Cloud API — more setup, per-message fees apply.",
    description:
      "Uses the Meta Cloud API and an approved template with four body parameters: profile, name, email, and inquiry. The recipient must opt in. Long inquiries are shortened in the alert; the full text stays in Conversations.",
    envVars: [
      { name: "WHATSAPP_ACCESS_TOKEN", label: "Permanent access token (Meta app)" },
      { name: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone number id of the sender" },
      { name: "WHATSAPP_ADMIN_NUMBER", label: "Your opted-in WhatsApp number (recipient)" },
      { name: "WHATSAPP_TEMPLATE_NAME", label: "Approved template name" },
      { name: "WHATSAPP_TEMPLATE_LANGUAGE", label: "Approved language code, e.g. en_US" },
      { name: "WHATSAPP_API_VERSION", label: "Supported Graph API version, e.g. v23.0" },
    ],
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: Send,
    iconClass: "bg-sky-100 text-sky-600",
    tagline: "Free bot alerts — fastest setup of all three.",
    description:
      "Create a bot with @BotFather in a couple of minutes, message it once, and the chatbot sends lead notifications straight to that chat.",
    envVars: [
      { name: "TELEGRAM_BOT_TOKEN", label: "Bot token from @BotFather" },
      { name: "TELEGRAM_CHAT_ID", label: "Your chat id with the bot" },
    ],
  },
];

type DeliveryStatus = {
  channels: Record<keyof IntegrationsConfig, { configured: boolean; missing: string[] }>;
  counts: { channel: string; status: string; count: number }[];
  lastFailure: { channel: string; lastError: string; updatedAt: string } | null;
};

export function IntegrationsPanel({ profileSlug, integrations, onChange }: IntegrationsPanelProps) {
  const [refresh, setRefresh] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setStatus(null);
    setStatusError("");
    fetch(`/api/notification-status?profile=${encodeURIComponent(profileSlug)}`, { headers: getAuthHeaders(), signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Unable to load delivery status. Check your login and database migration.");
        setStatus(await response.json());
      }).catch(error => { if (!controller.signal.aborted) setStatusError(error.message); });
    return () => controller.abort();
  }, [profileSlug, refresh]);
  const retryFailed = async () => {
    setRetrying(true);
    setRetryMessage("");
    try {
      const response = await fetch(`/api/notification-status?profile=${encodeURIComponent(profileSlug)}`, { method: "POST", headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Unable to retry alerts.");
      const result = await response.json();
      setRetryMessage(`${result.queued} alerts queued for the next worker run.`);
      setRefresh(value => value + 1);
    } catch { setRetryMessage("Unable to retry alerts. Check your login and try again."); }
    finally { setRetrying(false); }
  };
  const toggle = (id: keyof IntegrationsConfig, enabled: boolean) => {
    onChange({ ...integrations, [id]: { ...integrations[id], enabled } });
  };

  const enabledCount = CHANNELS.filter((c) => integrations[c.id]?.enabled).length;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Integrations"
        title="Bot Integrations"
        description="Send yourself a notification on Viber, WhatsApp, or Telegram for each visitor inquiry, including their name and email when provided. Toggle channels on below, then save with the Save button in the top bar."
        action={
          enabledCount > 0 ? (
            <Badge variant="success">
              {enabledCount} enabled
            </Badge>
          ) : (
            <Badge variant="secondary">All off</Badge>
          )
        }
      />

      <Card className="border-dashed bg-slate-50/70 shadow-none">
        <CardContent className="space-y-2 pt-5">
          <h3 className="text-base font-semibold text-slate-900">
            How credentials work
          </h3>
          <p className="text-sm leading-6 text-slate-500">
            Store credentials in your hosting environment (locally, the root .env.local file).
            Set <code>NOTIFICATION_PROFILE_SLUG</code> to <code>{profileSlug}</code> to authorize
            these recipients for this profile. Save your channel switches to enable alerts.
            Tell visitors that their contact details and inquiries are shared with your team through these services.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Refresh status</Button>
        {status?.lastFailure && <Button variant="outline" disabled={retrying} onClick={retryFailed}>
          {retrying ? "Queueing…" : "Retry failed alerts (up to 50)"}
        </Button>}
        {retryMessage && <p role="status" className="text-sm text-slate-600">{retryMessage}</p>}
      </div>
      {statusError && <p role="alert" className="text-sm text-red-600">{statusError}</p>}
      {status?.lastFailure && <p role="status" className="text-sm text-amber-700">
        Latest failed alert: {status.lastFailure.channel} ({status.lastFailure.lastError}). Check the provider settings and delivery logs.
      </p>}
      <div className="space-y-5">
        {CHANNELS.map((channel) => {
          const config = integrations[channel.id];
          const enabled = config?.enabled ?? false;
          const Icon = channel.icon;

          return (
            <Card
              key={channel.id}
              className={
                enabled
                  ? "border-blue-200 bg-white shadow-none"
                  : "border-slate-200 bg-white shadow-none"
              }
            >
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${channel.iconClass}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {channel.name}
                        </h3>
                        <Badge variant={enabled ? "success" : "secondary"}>
                          {enabled ? "On" : "Off"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {channel.tagline}
                      </p>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggle(channel.id, checked)}
                    aria-label={`Toggle ${channel.name} notifications`}
                  />
                </div>

                <p className="text-sm text-slate-600" role="status">
                  {!status ? "Delivery readiness unavailable" : status.channels[channel.id].configured
                    ? "Server settings present. Provider acceptance is tracked below."
                    : `Setup needed: ${status.channels[channel.id].missing.join(", ")}`}
                </p>
                {status && <p className="text-xs text-slate-500">
                  {status.counts.filter(row => row.channel === channel.id).map(row => `${row.count} ${row.status}`).join(" · ") || "No alerts queued yet"}.
                  {" "}Accepted means the provider accepted the request; it does not confirm receipt on your phone.
                </p>}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Environment variables ({channel.name})
                  </p>
                  <ul className="space-y-1.5">
                    {channel.envVars.map((envVar) => (
                      <li key={envVar.name} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <code className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                          {envVar.name}
                        </code>
                        <span className="text-slate-500">{envVar.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
