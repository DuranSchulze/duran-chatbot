import { useEffect, useState } from "react";
import { ConversationEmailCard } from "./conversation-email-card";
import type { BehaviorConfig } from "@duran-chatbot/config";
import { BellRing, KeyRound, Send, ShieldCheck, Loader2 } from "lucide-react";

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
import { useToast } from "@/components/ui/toaster";
import {
  fetchEmailIntegration,
  saveEmailIntegration,
  sendTestEmail,
} from "@/api/emailIntegration";

type EmailPanelProps = {
  profileSlug: string;
  behavior: BehaviorConfig;
  onBehaviorChange: (behavior: BehaviorConfig) => void;
};

export function EmailPanel({ profileSlug, behavior, onBehaviorChange }: EmailPanelProps) {
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const { toast } = useToast();

  const updateBehavior = <K extends keyof BehaviorConfig>(
    key: K,
    value: BehaviorConfig[K],
  ) => {
    onBehaviorChange({ ...behavior, [key]: value });
  };

  const updateEmailList = (key: "quoteNotifyTo" | "quoteNotifyCC", raw: string) =>
    updateBehavior(
      key,
      raw
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEmailIntegration(profileSlug)
      .then((data) => {
        if (cancelled) return;
        setFromEmail(data.fromEmail ?? "");
        setFromName(data.fromName ?? "");
        setHasSecret(data.hasSecret);
        setSecret("");
      })
      .catch((err) => {
        toast({
          title: "Failed to load email settings",
          description: err instanceof Error ? err.message : undefined,
          tone: "error",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileSlug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveEmailIntegration(profileSlug, {
        secret: secret || null, // empty keeps stored key
        fromEmail: fromEmail || null,
        fromName: fromName || null,
      });
      setHasSecret(result.hasSecret);
      setSecret("");
      toast({ title: "Email settings saved", tone: "success" });
    } catch (err) {
      toast({
        title: "Failed to save email settings",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const to = (testTo || fromEmail).trim();
    if (!to) {
      toast({
        title: "Enter an address to send the test to",
        tone: "error",
      });
      return;
    }
    setTesting(true);
    try {
      await sendTestEmail(profileSlug, to);
      toast({
        title: "Test email sent",
        description: `Check the inbox at ${to}.`,
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Test email failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading email settings…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Email"
        title="Email Settings"
        description="Manage the sending provider, conversation alerts, and quote-request emails. Saving the profile config (top bar) applies the notification settings."
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

      <Card className="border-border bg-card shadow-none">
        <CardContent className="space-y-4 pt-5">
          <Field>
            <FieldLabel>
              Resend API key
              {hasSecret && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  • saved — leave blank to keep
                </span>
              )}
            </FieldLabel>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={hasSecret ? "••••••••  (unchanged)" : "re_…"}
              autoComplete="new-password"
            />
            <FieldDescription>
              Create an API key at resend.com → API Keys. If this profile has no
              key, the{" "}
              <code className="rounded bg-card px-1 py-0.5 text-xs">
                RESEND_API_KEY
              </code>{" "}
              environment variable is used instead.
            </FieldDescription>
          </Field>

          <FieldGrid>
            <Field>
              <FieldLabel>From email</FieldLabel>
              <Input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="hello@yourdomain.com"
              />
              <FieldDescription>
                Must be a sender verified in your Resend account (or use the{" "}
                <code className="rounded bg-card px-1 py-0.5 text-xs">
                  RESEND_FROM_EMAIL
                </code>{" "}
                env fallback).
              </FieldDescription>
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
            <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConversationEmailCard key={profileSlug} profileSlug={profileSlug} settings={behavior.conversationEmail} onChange={value => updateBehavior("conversationEmail", value)} />

      <Card className="border-border bg-card shadow-none">
        <CardContent className="space-y-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display flex items-center gap-2 text-sm font-medium text-foreground">
                <BellRing className="size-4 text-muted-foreground" />
                Quote request notifications
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Who gets emailed when a visitor submits a quote request from the
                chatbot. Applies when quote requests are enabled (Behavior tab).
              </p>
            </div>
            <Badge variant={behavior.enableQuoteRequest ? "success" : "secondary"}>
              {behavior.enableQuoteRequest ? "Sending" : "Quote requests off"}
            </Badge>
          </div>

          <FieldGrid>
            <Field>
              <FieldLabel htmlFor="quoteNotifyTo">Notify recipients</FieldLabel>
              <Input
                id="quoteNotifyTo"
                type="text"
                value={(behavior.quoteNotifyTo ?? []).join(", ")}
                onChange={(event) =>
                  updateEmailList("quoteNotifyTo", event.target.value)
                }
                placeholder="sales@example.com, team@example.com"
              />
              <FieldDescription>
                Comma-separated list of internal email addresses that receive
                quote requests.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="quoteNotifyCC">CC recipients (optional)</FieldLabel>
              <Input
                id="quoteNotifyCC"
                type="text"
                value={(behavior.quoteNotifyCC ?? []).join(", ")}
                onChange={(event) =>
                  updateEmailList("quoteNotifyCC", event.target.value)
                }
                placeholder="manager@example.com"
              />
            </Field>
          </FieldGrid>

          <FieldGrid>
            <Field>
              <FieldLabel htmlFor="quoteEmailSubject">Internal email subject</FieldLabel>
              <Input
                id="quoteEmailSubject"
                type="text"
                value={behavior.quoteEmailSubject ?? ""}
                onChange={(event) =>
                  updateBehavior("quoteEmailSubject", event.target.value)
                }
                placeholder="New Quote Request via Chatbot"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="quoteStarterSubject">
                Visitor starter email subject
              </FieldLabel>
              <Input
                id="quoteStarterSubject"
                type="text"
                value={behavior.quoteStarterSubject ?? ""}
                onChange={(event) =>
                  updateBehavior("quoteStarterSubject", event.target.value)
                }
                placeholder="Your request to {company}"
              />
            </Field>
          </FieldGrid>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-background shadow-none">
        <CardContent className="space-y-3 pt-5">
          <h3 className="font-display text-sm font-medium text-foreground">
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
