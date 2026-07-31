"use client";

import { useEffect, useRef, useState } from "react";
import { CaptureDialog } from "./capture-dialog";
import { Icon } from "./icon";
import {
  defaultProposal,
  initialFocusItems,
  initialSlippingSignals,
  navigationItems,
} from "./prototype-data";
import type {
  CaptureMode,
  CaptureStage,
  DeliverableTemplate,
  FiledTask,
  FocusItem,
  Proposal,
  RetainerDraft,
  RolloverDecisions,
  SignalAction,
  ViewName,
} from "./prototype-types";
import { RetainersView } from "./retainers-view";
import { ReviewView } from "./review-view";
import { SlippingView } from "./slipping-view";
import { SlipwellMark } from "./slipwell-mark";
import { TodayView } from "./today-view";

const mobileNavigationItems: Array<{
  id: ViewName;
  label: string;
  glyph: string;
}> = [
  { id: "today", label: "Today", glyph: "⌂" },
  { id: "retainers", label: "Retainers", glyph: "↻" },
  { id: "slipping", label: "Slipping", glyph: "!" },
  { id: "review", label: "Review", glyph: "◇" },
];

function Navigation({
  view,
  reviewCount,
  onNavigate,
}: {
  view: ViewName;
  reviewCount: number;
  onNavigate: (view: ViewName) => void;
}) {
  return (
    <nav aria-label="Primary navigation" className="mt-10">
      <ul className="space-y-1">
        {navigationItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={`nav-item ${view === item.id ? "nav-item-active" : ""}`}
            >
              <span
                className="grid size-7 place-items-center text-base"
                aria-hidden="true"
              >
                {item.glyph}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.id === "review" ? (
                <span
                  className={`nav-count ${view === item.id ? "bg-white/20 text-white" : ""}`}
                >
                  {reviewCount}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type PlaceholderViewName = Exclude<
  ViewName,
  "today" | "review" | "retainers" | "slipping"
>;

const placeholderContents: Record<PlaceholderViewName, string> = {
  tasks:
    "Every task you have filed, with its due date, project, and the capture it came from.",
  projects:
    "Each active piece of client or personal work, with its open next action.",
  notes: "Markdown notes, linked to the projects and people they mention.",
};

function PlaceholderView({
  view,
  filedTask,
  onCapture,
}: {
  view: PlaceholderViewName;
  filedTask: FiledTask | null;
  onCapture: () => void;
}) {
  const title = view[0].toUpperCase() + view.slice(1);

  return (
    <main
      id="main-content"
      className="grid min-w-0 flex-1 place-items-center px-5 pb-32 lg:pb-10"
    >
      <div className="max-w-md text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-[20px] bg-[var(--blue-soft)] text-2xl">
          {navigationItems.find((item) => item.id === view)?.glyph}
        </span>
        <p className="eyebrow mb-2">Prototype boundary</p>
        <h1 className="display-title">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {placeholderContents[view]} This screen is empty because it is not
          built yet, not because anything is missing.
        </p>
        {view === "tasks" && filedTask ? (
          <p className="mx-auto mt-4 max-w-sm rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6">
            “{filedTask.title}” was filed and is safe. Until this screen exists,
            you can see it on <strong>Today</strong> and under{" "}
            <strong>Recently filed</strong> in Review.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onCapture}
          className="primary-button mx-auto mt-6"
        >
          <Icon name="plus" size={17} />
          Try capture
        </button>
      </div>
    </main>
  );
}

function MobileNavigation({
  view,
  onNavigate,
  onCapture,
}: {
  view: ViewName;
  onNavigate: (view: ViewName) => void;
  onCapture: () => void;
}) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[rgba(255,253,248,0.92)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5 items-end">
        {mobileNavigationItems.slice(0, 2).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={`mobile-nav-item ${view === item.id ? "text-[var(--ink)]" : ""}`}
            >
              <span className="text-lg" aria-hidden="true">
                {item.glyph}
              </span>
              {item.label}
            </button>
          </li>
        ))}
        <li className="flex justify-center">
          <button
            type="button"
            onClick={onCapture}
            className="-mt-7 grid size-14 place-items-center rounded-[20px] bg-[var(--ink)] text-white shadow-[0_10px_28px_rgba(23,24,20,0.25)]"
            aria-label="Capture something"
          >
            <Icon name="plus" size={23} />
          </button>
        </li>
        {mobileNavigationItems.slice(2).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={`mobile-nav-item ${view === item.id ? "text-[var(--ink)]" : ""}`}
            >
              <span className="text-lg" aria-hidden="true">
                {item.glyph}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function prepareProposal(source: string): Proposal {
  const normalized = source.trim();
  const sourceWithoutPeriod = normalized.replace(/\.$/, "");
  const cleaned =
    sourceWithoutPeriod.replace(/^remind me friday morning to /i, "") ||
    defaultProposal.cleanedText;
  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  return {
    ...defaultProposal,
    source: normalized,
    cleanedText: title,
    title,
  };
}

export function SlipwellPrototype() {
  const [view, setView] = useState<ViewName>("today");
  const [captureStage, setCaptureStage] = useState<CaptureStage>("closed");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("text");
  const [captureText, setCaptureText] = useState("");
  const [proposal, setProposal] = useState<Proposal>(defaultProposal);
  const [filedTask, setFiledTask] = useState<FiledTask | null>(null);
  const [topThreeIds, setTopThreeIds] = useState<string[]>(() =>
    initialFocusItems.map((item) => item.id),
  );
  const [notice, setNotice] = useState<"filed" | "undone" | null>(null);
  const [suggestionDeclined, setSuggestionDeclined] = useState(false);
  const [retainer, setRetainer] = useState<RetainerDraft | null>(null);
  const [rolloverDecisions, setRolloverDecisions] =
    useState<RolloverDecisions | null>(null);
  const [slippingSignals, setSlippingSignals] = useState(
    initialSlippingSignals,
  );
  const processingTimeoutRef = useRef<number | null>(null);
  const reviewCount = filedTask ? 1 : 2;
  const activeSlippingCount = slippingSignals.filter(
    (signal) => signal.status === "active",
  ).length;
  const isFiledTaskFocused = filedTask
    ? topThreeIds.includes(filedTask.id)
    : false;
  const focusItems: FocusItem[] =
    filedTask && isFiledTaskFocused
      ? [
          ...initialFocusItems,
          {
            id: filedTask.id,
            title: filedTask.title,
            eyebrow: "Acme",
            detail: "Due Friday",
            tone: "lime",
            chosenAt: "9:42 AM",
          },
        ]
      : initialFocusItems;

  // The filing toast is transient confirmation, not a persistent surface, so it
  // must not follow the user onto another view and cover its content. Undo
  // stays reachable from Recently filed in Review.
  const navigate = (nextView: ViewName) => {
    setNotice(null);
    setView(nextView);
  };

  const clearProcessingTimeout = () => {
    if (processingTimeoutRef.current !== null) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  };

  const closeCapture = () => {
    clearProcessingTimeout();
    setCaptureStage("closed");
  };

  // Specification 8.2: closing transient capture must not discard input that
  // was already entered, so the draft survives until it is actually filed.
  const openCapture = () => {
    clearProcessingTimeout();
    setCaptureMode("text");
    setProposal(defaultProposal);
    setCaptureStage("compose");
  };

  const showProposalAfterProcessing = () => {
    clearProcessingTimeout();
    setCaptureStage("processing");
    processingTimeoutRef.current = window.setTimeout(() => {
      setCaptureStage("proposal");
      processingTimeoutRef.current = null;
    }, 650);
  };

  const processCapture = () => {
    const nextProposal =
      captureMode === "voice"
        ? {
            ...defaultProposal,
            source:
              "Voice capture: Remind me Friday morning to send Sarah the Acme homepage draft.",
          }
        : prepareProposal(captureText);
    setProposal(nextProposal);
    showProposalAfterProcessing();
  };

  const openSeededProposal = () => {
    setProposal(defaultProposal);
    setCaptureMode("text");
    setCaptureStage("proposal");
  };

  const retryFailedCapture = () => {
    setProposal({
      ...defaultProposal,
      source:
        "Recovered voice capture: Remind me Friday morning to send Sarah the Acme homepage draft.",
    });
    setCaptureMode("voice");
    showProposalAfterProcessing();
  };

  const acceptProposal = () => {
    const nextTask: FiledTask = {
      id: "filed-acme-draft",
      title: proposal.title,
      date: proposal.date,
      project: proposal.project,
      person: proposal.person,
    };
    setFiledTask(nextTask);
    setTopThreeIds((current) =>
      current.filter((itemId) => itemId !== nextTask.id),
    );
    setSuggestionDeclined(false);
    setCaptureText("");
    setNotice("filed");
    setCaptureStage("closed");
    setView("today");
  };

  const addFiledTaskToTopThree = () => {
    if (!filedTask) {
      return;
    }
    setTopThreeIds((current) => {
      if (current.includes(filedTask.id) || current.length >= 3) {
        return current;
      }
      return [...current, filedTask.id];
    });
  };

  const undoFiling = () => {
    if (filedTask) {
      setTopThreeIds((current) =>
        current.filter((itemId) => itemId !== filedTask.id),
      );
    }
    setFiledTask(null);
    setNotice("undone");
  };

  const createRetainer = (nextRetainer: RetainerDraft) => {
    setRetainer(nextRetainer);
    setRolloverDecisions(null);
  };

  // Retainer invariant: a template edit applies to cycles that have not opened
  // yet and must leave the generated current cycle untouched.
  const updateRetainerTemplates = (templates: DeliverableTemplate[]) => {
    setRetainer((current) => (current ? { ...current, templates } : current));
  };

  const applySignalAction = (signalId: string, action: SignalAction) => {
    setSlippingSignals((current) =>
      current.map((signal) => {
        if (signal.id !== signalId) {
          return signal;
        }

        if (action === "change-cadence") {
          return {
            ...signal,
            threshold: "14 days · Custom cadence",
            outcome:
              "Cadence changed to 14 days. Future signals will use the new threshold.",
          };
        }

        const outcomes = {
          act: {
            status: "resolved" as const,
            outcome: `${signal.actLabel} recorded as qualifying attention. Signal resolved.`,
          },
          snooze: {
            status: "snoozed" as const,
            outcome:
              "Snoozed until Monday, August 3. It will not regenerate before then.",
          },
          dismiss: {
            status: "dismissed" as const,
            outcome: "Dismissed with reason: rule too aggressive.",
          },
          pause: {
            status: "obsolete" as const,
            outcome:
              "Paused intentionally. Inactivity signals will not regenerate.",
          },
        };

        return {
          ...signal,
          ...outcomes[action],
        };
      }),
    );
  };

  const resetSignal = (signalId: string) => {
    const original = initialSlippingSignals.find(
      (signal) => signal.id === signalId,
    );
    if (!original) {
      return;
    }
    setSlippingSignals((current) =>
      current.map((signal) =>
        signal.id === signalId ? { ...original } : signal,
      ),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.key.toLowerCase() === "c" && !isTyping) {
        event.preventDefault();
        setCaptureMode("text");
        setProposal(defaultProposal);
        setCaptureStage("compose");
      }

      if (event.key === "Escape") {
        setCaptureStage("closed");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => clearProcessingTimeout();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[var(--canvas)] text-[var(--ink)]">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white focus:translate-y-0"
      >
        Skip to content
      </a>

      <header className="flex h-[68px] items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-4 lg:hidden">
        <SlipwellMark />
        <button type="button" className="icon-button" aria-label="Open profile">
          <span className="grid size-8 place-items-center rounded-full bg-[var(--blue-soft)] text-xs font-black text-[var(--blue)]">
            HS
          </span>
        </button>
      </header>

      <div className="flex min-h-[calc(100dvh-68px)] lg:min-h-[100dvh]">
        <aside className="sticky top-0 hidden h-[100dvh] w-[238px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--paper)] px-5 py-7 lg:flex">
          <SlipwellMark />
          <Navigation
            view={view}
            reviewCount={reviewCount}
            onNavigate={navigate}
          />
          <div className="mt-auto">
            <button
              type="button"
              onClick={openCapture}
              className="primary-button mb-5 w-full justify-center"
            >
              <Icon name="plus" size={17} />
              Capture
              <span className="ml-auto rounded-md bg-white/15 px-1.5 py-0.5 text-[9px]">
                C
              </span>
            </button>
            <div className="flex items-center gap-3 border-t border-[var(--line)] pt-5">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--blue-soft)] text-xs font-black text-[var(--blue)]">
                HS
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">Demo workspace</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                  Vancouver · 9:42 AM
                </p>
              </div>
            </div>
          </div>
        </aside>

        {view === "today" ? (
          <TodayView
            focusItems={focusItems}
            filedTask={filedTask}
            isFiledTaskFocused={isFiledTaskFocused}
            isSuggestionDeclined={suggestionDeclined}
            reviewCount={reviewCount}
            slippingCount={activeSlippingCount}
            onAddToTopThree={addFiledTaskToTopThree}
            onDeclineSuggestion={() => setSuggestionDeclined(true)}
            onCapture={openCapture}
            onOpenReview={() => navigate("review")}
            onOpenSlipping={() => navigate("slipping")}
          />
        ) : view === "review" ? (
          <ReviewView
            filedTask={filedTask}
            wasUndone={notice === "undone"}
            onReviewAmbiguity={openSeededProposal}
            onRetryFailure={retryFailedCapture}
            onUndo={undoFiling}
          />
        ) : view === "retainers" ? (
          <RetainersView
            retainer={retainer}
            rolloverDecisions={rolloverDecisions}
            onCreate={createRetainer}
            onApplyRollover={setRolloverDecisions}
            onUpdateTemplates={updateRetainerTemplates}
          />
        ) : view === "slipping" ? (
          <SlippingView
            signals={slippingSignals}
            onAction={applySignalAction}
            onReset={resetSignal}
          />
        ) : (
          <PlaceholderView
            view={view}
            filedTask={filedTask}
            onCapture={openCapture}
          />
        )}
      </div>

      {notice ? (
        <div
          className="fixed bottom-24 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-[18px] bg-[var(--ink)] p-3 pl-4 text-white shadow-[0_18px_70px_rgba(23,24,20,0.3)] lg:bottom-7"
          role="status"
        >
          <span
            className={`size-2 shrink-0 rounded-full ${notice === "filed" ? "bg-[var(--lime)]" : "bg-[var(--blue)]"}`}
          />
          <p className="min-w-0 flex-1 text-xs font-semibold">
            {notice === "filed"
              ? "Task filed and added to Today."
              : "Filing undone. The source remains in Review."}
          </p>
          {notice === "filed" ? (
            <button
              type="button"
              onClick={undoFiling}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
            >
              <Icon name="undo" size={14} />
              Undo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="icon-button border-white/10 bg-white/10 text-white hover:bg-white/15"
              aria-label="Dismiss notification"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      ) : null}

      <MobileNavigation
        view={view}
        onNavigate={navigate}
        onCapture={openCapture}
      />

      <CaptureDialog
        stage={captureStage}
        mode={captureMode}
        text={captureText}
        proposal={proposal}
        onClose={closeCapture}
        onModeChange={(mode) => {
          setCaptureMode(mode);
          setCaptureStage("compose");
        }}
        onTextChange={setCaptureText}
        onStartRecording={() => setCaptureStage("recording")}
        onFinishRecording={() => setCaptureStage("voice-ready")}
        onDenyPermission={() => setCaptureStage("permission-denied")}
        onFallBackToTyping={() => {
          setCaptureMode("text");
          setCaptureStage("compose");
        }}
        onProcess={processCapture}
        onProposalChange={setProposal}
        onAccept={acceptProposal}
      />
    </div>
  );
}
