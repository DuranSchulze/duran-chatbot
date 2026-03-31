import { useEffect, useState } from "react";
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

    return () => {
      widget.destroy();
    };
  }, [config]);

  const handleOpenChat = () => {
    document.querySelector<HTMLButtonElement>(".cb-toggle-btn")?.click();
  };

  const handleCloseChat = () => {
    document.querySelector<HTMLButtonElement>(".cb-close-btn")?.click();
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
    <div className="min-h-screen bg-[linear-gradient(135deg,#e2e8f0_0%,#f8fafc_40%,#cbd5e1_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <div className="border border-slate-300 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Widget Preview
              </p>
              <h1 className="text-2xl font-semibold text-slate-950">
                Floating chatbot preview
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                This page mounts the real widget so you can inspect the floating launcher and open the chat
                window before publishing changes.
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
              <Button size="sm" onClick={() => window.open("/", "_self")}>
                <ExternalLink className="size-4" />
                Back to editor
              </Button>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative overflow-hidden border border-slate-300 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_55%,#e2e8f0_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative flex min-h-[640px] flex-col justify-between p-8">
              <div className="max-w-lg space-y-4 border border-slate-300 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Canvas
                </p>
                <h2 className="text-xl font-semibold text-slate-950">
                  Preview the floating experience
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  The widget is mounted on this page with your current config. Use the bottom corner launcher
                  to inspect the closed state, then open the chat to review the layout and welcome message.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4 border border-slate-300 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Current state
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                {loading ? "Loading preview…" : config?.appearance.companyName ?? "Preview"}
              </h2>
            </div>

            {error ? (
              <div className="border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-3 text-sm text-slate-600">
              <div className="border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Position
                </p>
                <p className="mt-1 font-medium text-slate-900">{config?.appearance.position ?? "..."}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Primary color
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="block size-6 border border-slate-300"
                    style={{ backgroundColor: config?.appearance.primaryColor ?? "#ffffff" }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-900">
                    {config?.appearance.primaryColor ?? "..."}
                  </span>
                </div>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Welcome message
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
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
