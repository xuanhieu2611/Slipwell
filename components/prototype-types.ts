export type ViewName =
  | "today"
  | "review"
  | "tasks"
  | "projects"
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
