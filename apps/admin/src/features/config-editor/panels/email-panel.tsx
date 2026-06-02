import { useEffect, useState } from "react";
import { Mail, Send, ShieldCheck, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGrid,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import {
  fetchEmailIntegration,
  saveEmailIntegration,
  sendTestEmail,
  type EmailProvider,
} from "@/api/emailIntegration";

type EmailPanelProps = {
  profileSlug: string;
};

const PRESETS: Record<EmailProvider, { host: string; port: string }> = {
  gmail: { host: "", port: "" },
  brevo: { host: "smtp-relay.brevo.com", port: "587" },
  mailtrap: { host: "live.smtp.mailtrap.io", port: "587" },
  mandrill: { host: "smtp.mandrillapp.com", port: "587" },
  smtp: { host: "", port: "587" },
};

const SECRET_HINT: Record<EmailProvider, string> = {
  gmail: "Gmail App Password (not your normal password).",
  brevo: "Your Brevo SMTP key (Settings → SMTP & API).",
  mailtrap: "The password from your Mailtrap inbox SMTP credentials.",
  mandrill: "Your Mailchimp Transactional (Mandrill) API key.",
  smtp: "The SMTP password / API key for your server.",
};

export function EmailPanel({ profileSlug }: EmailPanelProps) {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<EmailProvider>("gmail");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEmailIntegration(profileSlug)
      .then((data) => {
        if (cancelled) return;
        setProvider(data.provider);
        setHost(data.host ?? "");
        setPort(data.port ? String(data.port) : "");
        setUsername(data.username ?? "");
        setFromEmail(data.fromEmail ?? "");
        setFromName(data.fromName ?? "");
        setHasSecret(data.hasSecret);
        setSecret("");
      })
      .catch((err) => {
        if (!cancelled)
          setMessage({ tone: "err", text: err instanceof Error ? err.message : "Failed to load" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileSlug]);

  const onProviderChange = (next: EmailProvider) => {
    setProvider(next);
    // Auto-fill known host/port; leave anything the admin already typed for custom.
    setHost(PRESETS[next].host);
    setPort(PRESETS[next].port);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveEmailIntegration(profileSlug, {
        provider,
        host: host || null,
        port: port ? Number(port) : null,
        username: username || null,
        secret: secret || null, // empty keeps stored key
        fromEmail: fromEmail || null,
        fromName: fromName || null,
      });
      setHasSecret(result.hasSecret);
      setSecret("");
      setMessage({ tone: "ok", text: "Email settings saved." });
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const to = (testTo || fromEmail).trim();
    if (!to) {
      setMessage({ tone: "err", text: "Enter an address to send the test to." });
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      await sendTestEmail(profileSlug, to);
      setMessage({ tone: "ok", text: `Test email sent to ${to}.` });
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const isCustomHost = provider === "smtp" || provider === "gmail";

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading email settings…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Integrations"
        title="Email Provider"
        description="Connect Brevo, Mailtrap, Mandrill, Gmail, or any SMTP server. Used for quote-request emails. Your key is encrypted before it's stored."
        action={
          hasSecret ? (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="size-3" />
              Key saved
            </Badge>
          ) : (
            <Badge variant="secondary">Not configured</Badge>
          )
        }
      />

      {message && (
        <div
          className={
            message.tone === "ok"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
              : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
          }
        >
          {message.text}
        </div>
      )}

      <Card className="border-slate-200 bg-white shadow-none">
        <CardContent className="space-y-4 pt-5">
          <FieldGrid>
            <Field>
              <FieldLabel>Provider</FieldLabel>
              <Select
                value={provider}
                onChange={(e) => onProviderChange(e.target.value as EmailProvider)}
              >
                <option value="gmail">Gmail</option>
                <option value="brevo">Brevo</option>
                <option value="mailtrap">Mailtrap</option>
                <option value="mandrill">Mailchimp / Mandrill</option>
                <option value="smtp">Custom SMTP</option>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                {provider === "gmail" ? "Gmail address" : "SMTP username / login"}
              </FieldLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={provider === "gmail" ? "you@gmail.com" : "login"}
                autoComplete="off"
              />
            </Field>
          </FieldGrid>

          {!isCustomHost ? null : provider === "smtp" ? (
            <FieldGrid>
              <Field>
                <FieldLabel>SMTP host</FieldLabel>
                <Input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.example.com"
                />
              </Field>
              <Field>
                <FieldLabel>Port</FieldLabel>
                <Input
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="587"
                  inputMode="numeric"
                />
              </Field>
            </FieldGrid>
          ) : null}

          {provider !== "gmail" && provider !== "smtp" && (
            <FieldDescription>
              Sending via <strong>{host}</strong>:{port}. (Auto-configured for{" "}
              {provider}.)
            </FieldDescription>
          )}

          <Field>
            <FieldLabel>
              API key / password
              {hasSecret && (
                <span className="ml-2 text-xs font-normal text-emerald-600">
                  • saved — leave blank to keep
                </span>
              )}
            </FieldLabel>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={hasSecret ? "••••••••  (unchanged)" : "Paste your key"}
              autoComplete="new-password"
            />
            <FieldDescription>{SECRET_HINT[provider]}</FieldDescription>
          </Field>

          <FieldGrid>
            <Field>
              <FieldLabel>From email</FieldLabel>
              <Input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="hello@yourcompany.com"
              />
            </Field>
            <Field>
              <FieldLabel>From name</FieldLabel>
              <Input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Company"
              />
            </Field>
          </FieldGrid>

          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-slate-50/70 shadow-none">
        <CardContent className="space-y-3 pt-5">
          <h3 className="text-base font-semibold text-slate-900">
            Send a test email
          </h3>
          <FieldDescription>
            Verify your credentials by sending a test message. Save your settings
            first.
          </FieldDescription>
          <div className="flex items-end gap-2">
            <Field className="flex-1">
              <FieldLabel>Send to</FieldLabel>
              <Input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder={fromEmail || "you@example.com"}
              />
            </Field>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
              className="gap-2"
            >
              {testing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
