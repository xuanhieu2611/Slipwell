import type { SignalAction, SlippingSignal } from "./prototype-types";

type SlippingViewProps = {
  signals: SlippingSignal[];
  onAction: (signalId: string, action: SignalAction) => void;
  onReset: (signalId: string) => void;
};

const actionLabels: Array<{
  action: Exclude<SignalAction, "act">;
  label: string;
}> = [
  { action: "snooze", label: "Snooze" },
  { action: "dismiss", label: "Dismiss" },
  { action: "change-cadence", label: "Change cadence" },
  { action: "pause", label: "Pause" },
];

function severityClass(severity: SlippingSignal["severity"]) {
  if (severity === "Critical") {
    return "bg-[var(--coral)] text-white";
  }
  if (severity === "At risk") {
    return "bg-[var(--coral-soft)] text-[var(--coral-deep)]";
  }
  return "bg-[var(--blue-soft)] text-[var(--blue)]";
}

function SignalCard({
  signal,
  onAction,
  onReset,
}: {
  signal: SlippingSignal;
  onAction: (signalId: string, action: SignalAction) => void;
  onReset: (signalId: string) => void;
}) {
  return (
    <article
      className="paper-card overflow-hidden"
      aria-labelledby={`${signal.id}-heading`}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`status-pill ${severityClass(signal.severity)}`}>
              {signal.severity}
            </span>
            <span className="context-chip">{signal.entityType}</span>
            <span className="text-[10px] font-black tracking-[0.12em] text-[var(--muted)]">
              {signal.ruleId}
            </span>
          </div>
          <h2
            id={`${signal.id}-heading`}
            className="text-lg font-bold tracking-[-0.02em]"
          >
            {signal.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {signal.rule}
          </p>
        </div>
        <span
          className={`status-pill shrink-0 ${
            signal.status === "active"
              ? "bg-[var(--lime-soft)] text-[var(--lime-deep)]"
              : "bg-[var(--canvas)] text-[var(--muted)]"
          }`}
        >
          {signal.status === "active" ? "Active signal" : signal.status}
        </span>
      </div>

      <dl className="grid border-y border-[var(--line)] bg-[var(--canvas)] sm:grid-cols-3">
        <div className="p-4 sm:p-5">
          <dt className="section-label">Threshold</dt>
          <dd className="mt-2 text-sm font-semibold">{signal.threshold}</dd>
        </div>
        <div className="border-t border-[var(--line)] p-4 sm:border-l sm:border-t-0 sm:p-5">
          <dt className="section-label">Last qualifying attention</dt>
          <dd className="mt-2 text-sm font-semibold">{signal.lastAttention}</dd>
        </div>
        <div className="border-t border-[var(--line)] p-4 sm:border-l sm:border-t-0 sm:p-5">
          <dt className="section-label">Elapsed breach</dt>
          <dd className="mt-2 text-sm font-semibold">{signal.elapsed}</dd>
        </div>
      </dl>

      {signal.status === "active" ? (
        <div className="p-5 sm:p-6">
          {signal.outcome ? (
            <p
              className="mb-4 rounded-[16px] bg-[var(--blue-soft)] px-4 py-3 text-xs font-semibold text-[var(--blue)]"
              role="status"
            >
              {signal.outcome}
            </p>
          ) : null}
          <p className="section-label mb-3">Available actions</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="primary-button"
              onClick={() => onAction(signal.id, "act")}
              aria-label={`${signal.actLabel} for ${signal.title}`}
            >
              {signal.actLabel}
            </button>
            {actionLabels.map(({ action, label }) => (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onAction(signal.id, action)}
                aria-label={`${label} ${signal.title}`}
                key={action}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            This signal does not change priority, due date, or status.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div role="status">
            <p className="text-sm font-bold">{signal.outcome}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              The signal remains in history; its underlying work was not
              silently changed.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button shrink-0 justify-center"
            onClick={() => onReset(signal.id)}
          >
            Reset example
          </button>
        </div>
      )}
    </article>
  );
}

export function SlippingView({
  signals,
  onAction,
  onReset,
}: SlippingViewProps) {
  const activeCount = signals.filter(
    (signal) => signal.status === "active",
  ).length;

  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 px-4 pb-32 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-9"
    >
      <div className="mx-auto max-w-[1040px]">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
          <div>
            <p className="eyebrow mb-2">Explainable attention risk</p>
            <h1 className="display-title">Slipping, not overdue.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Deterministic signals show what needs attention, why it appeared,
              and what you can do next—without secretly reprioritizing work.
            </p>
          </div>
          <span className="status-pill self-start bg-[var(--ink)] text-white sm:self-auto">
            {activeCount} active
          </span>
        </header>

        <div
          className="mb-5 grid gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--lime-soft)] p-5 text-sm sm:grid-cols-3"
          aria-label="How slipping works"
        >
          <p>
            <strong className="block">Meaningful attention only</strong>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
              Passive views and sync do not reset cadence.
            </span>
          </p>
          <p>
            <strong className="block">One signal per rule</strong>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
              Recalculation does not create duplicates.
            </span>
          </p>
          <p>
            <strong className="block">Your response is explicit</strong>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
              Act, snooze, dismiss, tune cadence, or pause.
            </span>
          </p>
        </div>

        <div className="space-y-5">
          {signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onAction={onAction}
              onReset={onReset}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
