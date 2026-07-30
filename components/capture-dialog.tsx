"use client";

import { Icon } from "./icon";
import type {
  CaptureMode,
  CaptureStage,
  Proposal,
} from "./prototype-types";

type CaptureDialogProps = {
  stage: CaptureStage;
  mode: CaptureMode;
  text: string;
  proposal: Proposal;
  onClose: () => void;
  onModeChange: (mode: CaptureMode) => void;
  onTextChange: (text: string) => void;
  onStartRecording: () => void;
  onFinishRecording: () => void;
  onProcess: () => void;
  onProposalChange: (proposal: Proposal) => void;
  onAccept: () => void;
};

const waveform = [
  12, 24, 17, 38, 28, 45, 18, 31, 48, 23, 36, 18, 41, 29, 16, 34, 21, 42,
  27, 14, 32, 19, 39, 25,
];

function DialogHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-7 sm:py-5">
      <div>
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h2 id="capture-dialog-title" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.025em] sm:text-2xl">
          {title}
        </h2>
      </div>
      <button type="button" onClick={onClose} className="icon-button" aria-label="Close capture">
        <Icon name="close" size={19} />
      </button>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full rounded-full bg-[var(--lime-deep)]"
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs font-black text-[var(--lime-deep)]">
        {confidence}% confident
      </span>
    </div>
  );
}

