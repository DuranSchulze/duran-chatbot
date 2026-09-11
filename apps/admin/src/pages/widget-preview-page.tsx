import { useEffect, useRef, useState } from "react";
import type { ChatbotConfig } from "@duran-chatbot/config";
import { ExternalLink, MessageCircle, RefreshCcw, X } from "lucide-react";
import { ChatbotWidget } from "../../../../packages/widget/src/widget";
import { fetchConfig } from "@/api/config";
import { Button } from "@/components/ui/button";
import { loadPreviewConfig } from "@/lib/preview";

export function WidgetPreviewPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<ChatbotWidget | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        const previewConfig = loadPreviewConfig();
        const nextConfig = previewConfig ?? (await fetchConfig());

        if (!mounted) {
          return;
        }

        setConfig(nextConfig);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    const widget = new ChatbotWidget(config);
    widgetRef.current = widget;
    // Start with the chat window open so the open state is what renders first.
    widget.open();

    return () => {
      widgetRef.current = null;
      widget.destroy();
    };
  }, [config]);

  const handleOpenChat = () => {
    widgetRef.current?.open();
  };

  const handleCloseChat = () => {
    widgetRef.current?.close();
  };

  const handleReloadSavedConfig = async () => {
    try {
      setLoading(true);
      const savedConfig = await fetchConfig();
      setConfig(savedConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload saved config");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <div className="graphite-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Widget Preview
              </p>
              <h1 className="font-display text-2xl font-medium text-foreground">
                Floating chatbot preview
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                This page mounts the real widget so you can review the chat window with your current config.
                The chat opens automatically on load — use the launcher (or the buttons above) to check the
                closed state too.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleReloadSavedConfig}>
                <RefreshCcw className="size-4" />
                Reload saved config
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenChat}>
                <MessageCircle className="size-4" />
                Open chat
              </Button>
              <Button variant="outline" size="sm" onClick={handleCloseChat}>
                <X className="size-4" />
                Close chat
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open("/", "_self")}>
                <ExternalLink className="size-4" />
                Back to editor
              </Button>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="graphite-card relative overflow-hidden">
            <div className="absolute inset-0 bg-background bg-[size:32px_32px]" />
            <div className="relative flex min-h-[640px] flex-col justify-between p-8">
              <div className="max-w-lg space-y-4 border border-border bg-card p-6 ">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Canvas
                </p>
                <h2 className="font-display text-xl font-medium text-foreground">
                  Preview the floating experience
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  The widget is mounted on this page with your current config. The chat window is open so you
                  can review the layout and welcome message right away; hit Close chat to inspect the floating
                  launcher state.
                </p>
              </div>
            </div>
          </div>

          <aside className="graphite-card space-y-4 ">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Current state
              </p>
              <h2 className="font-display mt-2 text-lg font-medium text-foreground">
                {loading ? "Loading preview…" : config?.appearance.companyName ?? "Preview"}
              </h2>
            </div>

            {error ? (
              <div className="border border-border bg-secondary p-4 text-sm text-muted-foreground">
                {error}
              </div>
            ) : null}

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Position
                </p>
                <p className="mt-1 font-medium text-foreground">{config?.appearance.position ?? "..."}</p>
              </div>
              <div className="border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Primary color
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="block size-6 border border-border"
                    style={{ backgroundColor: config?.appearance.primaryColor ?? "#ffffff" }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    {config?.appearance.primaryColor ?? "..."}
                  </span>
                </div>
              </div>
              <div className="border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Welcome message
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-6 text-foreground">
                  {config?.appearance.welcomeMessage ?? "..."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
