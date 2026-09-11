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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4"
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

      <main className="page-container">
        <section className="graphite-card relative overflow-hidden">
          <div className="relative max-w-2xl">
            <div className="mb-5 flex size-11 items-center justify-center border border-border bg-secondary text-muted-foreground">
              <Megaphone className="size-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">What’s new</p>
            <h1 className="font-display mt-2 page-heading">Latest Duran Chatbot updates</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-foreground sm:text-base">
              A simple record of the improvements now available across chatbot profiles, notifications, email, and the internal dashboard.
            </p>
            {release && (
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-sm text-foreground">
                <span>{formatReleaseDate(release.date)}</span>
                <span>{shipped.length} work areas</span>
                <span>{improvementCount} completed improvements</span>
              </div>
            )}
          </div>
        </section>

        {!release ? (
          <section className="mt-8 border border-border bg-card p-6">
            <h2 className="font-display font-medium">No announcements yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add a dated entry to ACCOMPLISHMENTS.md and rebuild the admin app.</p>
          </section>
        ) : (
          <div className="mt-[72px] grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="relative space-y-10 border-l-2 border-border pl-6 sm:pl-9">
              {shipped.map((section) => (
                <section key={section.title} className="relative">
                  <span className="absolute -left-[1.95rem] top-1.5 size-3 border-2 border-border bg-secondary sm:-left-[2.7rem]" aria-hidden="true" />
                  <h2 className="font-display text-lg font-medium tracking-[0.015em] text-foreground">{section.title}</h2>
                  <ul className="mt-4 space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <aside className="graphite-card lg:sticky lg:top-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Rocket className="size-4" aria-hidden="true" />
                <h2 className="font-display font-medium">Before production</h2>
              </div>
              {setup ? (
                <ul className="mt-4 space-y-3">
                  {setup.items.map((item) => (
                    <li key={item} className="border-t border-border pt-3 text-sm leading-5 text-muted-foreground first:border-0 first:pt-0">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No release setup has been recorded.</p>
              )}
            </aside>
          </div>
        )}

        <div className="mt-12 border-t border-border pt-6">
          <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top
          </Button>
        </div>
      </main>
    </div>
  );
}
