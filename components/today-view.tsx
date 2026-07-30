import { Icon } from "./icon";
import type { FiledTask, FocusItem } from "./prototype-types";

type TodayViewProps = {
  focusItems: FocusItem[];
  filedTask: FiledTask | null;
  isFiledTaskFocused: boolean;
  isSuggestionDeclined: boolean;
  reviewCount: number;
  slippingCount: number;
  onAddToTopThree: () => void;
  onDeclineSuggestion: () => void;
  onCapture: () => void;
  onOpenReview: () => void;
  onOpenSlipping: () => void;
};

const agenda = [
  {
    time: "9:30",
    period: "AM",
    title: "Weekly planning",
    detail: "Personal · 30 min",
    color: "var(--lime-deep)",
  },
  {
    time: "11:00",
    period: "AM",
    title: "Acme website check-in",
    detail: "Google Meet · 45 min",
    color: "var(--blue)",
  },
  {
    time: "2:30",
    period: "PM",
    title: "Studio block",
    detail: "Launch video · 90 min",
    color: "var(--coral)",
  },
];

export function TodayView({
  focusItems,
  filedTask,
  isFiledTaskFocused,
  isSuggestionDeclined,
  reviewCount,
  slippingCount,
  onAddToTopThree,
  onDeclineSuggestion,
  onCapture,
  onOpenReview,
  onOpenSlipping,
}: TodayViewProps) {
  const availableSlots = 3 - focusItems.length;
  const suggestion =
    availableSlots > 0 && filedTask && !isSuggestionDeclined ? filedTask : null;

  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 pb-32 pt-6 sm:px-7 lg:px-10 lg:pb-12 lg:pt-9">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-7 flex items-start justify-between gap-4 lg:mb-10">
          <div>
            <p className="eyebrow mb-2">Thursday, July 30</p>
            <h1 className="display-title">Good morning.</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)] sm:text-base">
              A calm day, with one client promise worth protecting.
            </p>
          </div>
          <button
            type="button"
            onClick={onCapture}
            className="primary-button hidden sm:flex"
          >
            <Icon name="plus" size={18} />
            Capture
          </button>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-5">
            <section className="paper-card overflow-hidden" aria-labelledby="top-three-heading">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-5 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="grid size-7 place-items-center rounded-full bg-[var(--lime)] text-xs font-black"
                      aria-hidden="true"
                    >
                      3
                    </span>
                    <h2 id="top-three-heading" className="section-title">
                      Your focus
                    </h2>
                  </div>
                  <p className="mt-1 pl-9 text-xs text-[var(--muted)]">
                    {focusItems.length} of 3 chosen by you ·{" "}
                    {availableSlots === 0
                      ? "full"
                      : `${availableSlots} ${availableSlots === 1 ? "spot" : "spots"} open`}
                  </p>
                  <p className="mt-1 pl-9 text-xs text-[var(--muted)]">
                    Slipwell can suggest. It never puts anything here for you.
                  </p>
                </div>
                <button type="button" className="icon-button" aria-label="Focus options">
                  <Icon name="dots" />
                </button>
              </div>

              <ol className="divide-y divide-[var(--line)]">
                {focusItems.map((item, index) => (
                  <li key={item.id} className="group flex items-center gap-4 px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-xs font-bold text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
                      aria-label={`Complete ${item.title}`}
                    >
                      {index + 1}
                    </button>
                    <span
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--${item.tone})` }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold sm:text-[15px]">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {item.eyebrow} <span aria-hidden="true">·</span> {item.detail}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--muted-light)]">
                        You added this at {item.chosenAt}
                      </p>
                    </div>
                    <span className="hidden rounded-full bg-[var(--canvas)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] sm:block">
                      Focus
                    </span>
                  </li>
                ))}
              </ol>

              {suggestion ? (
                <div
                  className="border-t border-dashed border-[var(--line-strong)] bg-[var(--canvas)] px-5 py-4 sm:px-6"
                  aria-labelledby="focus-suggestion-heading"
                  role="group"
                >
                  <p className="eyebrow mb-1 text-[var(--blue)]">
                    Suggested · not added
                  </p>
                  <p
                    id="focus-suggestion-heading"
                    className="text-sm font-semibold"
                  >
                    {suggestion.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Suggested because it is due Friday and your Acme check-in is
                    at 11:00 today. It stays out of your focus until you add it.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onAddToTopThree}
                      className="rounded-full bg-[var(--ink)] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5"
                    >
                      Add to my focus
                    </button>
                    <button
                      type="button"
                      onClick={onDeclineSuggestion}
                      className="rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--ink)]"
                    >
                      Not today
                    </button>
                  </div>
                </div>
              ) : availableSlots > 0 ? (
                <button
                  type="button"
                  onClick={onCapture}
                  className="flex min-h-14 w-full items-center gap-3 border-t border-dashed border-[var(--line-strong)] px-5 text-left text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--canvas)] hover:text-[var(--ink)] sm:px-6"
                >
                  <span className="grid size-7 place-items-center rounded-full border border-dashed border-current">
                    <Icon name="plus" size={15} />
                  </span>
                  {isSuggestionDeclined
                    ? "Slot left open. Choose one more focus item"
                    : "Choose one more focus item"}
                </button>
              ) : null}
            </section>

            {filedTask ? (
              <section
                className="relative overflow-hidden rounded-[24px] border border-[var(--ink)] bg-[var(--ink)] p-5 text-white shadow-[0_18px_60px_rgba(23,24,20,0.18)] sm:p-6"
                aria-labelledby="newly-filed-heading"
              >
                <div className="absolute -right-10 -top-16 size-36 rounded-full bg-[var(--coral)] opacity-80 blur-3xl" />
                <div className="relative flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-[var(--lime)]">
                    <Icon name="spark" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                      Just filed from Review
                    </p>
                    <h2 id="newly-filed-heading" className="text-lg font-semibold tracking-[-0.02em]">
                      {filedTask.title}
                    </h2>
                    <p className="mt-2 text-sm text-white/65">
                      Due Friday · {filedTask.project} · {filedTask.person}
                    </p>
                  </div>
                  {suggestion ? (
                    <p className="shrink-0 text-xs font-semibold text-white/55">
                      Suggested for your focus above
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={onAddToTopThree}
                      disabled={isFiledTaskFocused}
                      className="shrink-0 rounded-full bg-[var(--lime)] px-4 py-2.5 text-xs font-black text-[var(--ink)] transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-55"
                    >
                      {isFiledTaskFocused ? "In your focus" : "Add to my focus"}
                    </button>
                  )}
                </div>
              </section>
            ) : (
              <button
                type="button"
                onClick={onCapture}
                className="capture-prompt group w-full text-left"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-white transition group-hover:rotate-3">
                  <Icon name="spark" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">What’s on your mind?</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    Speak or type it. You can decide where it belongs after.
                  </span>
                </span>
                <span className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold sm:flex">
                  Press C
                  <Icon name="arrow" size={14} />
                </span>
              </button>
            )}
          </div>

          <aside className="space-y-5" aria-label="Today details">
            <section className="paper-card p-5 sm:p-6" aria-labelledby="agenda-heading">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Icon name="calendar" size={19} />
                  <h2 id="agenda-heading" className="section-title">
                    On your calendar
                  </h2>
                </div>
                <span className="text-xs font-semibold text-[var(--muted)]">3 events</span>
              </div>
              <ol className="space-y-1">
                {agenda.map((event) => (
                  <li key={`${event.time}-${event.title}`} className="group flex gap-3 rounded-2xl px-2 py-3 transition hover:bg-[var(--canvas)]">
                    <div className="w-10 shrink-0 pt-0.5 text-right">
                      <p className="text-xs font-bold">{event.time}</p>
                      <p className="text-[9px] font-bold tracking-wider text-[var(--muted)]">{event.period}</p>
                    </div>
                    <span
                      className="w-0.5 shrink-0 rounded-full"
                      style={{ backgroundColor: event.color }}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{event.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <button
              type="button"
              onClick={onOpenReview}
              className="paper-card flex w-full items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] sm:p-6"
            >
              <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--coral-soft)] font-bold text-[var(--coral-deep)]">
                ◇
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--coral)] text-[9px] font-black text-white">
                  {reviewCount}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Review needs you</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  {reviewCount <= 1
                    ? "One capture failure needs a retry."
                    : "One ambiguous person and one capture failure."}
                </span>
              </span>
              <Icon name="arrow" size={17} />
            </button>

            <button
              type="button"
              onClick={onOpenSlipping}
              className="w-full rounded-[22px] border border-[var(--coral)] bg-[var(--coral-soft)] p-5 text-left transition hover:-translate-y-0.5"
            >
              <span className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--coral-deep)]">
                  Attention risk
                </span>
                <span className="status-pill bg-[var(--coral)] text-white">
                  {slippingCount} active
                </span>
              </span>
              <span className="block text-sm font-semibold">
                See what’s slipping—and why.
              </span>
              <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">
                Task, project, next-action, and retainer examples are ready to
                review.
              </span>
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
