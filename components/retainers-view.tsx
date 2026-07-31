"use client";

import { useState } from "react";
import { Icon } from "./icon";
import type {
  DeliverableTemplate,
  RetainerDraft,
  RolloverDecisions,
  RolloverResolution,
} from "./prototype-types";

type RetainersViewProps = {
  retainer: RetainerDraft | null;
  rolloverDecisions: RolloverDecisions | null;
  onCreate: (retainer: RetainerDraft) => void;
  onApplyRollover: (decisions: RolloverDecisions) => void;
  onUpdateTemplates: (templates: DeliverableTemplate[]) => void;
};

type PendingRolloverResolution = "" | RolloverResolution;

const initialTemplates: DeliverableTemplate[] = [
  {
    id: "performance-report",
    name: "Monthly performance report",
    startOffset: "Day 20",
    dueOffset: "Day 28",
  },
  {
    id: "content-calendar",
    name: "Next month content calendar",
    startOffset: "Day 15",
    dueOffset: "Day 25",
  },
];

const unfinishedDeliverables: Array<{
  id: keyof RolloverDecisions;
  title: string;
  detail: string;
}> = [
  {
    id: "handoff",
    title: "July campaign handoff",
    detail: "Incomplete · Due July 29",
  },
  {
    id: "call",
    title: "July strategy call",
    detail: "Incomplete · Due July 30",
  },
];

const cycleStartFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const cycleMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthNameFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});

/**
 * Cycle boundaries are computed on the UTC civil date rather than by adding
 * days, so a 31-day month followed by a 30-day month still lands on the first.
 */
function addMonths(isoDate: string, months: number) {
  const base = new Date(`${isoDate}T00:00:00Z`);
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1),
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "neutral" | "complete" | "warning" | "carry";
}) {
  const toneClass = {
    neutral: "bg-[var(--canvas)] text-[var(--muted)]",
    complete: "bg-[var(--lime-soft)] text-[var(--lime-deep)]",
    warning: "bg-[var(--coral-soft)] text-[var(--coral-deep)]",
    carry: "bg-[var(--blue-soft)] text-[var(--blue)]",
  }[tone];

  return <span className={`status-pill ${toneClass}`}>{children}</span>;
}

