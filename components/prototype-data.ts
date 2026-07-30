import type { FocusItem, Proposal, ViewName } from "./prototype-types";

export const initialFocusItems: FocusItem[] = [
  {
    id: "outline-launch",
    title: "Outline launch video",
    eyebrow: "Content",
    detail: "Deep work · 90 min",
    tone: "coral",
  },
  {
    id: "northstar-review",
    title: "Review Northstar retainer",
    eyebrow: "Client",
    detail: "Cycle closes in 3 days",
    tone: "blue",
  },
];

export const defaultProposal: Proposal = {
  source:
    "Remind me Friday morning to send Sarah the Acme homepage draft.",
  cleanedText: "Send Sarah the Acme homepage draft",
  recordType: "Task",
  title: "Send Sarah the Acme homepage draft",
  date: "2026-07-31",
  project: "Acme website",
  person: "Sarah Chen",
  confidence: 88,
};

export const navigationItems: Array<{
  id: ViewName;
  label: string;
  glyph: string;
}> = [
  { id: "today", label: "Today", glyph: "⌂" },
  { id: "review", label: "Review", glyph: "◇" },
  { id: "tasks", label: "Tasks", glyph: "✓" },
  { id: "projects", label: "Projects", glyph: "▦" },
  { id: "people", label: "People", glyph: "◌" },
  { id: "notes", label: "Notes", glyph: "≡" },
];
