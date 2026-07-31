import { Icon } from "./icon";
import type { FiledTask } from "./prototype-types";

type ReviewViewProps = {
  filedTask: FiledTask | null;
  wasUndone: boolean;
  onReviewAmbiguity: () => void;
  onRetryFailure: () => void;
  onUndo: () => void;
};

export function ReviewView({
  filedTask,
  wasUndone,
  onReviewAmbiguity,
  onRetryFailure,
  onUndo,
}: ReviewViewProps) {
  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 px-4 pb-32 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-9"
    >
      <div className="mx-auto max-w-[1000px]">
        <header className="mb-8 lg:mb-10">
          <p className="eyebrow mb-2">Routing inbox</p>
          <h1 className="display-title">Review</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Your source stays intact. Nothing becomes a record until you approve
            it.
          </p>
        </header>

        {wasUndone ? (
          <div className="mb-5 flex items-start gap-3 rounded-[20px] border border-[var(--blue)] bg-[var(--blue-soft)] p-4 text-sm">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[var(--blue)] text-white">
              <Icon name="undo" size={15} />
            </span>
            <div>
              <p className="font-bold">Filing undone</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                The task was removed. Its original source remains available in
                Review.
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-7">
          {/* Once this capture is filed it belongs under Recently filed. Leaving
              it here as well would show one capture in two contradictory
              states. */}
          {filedTask ? null : (
            <section aria-labelledby="needs-attention-heading">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 id="needs-attention-heading" className="section-label">
                  Needs attention
                </h2>
                <span className="count-pill">1</span>
              </div>
              <article className="paper-card overflow-hidden">
                <div className="flex items-start gap-4 p-5 sm:p-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--coral-soft)] text-[var(--coral-deep)]">
                    <Icon name="spark" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="status-pill bg-[var(--coral-soft)] text-[var(--coral-deep)]">
                        Ambiguous person
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                        2 minutes ago
                      </span>
                    </div>
                    <h3 className="text-base font-bold tracking-[-0.015em]">
                      Send Sarah the Acme homepage draft
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                      “Remind me Friday morning to send Sarah the Acme homepage
                      draft.”
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="context-chip">Task · 97%</span>
                      <span className="context-chip">Acme website · 94%</span>
                      <span className="context-chip border-[var(--coral)]">
                        Sarah · 2 matches
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onReviewAmbiguity}
                    className="secondary-button shrink-0"
                  >
                    Review
                  </button>
                </div>
              </article>
            </section>
          )}

          <section aria-labelledby="ready-heading">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 id="ready-heading" className="section-label">
                Ready to confirm
              </h2>
              <span className="count-pill">1</span>
            </div>
            <article className="paper-card flex items-start gap-4 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--lime-soft)] text-[var(--lime-deep)]">
                <Icon name="check" size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="status-pill bg-[var(--lime-soft)] text-[var(--lime-deep)]">
                    High confidence
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                    18 minutes ago
                  </span>
                </div>
                <h3 className="text-base font-bold tracking-[-0.015em]">
                  Add case study metrics to launch outline
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Proposed as a task in Launch video · No date
                </p>
              </div>
              <button type="button" className="secondary-button shrink-0">
                Confirm
              </button>
            </article>
          </section>

          <section aria-labelledby="failed-heading">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 id="failed-heading" className="section-label">
                Failed
              </h2>
              <span className="count-pill">1</span>
            </div>
            <article className="rounded-[24px] border border-[var(--coral)] bg-[var(--coral-soft)] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[var(--coral-deep)]">
                  !
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--coral-deep)]">
                    Transcription unavailable
                  </p>
                  <h3 className="text-base font-bold">Voice capture · 0:24</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Your original audio is still attached to this prototype
                    item. Try processing it again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRetryFailure}
                  className="secondary-button shrink-0 bg-white"
                >
                  Retry
                </button>
              </div>
            </article>
          </section>

          {filedTask ? (
            <section aria-labelledby="recently-filed-heading">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 id="recently-filed-heading" className="section-label">
                  Recently filed
                </h2>
                <span className="count-pill">1</span>
              </div>
              <article className="paper-card flex items-center gap-4 p-5 sm:p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--blue-soft)] text-[var(--blue)]">
                  <Icon name="check" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold">
                    {filedTask.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Task · {filedTask.project} · Due Friday
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onUndo}
                  className="secondary-button shrink-0"
                >
                  <Icon name="undo" size={15} />
                  Undo
                </button>
              </article>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
