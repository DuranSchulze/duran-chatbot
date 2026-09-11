import { ArrowLeft, CheckCircle2, Megaphone, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

import accomplishmentsMarkdown from "../../../../ACCOMPLISHMENTS.md?raw";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AnnouncementSection = {
  title: string;
  items: string[];
};

type AnnouncementRelease = {
  date: string;
  sections: AnnouncementSection[];
};

function plainText(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/** Read the newest dated entry from the root accomplishment log. */
function parseLatestAnnouncements(markdown: string): AnnouncementRelease | null {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => /^## \d{4}-\d{2}-\d{2}\s*$/.test(line));
  if (start < 0) return null;

  const date = lines[start].slice(3).trim();
  const sections: AnnouncementSection[] = [];
  let current: AnnouncementSection | null = null;

  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (line.startsWith("### ")) {
      current = { title: plainText(line.slice(4)), items: [] };
      sections.push(current);
      continue;
    }
    if (current && line.startsWith("- ")) current.items.push(plainText(line.slice(2)));
  }

  return { date, sections: sections.filter((section) => section.items.length > 0) };
}

function formatReleaseDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AnnouncementsPage() {
  const release = parseLatestAnnouncements(accomplishmentsMarkdown);
  const sections = release?.sections ?? [];
  const shipped = sections.filter((section) => section.title !== "Production setup still required");
  const setup = sections.find((section) => section.title === "Production setup still required");
  const improvementCount = shipped.reduce((total, section) => total + section.items.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 outline-none transition-colors hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to profiles
          </Link>
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Current release
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="relative overflow-hidden border border-slate-200 bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-2 bg-blue-500" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="mb-5 flex size-11 items-center justify-center border border-blue-400/30 bg-blue-500/15 text-blue-300">
              <Megaphone className="size-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">What’s new</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Latest Duran Chatbot updates</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              A simple record of the improvements now available across chatbot profiles, notifications, email, and the internal dashboard.
            </p>
            {release && (
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-700 pt-5 text-sm text-slate-300">
                <span>{formatReleaseDate(release.date)}</span>
                <span>{shipped.length} work areas</span>
                <span>{improvementCount} completed improvements</span>
              </div>
            )}
          </div>
        </section>

        {!release ? (
          <section className="mt-8 border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">No announcements yet</h2>
            <p className="mt-1 text-sm text-slate-500">Add a dated entry to ACCOMPLISHMENTS.md and rebuild the admin app.</p>
          </section>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="relative space-y-10 border-l-2 border-blue-100 pl-6 sm:pl-9">
              {shipped.map((section) => (
                <section key={section.title} className="relative">
                  <span className="absolute -left-[1.95rem] top-1.5 size-3 border-2 border-white bg-blue-600 sm:-left-[2.7rem]" aria-hidden="true" />
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{section.title}</h2>
                  <ul className="mt-4 space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <aside className="border border-amber-200 bg-amber-50 p-5 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 text-amber-900">
                <Rocket className="size-4" aria-hidden="true" />
                <h2 className="font-semibold">Before production</h2>
              </div>
              {setup ? (
                <ul className="mt-4 space-y-3">
                  {setup.items.map((item) => (
                    <li key={item} className="border-t border-amber-200 pt-3 text-sm leading-5 text-amber-950 first:border-0 first:pt-0">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-amber-900">No release setup has been recorded.</p>
              )}
            </aside>
          </div>
        )}

        <div className="mt-12 border-t border-slate-200 pt-6">
          <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top
          </Button>
        </div>
      </main>
    </div>
  );
}
