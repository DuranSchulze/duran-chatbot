import { useEffect, useState, type ReactNode } from "react";
import { getAuthHeaders } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";
import { CircleHelp, ExternalLink, MessageCircle, Phone, Send, ShieldCheck, X } from "lucide-react";
import type { IntegrationsConfig } from "@duran-chatbot/config";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/editor/ui/dialog";
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
  guide: {
    lead: string;
    steps: { title: string; detail: ReactNode }[];
    docsUrl: string;
  };
};

const CHANNELS: ChannelDefinition[] = [
  {
    id: "viber",
    name: "Viber",
    icon: Phone,
    iconClass: "bg-purple-100 text-purple-600",
    tagline: "Bot alerts through a Viber commercial bot.",
    description:
      "Arrange a commercial Viber bot, then have every account that should receive inquiry alerts subscribe to it.",
    envVars: [
      { name: "VIBER_AUTH_TOKEN", label: "Auth token from your Viber bot" },
      { name: "VIBER_ADMIN_USER_IDS", label: "Comma- or newline-separated subscribed Viber user ids" },
      { name: "VIBER_ADMIN_USER_ID", label: "Optional legacy single-recipient variable" },
    ],
    guide: {
      lead: "Viber requires a commercial bot. Every person receiving alerts must first subscribe to that bot.",
      steps: [
        {
          title: "Create a commercial Viber bot",
          detail: <>Apply through Rakuten Viber or an approved partner. New Viber bots are offered on commercial terms.</>,
        },
        {
          title: "Copy the bot authentication token",
          detail: <>In Viber, open <strong>More → Settings → Bots → Edit Info</strong>, then copy <strong>Your app key</strong> into <code>VIBER_AUTH_TOKEN</code>.</>,
        },
        {
          title: "Collect each subscriber ID",
          detail: <>Have every recipient message or subscribe to the bot. Copy <code>sender.id</code> from a message callback or <code>user.id</code> from a subscribed callback. This app does not currently host the Viber callback, so use your bot provider’s callback log or a secure HTTPS callback endpoint.</>,
        },
        {
          title: "Add the recipients and redeploy",
          detail: <>Put the IDs in <code>VIBER_ADMIN_USER_IDS</code>, separated by commas or new lines. Save the environment variable, redeploy, enable Viber here, and submit a test inquiry.</>,
        },
      ],
      docsUrl: "https://developers.viber.com/docs/api/rest-bot-api/",
    },
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    iconClass: "bg-emerald-100 text-emerald-600",
    tagline: "Official Meta Cloud API — more setup, per-message fees apply.",
    description:
      "Uses the Meta Cloud API and an approved template with four body parameters: profile, name, email, and inquiry. Every recipient must opt in. Long inquiries are shortened in the alert; the full text stays in Conversations.",
    envVars: [
      { name: "WHATSAPP_ACCESS_TOKEN", label: "Permanent access token (Meta app)" },
      { name: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone number id of the sender" },
      { name: "WHATSAPP_ADMIN_NUMBERS", label: "Comma- or newline-separated opted-in WhatsApp numbers" },
      { name: "WHATSAPP_ADMIN_NUMBER", label: "Optional legacy single-recipient variable" },
      { name: "WHATSAPP_TEMPLATE_NAME", label: "Approved template name" },
      { name: "WHATSAPP_TEMPLATE_LANGUAGE", label: "Approved language code, e.g. en_US" },
      { name: "WHATSAPP_API_VERSION", label: "Supported Graph API version, e.g. v23.0" },
    ],
    guide: {
      lead: "WhatsApp sends an approved template from a Meta business number to each opted-in recipient.",
      steps: [
        {
          title: "Create the Meta business sender",
          detail: <>Create a Meta developer app, add the WhatsApp product, and connect or create a WhatsApp Business Account and sender number.</>,
        },
        {
          title: "Copy the API credentials",
          detail: <>From WhatsApp <strong>API Setup</strong>, copy the <strong>Phone number ID</strong>. Use the temporary access token only for testing; for production, generate a system-user access token with WhatsApp messaging permissions. Store them as <code>WHATSAPP_PHONE_NUMBER_ID</code> and <code>WHATSAPP_ACCESS_TOKEN</code>.</>,
        },
        {
          title: "Create and approve the message template",
          detail: <>Create a template whose body has exactly four text variables in this order: profile, visitor name, visitor email, and inquiry. Put its exact name and language in <code>WHATSAPP_TEMPLATE_NAME</code> and <code>WHATSAPP_TEMPLATE_LANGUAGE</code>.</>,
        },
        {
          title: "Add opted-in recipients",
          detail: <>Enter every recipient in <code>WHATSAPP_ADMIN_NUMBERS</code> using international digits without <code>+</code>, separated by commas or new lines. Each person must consent to receive these alerts.</>,
        },
        {
          title: "Set the API version and redeploy",
          detail: <>Set <code>WHATSAPP_API_VERSION</code> to a supported version such as <code>v23.0</code>, redeploy, enable WhatsApp here, and submit a test inquiry.</>,
        },
      ],
      docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
    },
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
    guide: {
      lead: "Telegram can notify one private chat or a team group using a bot created with BotFather.",
      steps: [
        {
          title: "Create the bot",
          detail: <>Open <strong>@BotFather</strong> in Telegram, run <code>/newbot</code>, and follow the prompts. Copy the token into <code>TELEGRAM_BOT_TOKEN</code>.</>,
        },
        {
          title: "Prepare the destination",
          detail: <>For a private destination, message the bot once. For a team destination, add it to the group and allow it to post messages.</>,
        },
        {
          title: "Find the chat ID",
          detail: <>Call the Telegram Bot API <code>getUpdates</code> method after sending a message, then copy <code>message.chat.id</code> into <code>TELEGRAM_CHAT_ID</code>. Group IDs are usually negative.</>,
        },
        {
          title: "Redeploy and test",
          detail: <>Save the server environment variables, redeploy, enable Telegram here, and submit a test inquiry.</>,
        },
      ],
      docsUrl: "https://core.telegram.org/bots/tutorial",
    },
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
  const [guideChannel, setGuideChannel] = useState<keyof IntegrationsConfig | null>(null);
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
  const selectedGuide = CHANNELS.find(channel => channel.id === guideChannel);
  const GuideIcon = selectedGuide?.icon;

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuideChannel(channel.id)}
                  aria-label={`Show ${channel.name} credential setup instructions`}
                >
                  <CircleHelp />
                  How to get these credentials
                </Button>
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

      <Dialog open={selectedGuide != null} onOpenChange={(open) => { if (!open) setGuideChannel(null); }}>
        {selectedGuide && GuideIcon && (
          <DialogContent
            showCloseButton={false}
            className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl motion-reduce:animate-none sm:max-w-2xl"
          >
            <DialogHeader className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selectedGuide.iconClass}`}>
                  <GuideIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    Set up {selectedGuide.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-5 text-slate-600">
                    {selectedGuide.guide.lead}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setGuideChannel(null)}
                  aria-label="Close setup instructions"
                  className="-mr-1 -mt-1 text-slate-500"
                >
                  <X />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <ol className="space-y-4">
                {selectedGuide.guide.steps.map((step, index) => (
                  <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-semibold [&_strong]:font-semibold [&_strong]:text-slate-800">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-950">Keep tokens on the server</p>
                  <p className="mt-1 text-sm leading-5 text-amber-800">
                    Add these values to your hosting environment or local <code className="rounded bg-white/70 px-1 py-0.5 text-xs font-semibold">.env.local</code>. Never paste access tokens into browser-visible configuration or variables beginning with <code className="rounded bg-white/70 px-1 py-0.5 text-xs font-semibold">VITE_</code>.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <a
                href={selectedGuide.guide.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-blue-700 outline-none hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ExternalLink className="size-4" />
                Open official {selectedGuide.name} guide
              </a>
              <Button size="sm" onClick={() => setGuideChannel(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
