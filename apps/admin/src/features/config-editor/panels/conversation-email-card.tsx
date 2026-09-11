import { useEffect, useState } from "react";
import { conversationEmailRecipientError, normalizeConversationEmail, type ConversationEmailConfig } from "@duran-chatbot/config";
import { Mail } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGrid, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Status = {
  readiness: { enabled: boolean; configured: boolean; missing: string[] };
  counts: { status: string; count: number }[];
  lastFailure: { lastError: string; updatedAt: string } | null;
};

export function ConversationEmailCard({ profileSlug, settings, onChange }: {
  profileSlug: string; settings: ConversationEmailConfig; onChange: (value: ConversationEmailConfig) => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState("");
  const url = `/api/notification-status?channel=email&profile=${encodeURIComponent(profileSlug)}`;
  const recipientError = conversationEmailRecipientError(normalizeConversationEmail(settings));

  useEffect(() => {
    const controller = new AbortController();
    const read = async () => {
      try {
        const response = await fetch(url, { headers: getAuthHeaders(), signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 401 ? "Sign in again to view email delivery status." : "Unable to load delivery status. Try Refresh status.");
        const data = await response.json() as Status;
        if (!controller.signal.aborted) { setStatus(data); setError(""); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load delivery status.");
      }
    };
    void read();
    const timer = setInterval(() => void read(), 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [url, refresh]);

  async function retry() {
    setBusy(true); setResult("");
    try {
      const response = await fetch(url, { method: "POST", headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Unable to queue retries. Check your login and try again.");
      const data = await response.json() as { queued: number };
      setResult(`${data.queued} failed email alerts queued. The worker will retry them shortly.`);
      setRefresh(value => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Retry failed."); }
    finally { setBusy(false); }
  }

  const count = (name: string) => status?.counts.find(row => row.status === name)?.count ?? 0;
  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="conversation-email-title" className="flex items-center gap-2 text-base font-semibold text-slate-900"><Mail className="size-4 text-slate-400" />Conversation email alerts</h3>
            <p className="mt-1 text-sm text-slate-500">Notify your internal team whenever a visitor sends a message. Separate from quote-request emails.</p>
          </div>
          <Switch aria-labelledby="conversation-email-title" checked={settings.enabled} onCheckedChange={enabled => onChange({ ...settings, enabled })} />
        </div>
        <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">One email per visitor message, containing visitor messages only—no chatbot or admin replies. “View conversation” opens the full internal chat and requires admin login.</p>
        <FieldGrid>
          <Field>
            <FieldLabel htmlFor="conversation-email-to">Notify recipients</FieldLabel>
            <Input id="conversation-email-to" value={settings.to.join(",")} onChange={event => onChange({ ...settings, to: event.target.value.split(",") })} placeholder="sales@example.com, team@example.com" aria-describedby="conversation-email-recipients-help" />
            <FieldDescription id="conversation-email-recipients-help">Internal addresses, separated by commas. Maximum 20 across To and CC. Receiving an email does not grant dashboard access.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="conversation-email-cc">CC recipients (optional)</FieldLabel>
            <Input id="conversation-email-cc" value={settings.cc.join(",")} onChange={event => onChange({ ...settings, cc: event.target.value.split(",") })} placeholder="manager@example.com" />
          </Field>
        </FieldGrid>
        <Field>
          <FieldLabel htmlFor="conversation-email-subject">Email subject (optional)</FieldLabel>
          <Input id="conversation-email-subject" maxLength={160} value={settings.subject} onChange={event => onChange({ ...settings, subject: event.target.value })} placeholder="New chatbot conversation message" />
          <FieldDescription>Uses the Resend key and verified sender above. Save the profile in the top bar to apply these alert settings.</FieldDescription>
        </Field>
        {settings.enabled && recipientError && <p role="alert" className="text-sm text-amber-800">{recipientError}. Alerts cannot send until this is corrected and saved.</p>}
        <div className="space-y-3 border-t border-slate-200 pt-4" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">Saved configuration &amp; delivery status</span>
            <Badge variant={status?.readiness.enabled && status.readiness.configured ? "success" : "secondary"}>{!status ? "Loading…" : !status.readiness.enabled ? "Off" : status.readiness.configured ? "Ready" : "Setup needed"}</Badge>
          </div>
          {status && !status.readiness.configured && <p className="text-sm text-slate-600">Setup needed: {status.readiness.missing.join("; ")}. Ask your developer to set ADMIN_APP_URL to this dashboard’s origin if it is missing.</p>}
          {status && <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">{["pending", "sending", "accepted", "failed", "cancelled"].map(name => <div key={name}><dt className="text-xs capitalize text-slate-500">{name}</dt><dd className="text-lg font-semibold tabular-nums text-slate-900">{count(name)}</dd></div>)}</dl>}
          <p className="text-xs text-slate-500">Accepted means Resend accepted the email, not confirmed inbox delivery. Status refreshes every 30 seconds.</p>
          {status?.lastFailure && <p className="text-sm text-amber-800">Last failure: {status.lastFailure.lastError} · {new Date(status.lastFailure.updatedAt).toLocaleString()}</p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {result && <p className="text-sm text-emerald-700">{result}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Refresh status</Button>
            {count("failed") > 0 && <Button variant="outline" disabled={busy || !status?.readiness.enabled || !status.readiness.configured} onClick={() => void retry()}>{busy ? "Queuing…" : "Retry failed emails"}</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
