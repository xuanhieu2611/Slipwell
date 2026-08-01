"use client";

import { useState } from "react";
import { saveWorkspacePreferences } from "./actions";

type OnboardingFormProps = Readonly<{
  locale: string;
  timezone: string;
  weekStart: number;
  morningTime: string;
}>;

export function OnboardingForm({
  locale,
  timezone,
  weekStart,
  morningTime,
}: OnboardingFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentTimezone, setCurrentTimezone] = useState(timezone);
  const [currentLocale, setCurrentLocale] = useState(locale);
  const [currentWeekStart, setCurrentWeekStart] = useState(String(weekStart));
  const [currentMorningTime, setCurrentMorningTime] = useState(
    morningTime.slice(0, 5),
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsPending(true);

    try {
      const result = await saveWorkspacePreferences({
        timezone: currentTimezone,
        locale: currentLocale,
        weekStart: currentWeekStart,
        morningTime: currentMorningTime,
      });

      if (!result.success) {
        if (result.sessionExpired) {
          window.location.assign("/sign-in?reason=session-expired");
          return;
        }

        setMessage(result.message);
        setIsPending(false);
        return;
      }

      // Full navigation avoids a stuck pending soft-nav after the server action.
      window.location.assign("/");
    } catch {
      setMessage("We could not save your preferences. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <p className="auth-eyebrow">Step 1 of 3</p>
      <h1>Set your working day</h1>
      <p className="auth-copy">
        These defaults keep Today, reminders, and future recurring work grounded
        in your local time. You can change them later without rewriting saved
        instants.
      </p>

      <label>
        Timezone
        <input
          aria-describedby="timezone-help"
          onChange={(event) => setCurrentTimezone(event.target.value)}
          required
          value={currentTimezone}
        />
      </label>
      <p className="auth-help" id="timezone-help">
        Use an IANA name, such as <code>America/Vancouver</code>.
      </p>

      <label>
        Locale
        <input
          onChange={(event) => setCurrentLocale(event.target.value)}
          required
          value={currentLocale}
        />
      </label>

      <label>
        Week starts on
        <select
          onChange={(event) => setCurrentWeekStart(event.target.value)}
          value={currentWeekStart}
        >
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="6">Saturday</option>
        </select>
      </label>

      <label>
        Morning starts at
        <input
          onChange={(event) => setCurrentMorningTime(event.target.value)}
          required
          type="time"
          value={currentMorningTime}
        />
      </label>

      {message ? (
        <p className="auth-error" role="alert">
          {message}
        </p>
      ) : null}

      <button className="auth-primary" disabled={isPending} type="submit">
        {isPending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