function ProposalEditor({
  proposal,
  onProposalChange,
  onAccept,
  onClose,
}: Pick<
  CaptureDialogProps,
  "proposal" | "onProposalChange" | "onAccept" | "onClose"
>) {
  const update = <Key extends keyof Proposal>(key: Key, value: Proposal[Key]) => {
    onProposalChange({ ...proposal, [key]: value });
  };

  return (
    <>
      <DialogHeader
        eyebrow="AI proposal · Nothing filed yet"
        title="Does this look right?"
        onClose={onClose}
      />
      <div className="max-h-[min(74vh,760px)] overflow-y-auto">
        <div className="grid border-b border-[var(--line)] md:grid-cols-2">
          <div className="border-b border-[var(--line)] bg-[var(--canvas)] p-5 md:border-b-0 md:border-r sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-label">Your original</p>
              <span className="status-pill bg-white text-[var(--muted)]">Preserved</span>
            </div>
            <blockquote className="font-[family-name:var(--font-display)] text-lg leading-7 tracking-[-0.015em]">
              “{proposal.source}”
            </blockquote>
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="section-label">Cleaned up</p>
              <ConfidenceMeter confidence={proposal.confidence} />
            </div>
            <p className="text-lg font-semibold leading-7 tracking-[-0.015em]">
              {proposal.cleanedText}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start gap-3 rounded-[18px] border border-[var(--coral)] bg-[var(--coral-soft)] p-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--coral)] text-xs font-black text-white">
              !
            </span>
            <div>
              <p className="text-sm font-bold">Which Sarah did you mean?</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Slipwell found two people. We selected Sarah Chen from the Acme project for your review.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Destination
              <span className="select-wrap">
                <select
                  aria-label="Destination"
                  value={proposal.recordType}
                  onChange={(event) =>
                    update("recordType", event.target.value as Proposal["recordType"])
                  }
                  className="field-control"
                >
                  <option>Task</option>
                  <option>Note</option>
                  <option>Project update</option>
                </select>
                <Icon name="chevron" size={15} />
              </span>
            </label>

            <label className="field-label">
              Date
              <input
                aria-label="Date"
                type="date"
                value={proposal.date}
                onChange={(event) => update("date", event.target.value)}
                className="field-control"
              />
            </label>

            <label className="field-label">
              Project
              <span className="select-wrap">
                <select
                  aria-label="Project"
                  value={proposal.project}
                  onChange={(event) => update("project", event.target.value)}
                  className="field-control"
                >
                  <option>Acme website</option>
                  <option>Acme monthly marketing</option>
                  <option>Launch video</option>
                  <option>No project</option>
                </select>
                <Icon name="chevron" size={15} />
              </span>
            </label>

            <label className="field-label">
              Person
              <span className="select-wrap">
                <select
                  aria-label="Person"
                  value={proposal.person}
                  onChange={(event) => update("person", event.target.value)}
                  className="field-control border-[var(--coral)]"
                >
                  <option>Sarah Chen</option>
                  <option>Sarah Martinez</option>
                  <option>No person</option>
                </select>
                <Icon name="chevron" size={15} />
              </span>
            </label>
          </div>

          <label className="field-label mt-4">
            Task title
            <input
              aria-label="Task title"
              value={proposal.title}
              onChange={(event) => update("title", event.target.value)}
              className="field-control"
            />
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[var(--muted)]">
              Accepting creates one record and keeps a link to this source.
            </p>
            <button type="button" onClick={onAccept} className="primary-button justify-center">
              <Icon name="check" size={17} />
              Accept &amp; file
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function CaptureDialog({
  stage,
  mode,
  text,
  proposal,
  onClose,
  onModeChange,
  onTextChange,
  onStartRecording,
  onFinishRecording,
  onProcess,
  onProposalChange,
  onAccept,
}: CaptureDialogProps) {
  if (stage === "closed") {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(23,24,20,0.44)] p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-dialog-title"
        className="max-h-[96vh] w-full overflow-hidden rounded-t-[28px] bg-[var(--paper)] shadow-[0_24px_90px_rgba(20,22,17,0.3)] sm:max-w-[760px] sm:rounded-[28px]"
      >
        {stage === "proposal" ? (
          <ProposalEditor
            proposal={proposal}
            onProposalChange={onProposalChange}
            onAccept={onAccept}
            onClose={onClose}
          />
        ) : (
          <>
            <DialogHeader
              eyebrow="Quick capture"
              title={
                stage === "processing"
                  ? "Making sense of it"
                  : "Capture first. Sort it later."
              }
              onClose={onClose}
            />

            {stage === "processing" ? (
              <div className="grid min-h-[350px] place-items-center px-6 py-12 text-center">
                <div>
                  <span className="processing-orbit mx-auto mb-7 grid size-20 place-items-center rounded-full bg-[var(--ink)] text-[var(--lime)]">
                    <Icon name="spark" size={27} />
                  </span>
                  <p className="text-lg font-bold">Preparing a proposal…</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
                    Separating your original from cleaned text, dates, and likely context.
                  </p>
                  <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--canvas)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                    <span className="size-1.5 rounded-full bg-[var(--coral)]" />
                    Prototype state · Not stored
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-[var(--line)] px-5 pt-5 sm:px-7">
                  <div className="inline-flex rounded-full bg-[var(--canvas)] p-1" role="tablist" aria-label="Capture method">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "text"}
                      onClick={() => onModeChange("text")}
                      className={`capture-tab ${mode === "text" ? "capture-tab-active" : ""}`}
                    >
                      Type
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "voice"}
                      onClick={() => onModeChange("voice")}
                      className={`capture-tab ${mode === "voice" ? "capture-tab-active" : ""}`}
                    >
                      <Icon name="mic" size={14} />
                      Voice
                    </button>
                  </div>
                </div>

                {mode === "text" ? (
                  <div className="p-5 sm:p-7">
                    <label htmlFor="capture-text" className="sr-only">
                      What do you want to capture?
                    </label>
                    <textarea
                      id="capture-text"
                      autoFocus
                      value={text}
                      onChange={(event) => onTextChange(event.target.value)}
                      placeholder="Try: Remind me Friday morning to send Sarah the Acme homepage draft."
                      className="min-h-48 w-full resize-none bg-transparent font-[family-name:var(--font-display)] text-xl leading-8 tracking-[-0.02em] outline-none placeholder:text-[var(--muted-light)] sm:text-2xl sm:leading-9"
                    />
                    <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-[var(--muted)]">
                        No destination needed. You’ll review before filing.
                      </p>
                      <button
                        type="button"
                        disabled={!text.trim()}
                        onClick={onProcess}
                        className="primary-button justify-center disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Create proposal
                        <Icon name="arrow" size={17} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-7">
                    <div className="grid min-h-52 place-items-center rounded-[24px] border border-[var(--line)] bg-[var(--canvas)] px-5 py-8 text-center">
                      {stage === "recording" ? (
                        <div className="w-full">
                          <div className="mb-6 flex h-14 items-center justify-center gap-1" aria-label="Simulated audio waveform">
                            {waveform.map((height, index) => (
                              <span
                                key={`${height}-${index}`}
                                className="wave-bar w-1 rounded-full bg-[var(--coral)]"
                                style={{ height }}
                              />
                            ))}
                          </div>
                          <p className="font-mono text-2xl font-bold tabular-nums">00:12</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--coral-deep)]">
                            Simulated recording
                          </p>
                          <button
                            type="button"
                            onClick={onFinishRecording}
                            className="mx-auto mt-6 flex size-14 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow-lg"
                            aria-label="Finish recording"
                          >
                            <span className="size-4 rounded-sm bg-white" />
                          </button>
                        </div>
                      ) : stage === "voice-ready" ? (
                        <div>
                          <span className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[var(--lime)] text-[var(--ink)]">
                            <Icon name="check" size={25} />
                          </span>
                          <p className="text-lg font-bold">Voice capture ready</p>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            12 seconds · Simulated browser audio
                          </p>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            autoFocus
                            onClick={onStartRecording}
                            className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--coral)] text-white shadow-[0_14px_40px_rgba(235,101,72,0.28)] transition hover:scale-105"
                            aria-label="Start simulated recording"
                          >
                            <Icon name="mic" size={28} />
                          </button>
                          <p className="mt-5 text-lg font-bold">Tap to speak</p>
                          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                            This prototype simulates browser microphone capture.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-[var(--muted)]">
                        Original audio and transcript stay distinguishable.
                      </p>
                      {stage === "voice-ready" ? (
                        <button type="button" onClick={onProcess} className="primary-button justify-center">
                          Create proposal
                          <Icon name="arrow" size={17} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
