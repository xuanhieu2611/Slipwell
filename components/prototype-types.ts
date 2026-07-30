export type ViewName =
  | "today"
  | "review"
  | "tasks"
  | "projects"
  | "retainers"
  | "slipping"
  | "people"
  | "notes";

export type CaptureMode = "text" | "voice";

export type CaptureStage =
  | "closed"
  | "compose"
  | "recording"
  | "voice-ready"
  | "processing"
  | "proposal";

export type Proposal = {
  source: string;
  cleanedText: string;
  recordType: "Task" | "Note" | "Project update";
  title: string;
  date: string;
  project: string;
  person: string;
  confidence: number;
};

export type FocusItem = {
  id: string;
  title: string;
  eyebrow: string;
  detail: string;
  tone: "coral" | "blue" | "lime";
};

export type FiledTask = {
  id: string;
  title: string;
  date: string;
  project: string;
  person: string;
};

export type DeliverableTemplate = {
  id: string;
  name: string;
  startOffset: string;
  dueOffset: string;
};

export type RetainerDraft = {
  name: string;
  client: string;
  startsOn: string;
  templates: DeliverableTemplate[];
};

export type RolloverResolution = "carry" | "overdue" | "cancel";

export type RolloverDecisions = {
  handoff: RolloverResolution;
  call: RolloverResolution;
};

export type SignalStatus =
  | "active"
  | "resolved"
  | "snoozed"
  | "dismissed"
  | "obsolete";

export type SignalAction =
  | "act"
  | "snooze"
  | "dismiss"
  | "change-cadence"
  | "pause";

export type SlippingSignal = {
  id: string;
  entityType: "Task" | "Project" | "Retainer";
  title: string;
  ruleId: string;
  rule: string;
  threshold: string;
  lastAttention: string;
  elapsed: string;
  severity: "Watch" | "At risk" | "Critical";
  actLabel: string;
  status: SignalStatus;
  outcome: string | null;
};
