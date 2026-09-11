import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * App-wide toast notifications so every action (saves, copies, sends, errors)
 * gives visible feedback. Self-contained — no external toast dependency.
 *
 * Usage: wrap the app in <ToastProvider> (which renders <Toaster />) and call
 * const toast = useToast() anywhere below it.
 */

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms. Errors default to longer than successes. */
  duration?: number;
}

interface ToastRecord extends Required<Pick<ToastInput, "title" | "tone">> {
  id: number;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TONE_STYLES: Record<ToastTone, { accent: string; icon: ReactNode }> = {
  success: {
    accent: "border-l-border",
    icon: <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />,
  },
  error: {
    accent: "border-l-border",
    icon: <AlertCircle className="size-4 shrink-0 text-muted-foreground" />,
  },
  info: {
    accent: "border-l-border",
    icon: <Info className="size-4 shrink-0 text-muted-foreground" />,
  },
};

function ToastItem({
  record,
  onDismiss,
}: {
  record: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => onDismiss(record.id), record.duration);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [record.id, record.duration, onDismiss]);

  const tone = TONE_STYLES[record.tone];

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-border border-l-[3px] bg-card px-4 py-3  transition-all duration-200",
        tone.accent,
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <span className="mt-0.5">{tone.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{record.title}</p>
        {record.description ? (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground break-words">
            {record.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(record.id)}
        className="flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-card hover:text-muted-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const tone = input.tone ?? "info";
    const id = nextId.current++;
    setToasts((prev) => [
      ...prev.slice(-4), // keep the stack small — old ones drop off
      {
        id,
        title: input.title,
        description: input.description,
        tone,
        duration: input.duration ?? (tone === "error" ? 7000 : 4500),
      },
    ]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Fixed overlay: pointer-events none on the container so only the
          toast cards themselves intercept clicks. */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((record) => (
          <ToastItem key={record.id} record={record} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
