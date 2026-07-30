import type {
  FocusItem,
  Proposal,
  SlippingSignal,
  ViewName,
} from "./prototype-types";

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
  { id: "retainers", label: "Retainers", glyph: "↻" },
  { id: "slipping", label: "Slipping", glyph: "!" },
  { id: "people", label: "People", glyph: "◌" },
  { id: "notes", label: "Notes", glyph: "≡" },
];

export const initialSlippingSignals: SlippingSignal[] = [
  {
    id: "task-stale",
    entityType: "Task",
    title: "Draft August newsletter",
    ruleId: "SLIP-TASK-STALE",
    rule: "Open task without a due date has had no qualifying attention.",
    threshold: "14 days",
    lastAttention: "Created July 13 at 10:20 AM",
    elapsed: "17 days · 3 days past threshold",
    severity: "At risk",
    actLabel: "Schedule task",
    status: "active",
    outcome: null,
  },
  {
    id: "project-inactive",
    entityType: "Project",
    title: "Northstar brand refresh",
    ruleId: "SLIP-PROJECT-INACTIVE",
    rule: "Active project has had no task, note, or project update.",
    threshold: "7 days",
    lastAttention: "July 21 at 3:10 PM",
    elapsed: "9 days · 2 days past threshold",
    severity: "Watch",
    actLabel: "Add project note",
    status: "active",
    outcome: null,
  },
  {
    id: "project-next",
    entityType: "Project",
    title: "Studio website refresh",
    ruleId: "SLIP-PROJECT-NEXT",
    rule: "Active project has no open next action.",
    threshold: "2 days",
    lastAttention: "Last next action completed July 26",
    elapsed: "4 days · 2 days past threshold",
    severity: "At risk",
    actLabel: "Add next action",
    status: "active",
    outcome: null,
  },
  {
    id: "retainer-risk",
    entityType: "Retainer",
    title: "Acme August performance report",
    ruleId: "SLIP-RETAINER-DUE",
    rule: "Retainer deliverable is incomplete inside its due-risk window.",
    threshold: "Warn 3 days before due",
    lastAttention: "July 27 at 4:40 PM",
    elapsed: "Due August 2 · risk window open",
    severity: "Critical",
    actLabel: "Start deliverable",
    status: "active",
    outcome: null,
  },
];