function RetainerCreationForm({
  onCreate,
}: {
  onCreate: (retainer: RetainerDraft) => void;
}) {
  const [name, setName] = useState("Acme monthly marketing");
  const [client, setClient] = useState("Acme");
  const [startsOn, setStartsOn] = useState("2026-08-01");
  const [templates, setTemplates] =
    useState<DeliverableTemplate[]>(initialTemplates);

  const updateTemplate = (
    id: string,
    field: keyof Omit<DeliverableTemplate, "id">,
    value: string,
  ) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id ? { ...template, [field]: value } : template,
      ),
    );
  };

  const addTemplate = () => {
    setTemplates((current) => [
      ...current,
      {
        id: `template-${current.length + 1}`,
        name: "",
        startOffset: "Day 1",
        dueOffset: "Day 7",
      },
    ]);
  };

  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 px-4 pb-32 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-9"
    >
      <div className="mx-auto max-w-[920px]">
        <header className="mb-7 lg:mb-10">
          <p className="eyebrow mb-2">Recurring client work</p>
          <h1 className="display-title">Create a retainer.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Set the monthly promise once. Slipwell will create each cycle from
            these templates without rewriting its history.
          </p>
        </header>

        <form
          className="paper-card overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate({
              name,
              client,
              startsOn,
              templates,
              currentCycleDeliverables: templates,
            });
          }}
        >
          <div className="grid gap-4 border-b border-[var(--line)] p-5 sm:grid-cols-3 sm:p-7">
            <label className="field-label">
              Retainer name
              <input
                aria-label="Retainer name"
                className="field-control"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="field-label">
              Client
              <input
                aria-label="Client"
                className="field-control"
                value={client}
                onChange={(event) => setClient(event.target.value)}
                required
              />
            </label>
            <label className="field-label">
              First cycle
              <input
                aria-label="First cycle"
                className="field-control"
                type="date"
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                required
              />
            </label>
          </div>

          <section className="p-5 sm:p-7" aria-labelledby="templates-heading">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-1">Monthly cadence</p>
                <h2 id="templates-heading" className="text-lg font-bold">
                  Deliverable templates
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Start and due offsets repeat each month. Template edits only
                  affect future cycles.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button shrink-0"
                onClick={addTemplate}
              >
                <Icon name="plus" size={15} />
                Add template
              </button>
            </div>

            <div className="space-y-3">
              {templates.map((template, index) => (
                <div
                  className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--canvas)] p-4 sm:grid-cols-[minmax(0,1fr)_130px_130px]"
                  key={template.id}
                >
                  <label className="field-label">
                    Deliverable {index + 1}
                    <input
                      aria-label={`Deliverable ${index + 1} name`}
                      className="field-control"
                      value={template.name}
                      onChange={(event) =>
                        updateTemplate(template.id, "name", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label className="field-label">
                    Expected start
                    <input
                      aria-label={`Deliverable ${index + 1} expected start`}
                      className="field-control"
                      value={template.startOffset}
                      onChange={(event) =>
                        updateTemplate(
                          template.id,
                          "startOffset",
                          event.target.value,
                        )
                      }
                      required
                    />
                  </label>
                  <label className="field-label">
                    Due
                    <input
                      aria-label={`Deliverable ${index + 1} due`}
                      className="field-control"
                      value={template.dueOffset}
                      onChange={(event) =>
                        updateTemplate(
                          template.id,
                          "dueOffset",
                          event.target.value,
                        )
                      }
                      required
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t border-[var(--line)] bg-[var(--canvas)] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="max-w-lg text-xs leading-5 text-[var(--muted)]">
              Prototype only: this demonstrates the interaction and does not
              persist client data.
            </p>
            <button type="submit" className="primary-button justify-center">
              Create monthly retainer
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function NextCyclePanel({
  retainer,
  nextCycleLabel,
  nextCycleOpensOn,
}: {
  retainer: RetainerDraft;
  nextCycleLabel: string;
  nextCycleOpensOn: string;
}) {
  return (
    <section
      className="paper-card mb-5 overflow-hidden"
      aria-labelledby="next-cycle-heading"
    >
      <div className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <p className="eyebrow mb-1">What happens next</p>
        <h2 id="next-cycle-heading" className="section-title">
          On {nextCycleOpensOn}, Slipwell opens the {nextCycleLabel} cycle
        </h2>
      </div>
      <div className="px-5 py-5 sm:px-6">
        <p className="text-sm leading-6">
          It will create {retainer.templates.length}{" "}
          {retainer.templates.length === 1 ? "deliverable" : "deliverables"}{" "}
          from your templates, then track each one until it is finished:
        </p>
        <ul className="mt-3 space-y-2">
          {retainer.templates.map((template) => (
            <li
              className="flex flex-col gap-1 rounded-[16px] bg-[var(--canvas)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              key={template.id}
            >
              <span className="font-semibold">{template.name}</span>
              <span className="text-xs text-[var(--muted)]">
                Starts {template.startOffset} · Due {template.dueOffset}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Each cycle is generated exactly once. Opening Slipwell twice that
          morning, a retry, or a failed sync will not produce a second copy.
        </p>

        <div className="mt-4 rounded-[18px] border border-[var(--blue)] bg-[var(--blue-soft)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--blue)]">
            Not a monthly reminder
          </p>
          <p className="mt-2 text-sm leading-6">
            A reminder notifies you on a date and then forgets. A retainer cycle
            creates the actual deliverables, knows which are still open, warns
            you before one is at risk, and will not let the month close until
            every unfinished item has an explicit decision.
          </p>
        </div>
      </div>
    </section>
  );
}

function TemplateEditor({
  templates,
  currentCycleLabel,
  nextCycleLabel,
  onSave,
}: {
  templates: DeliverableTemplate[];
  currentCycleLabel: string;
  nextCycleLabel: string;
  onSave: (templates: DeliverableTemplate[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(templates);
  const [savedAt, setSavedAt] = useState(0);

  const updateDraft = (
    id: string,
    field: keyof Omit<DeliverableTemplate, "id">,
    value: string,
  ) => {
    setDraft((current) =>
      current.map((template) =>
        template.id === id ? { ...template, [field]: value } : template,
      ),
    );
  };

  return (
    <section
      className="paper-card mb-5 overflow-hidden"
      aria-labelledby="template-summary-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <div>
          <p className="eyebrow mb-1">Applies to future cycles</p>
          <h2 id="template-summary-heading" className="section-title">
            Monthly deliverable templates
          </h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setDraft(templates);
            setIsEditing((current) => !current);
          }}
        >
          {isEditing ? "Cancel" : "Edit templates"}
        </button>
      </div>

      {isEditing ? (
        <form
          className="space-y-3 p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
            setIsEditing(false);
            setSavedAt((current) => current + 1);
          }}
        >
          {draft.map((template, index) => (
            <div
              className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--canvas)] p-4 sm:grid-cols-[minmax(0,1fr)_130px_130px]"
              key={template.id}
            >
              <label className="field-label">
                Deliverable {index + 1}
                <input
                  aria-label={`Edit deliverable ${index + 1} name`}
                  className="field-control"
                  value={template.name}
                  onChange={(event) =>
                    updateDraft(template.id, "name", event.target.value)
                  }
                  required
                />
              </label>
              <label className="field-label">
                Expected start
                <input
                  aria-label={`Edit deliverable ${index + 1} expected start`}
                  className="field-control"
                  value={template.startOffset}
                  onChange={(event) =>
                    updateDraft(template.id, "startOffset", event.target.value)
                  }
                  required
                />
              </label>
              <label className="field-label">
                Due
                <input
                  aria-label={`Edit deliverable ${index + 1} due`}
                  className="field-control"
                  value={template.dueOffset}
                  onChange={(event) =>
                    updateDraft(template.id, "dueOffset", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          ))}
          <p className="text-xs leading-5 text-[var(--muted)]">
            Saving changes {nextCycleLabel} onward. {currentCycleLabel} has
            already been generated and closed cycles are history; neither will
            change.
          </p>
          <button type="submit" className="primary-button">
            Save for future cycles
            <Icon name="arrow" size={16} />
          </button>
        </form>
      ) : (
        <>
          <ul className="divide-y divide-[var(--line)]">
            {templates.map((template) => (
              <li
                className="flex flex-col gap-2 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"
                key={template.id}
              >
                <span className="font-semibold">{template.name}</span>
                <span className="text-xs text-[var(--muted)]">
                  Start {template.startOffset} · Due {template.dueOffset}
                </span>
              </li>
            ))}
          </ul>
          {savedAt > 0 ? (
            <p
              className="border-t border-[var(--line)] bg-[var(--lime-soft)] px-5 py-4 text-sm leading-6 text-[var(--lime-deep)] sm:px-6"
              role="status"
            >
              Templates saved. {nextCycleLabel} and every later cycle will use
              them. {currentCycleLabel} was already generated and earlier cycles
              are history, so neither changed.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function DeliverableRow({
  title,
  detail,
  status,
  tone,
}: {
  title: string;
  detail: string;
  status: string;
  tone: "neutral" | "complete" | "warning" | "carry";
}) {
  return (
    <li className="flex flex-col gap-3 border-t border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
      </div>
      <StatusPill tone={tone}>{status}</StatusPill>
    </li>
  );
}

function RolloverReview({
  onApply,
}: {
  onApply: (decisions: RolloverDecisions) => void;
}) {
  const [resolutions, setResolutions] = useState<
    Record<keyof RolloverDecisions, PendingRolloverResolution>
  >({
    handoff: "",
    call: "",
  });
  const allResolved = Object.values(resolutions).every(Boolean);

  const updateResolution = (
    id: keyof RolloverDecisions,
    value: PendingRolloverResolution,
  ) => {
    setResolutions((current) => ({ ...current, [id]: value }));
  };

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-[var(--ink)] bg-[var(--ink)] text-white"
      aria-labelledby="rollover-heading"
    >
      <div className="p-5 sm:p-6">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--lime)]">
          July cycle · Closing
        </p>
        <h2 id="rollover-heading" className="text-xl font-bold">
          Resolve every unfinished item
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
          Nothing disappears at rollover. Choose what happens to each July
          deliverable before the cycle can close.
        </p>
      </div>

      <div className="space-y-px bg-white/10">
        {unfinishedDeliverables.map((item) => (
          <div
            className="grid gap-3 bg-[var(--ink)] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_230px] sm:items-center sm:px-6"
            key={item.id}
          >
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-white/55">{item.detail}</p>
            </div>
            <label className="field-label text-white/60">
              Resolution
              <select
                aria-label={`Resolution for ${item.title}`}
                className="field-control border-white/15 bg-white/10 text-white"
                value={resolutions[item.id]}
                onChange={(event) =>
                  updateResolution(
                    item.id,
                    event.target.value as PendingRolloverResolution,
                  )
                }
              >
                <option value="" className="text-[var(--ink)]">
                  Choose explicitly…
                </option>
                <option value="carry" className="text-[var(--ink)]">
                  Carry forward as linked copy
                </option>
                <option value="overdue" className="text-[var(--ink)]">
                  Keep overdue in July
                </option>
                <option value="cancel" className="text-[var(--ink)]">
                  Cancel with history
                </option>
              </select>
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-white/55">
          {allResolved
            ? "All unfinished work has an explicit destination."
            : "The cycle cannot close while a resolution is missing."}
        </p>
        <button
          type="button"
          disabled={!allResolved}
          onClick={() => {
            if (!resolutions.handoff || !resolutions.call) {
              return;
            }
            onApply({
              handoff: resolutions.handoff,
              call: resolutions.call,
            });
          }}
          className="rounded-full bg-[var(--lime)] px-5 py-3 text-xs font-black text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Close July &amp; apply rollover
        </button>
      </div>
    </section>
  );
}

function RetainerDetail({
  retainer,
  rolloverDecisions,
  onApplyRollover,
  onUpdateTemplates,
}: {
  retainer: RetainerDraft;
  rolloverDecisions: RolloverDecisions | null;
  onApplyRollover: (decisions: RolloverDecisions) => void;
  onUpdateTemplates: (templates: DeliverableTemplate[]) => void;
}) {
  const carryovers = rolloverDecisions
    ? Object.values(rolloverDecisions).filter(
        (resolution) => resolution === "carry",
      ).length
    : 0;
  const startsOn = cycleStartFormatter.format(
    new Date(`${retainer.startsOn}T00:00:00Z`),
  );
  const currentCycleStart = addMonths(retainer.startsOn, 0);
  const nextCycleStart = addMonths(retainer.startsOn, 1);
  const currentCycleMonth = cycleMonthFormatter.format(currentCycleStart);
  const currentCycleLabel = monthNameFormatter.format(currentCycleStart);
  const nextCycleLabel = monthNameFormatter.format(nextCycleStart);
  const nextCycleOpensOn = cycleStartFormatter.format(nextCycleStart);

  const historyFor = (title: string, resolution: RolloverResolution | null) => {
    if (resolution === "carry") {
      return {
        detail: `Original · Stays here in July. One linked copy now sits in the ${currentCycleLabel} cycle.`,
        status: "Carried over",
        tone: "carry" as const,
      };
    }
    if (resolution === "cancel") {
      return {
        detail: "Cancelled explicitly · Original history retained",
        status: "Cancelled",
        tone: "neutral" as const,
      };
    }
    if (resolution === "overdue") {
      return {
        detail: `Retained overdue in July`,
        status: "Incomplete",
        tone: "warning" as const,
      };
    }
    return {
      detail: `${title} · Resolution required`,
      status: "Incomplete",
      tone: "warning" as const,
    };
  };
  const handoffHistory = historyFor(
    "Due July 29",
    rolloverDecisions?.handoff ?? null,
  );
  const callHistory = historyFor(
    "Due July 30",
    rolloverDecisions?.call ?? null,
  );

  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 px-4 pb-32 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-9"
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between lg:mb-10">
          <div>
            <p className="eyebrow mb-2">{retainer.client} · Monthly retainer</p>
            <h1 className="display-title">{retainer.name}</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Starts {startsOn} · Vancouver timezone ·{" "}
              {retainer.templates.length} deliverable templates
            </p>
          </div>
          <span className="status-pill self-start bg-[var(--lime-soft)] text-[var(--lime-deep)]">
            Active
          </span>
        </header>

        <NextCyclePanel
          retainer={retainer}
          nextCycleLabel={nextCycleLabel}
          nextCycleOpensOn={nextCycleOpensOn}
        />

        <TemplateEditor
          templates={retainer.templates}
          currentCycleLabel={currentCycleLabel}
          nextCycleLabel={nextCycleLabel}
          onSave={onUpdateTemplates}
        />

        {!rolloverDecisions ? (
          <RolloverReview onApply={onApplyRollover} />
        ) : (
          <div
            className="mb-5 rounded-[22px] border border-[var(--blue)] bg-[var(--blue-soft)] p-5"
            role="status"
          >
            <p className="text-sm font-bold text-[var(--blue)]">
              July closed with every unfinished item accounted for.
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {carryovers === 0
                ? "No linked carryovers were requested, so both originals remain in July and nothing was copied."
                : `${carryovers} linked ${
                    carryovers === 1 ? "carryover" : "carryovers"
                  } created, one copy each. Every original stays in July, so each carried item exists exactly twice: the July original and its ${currentCycleLabel} copy.`}
            </p>
          </div>
        )}

        <section className="mt-5" aria-labelledby="cycle-history-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-1">Never rewritten</p>
              <h2 id="cycle-history-heading" className="text-xl font-bold">
                Cycle history
              </h2>
            </div>
            <p className="text-xs text-[var(--muted)]">Newest first</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <article className="paper-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="eyebrow mb-1">{currentCycleMonth}</p>
                  <h3 className="text-lg font-bold">Current cycle</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {retainer.currentCycleDeliverables.length} generated when
                    this cycle opened
                    {rolloverDecisions
                      ? ` · ${carryovers} linked ${
                          carryovers === 1 ? "carryover" : "carryovers"
                        }`
                      : ""}
                  </p>
                </div>
                <StatusPill tone="neutral">Active</StatusPill>
              </div>
              <ul>
                {retainer.currentCycleDeliverables.map((template) => (
                  <DeliverableRow
                    key={template.id}
                    title={template.name}
                    detail={`${template.startOffset} → ${template.dueOffset} · Generated once from the template version in effect on ${startsOn}`}
                    status="Planned"
                    tone="neutral"
                  />
                ))}
                {rolloverDecisions?.handoff === "carry" ? (
                  <DeliverableRow
                    title="July campaign handoff"
                    detail="Copy 1 of 1 · Links back to the July original, which stays in July"
                    status="Carried over"
                    tone="carry"
                  />
                ) : null}
                {rolloverDecisions?.call === "carry" ? (
                  <DeliverableRow
                    title="July strategy call"
                    detail="Copy 1 of 1 · Links back to the July original, which stays in July"
                    status="Carried over"
                    tone="carry"
                  />
                ) : null}
              </ul>
            </article>

            <article className="paper-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="eyebrow mb-1">July 2026</p>
                  <h3 className="text-lg font-bold">Prior cycle</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Source work stays in July
                  </p>
                </div>
                <StatusPill tone={rolloverDecisions ? "complete" : "warning"}>
                  {rolloverDecisions ? "Closed" : "Closing"}
                </StatusPill>
              </div>
              <ul>
                <DeliverableRow
                  title="July performance report"
                  detail="Completed July 27"
                  status="Complete"
                  tone="complete"
                />
                <DeliverableRow
                  title="July campaign handoff"
                  detail={handoffHistory.detail}
                  status={handoffHistory.status}
                  tone={handoffHistory.tone}
                />
                <DeliverableRow
                  title="July strategy call"
                  detail={callHistory.detail}
                  status={callHistory.status}
                  tone={callHistory.tone}
                />
              </ul>
            </article>

            <article className="paper-card overflow-hidden xl:col-span-2">
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="eyebrow mb-1">June 2026</p>
                  <h3 className="text-lg font-bold">Paused by the user</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    No deliverables were generated and the template was not
                    changed.
                  </p>
                </div>
                <StatusPill tone="neutral">Skipped</StatusPill>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

export function RetainersView({
  retainer,
  rolloverDecisions,
  onCreate,
  onApplyRollover,
  onUpdateTemplates,
}: RetainersViewProps) {
  return retainer ? (
    <RetainerDetail
      retainer={retainer}
      rolloverDecisions={rolloverDecisions}
      onApplyRollover={onApplyRollover}
      onUpdateTemplates={onUpdateTemplates}
    />
  ) : (
    <RetainerCreationForm onCreate={onCreate} />
  );
}
