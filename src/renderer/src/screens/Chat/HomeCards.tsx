import { useEffect, useState } from "react";

interface ContinueCard {
  id: string;
  title: string;
  messageCount: number;
  at: number;
}

interface NextRunCard {
  name: string;
  schedule: string;
  at: string;
}

export interface HomeCardsData {
  continueSession: ContinueCard | null;
  nextRun: NextRunCard | null;
  todoCount: number | null;
}

/** Pure selection from the three list APIs, so it can be tested without IPC. */
export function selectHomeCards(
  sessions: Array<{
    id: string;
    title: string | null;
    preview: string;
    messageCount: number;
    startedAt: number;
    endedAt: number | null;
  }> | null,
  jobs: Array<{
    name: string;
    schedule: string;
    enabled: boolean;
    state: string;
    next_run_at: string | null;
  }> | null,
  todo: { success: boolean; data?: unknown[] } | null,
): HomeCardsData {
  const latest = sessions?.[0];
  const upcoming = (jobs ?? [])
    .filter(
      (j) =>
        j.enabled &&
        j.state === "active" &&
        j.next_run_at &&
        !Number.isNaN(new Date(j.next_run_at).getTime()),
    )
    .sort(
      (a, b) =>
        new Date(a.next_run_at as string).getTime() -
        new Date(b.next_run_at as string).getTime(),
    )[0];
  return {
    continueSession: latest
      ? {
          id: latest.id,
          title: latest.title || latest.preview || latest.id,
          messageCount: latest.messageCount,
          at: latest.endedAt ?? latest.startedAt,
        }
      : null,
    nextRun: upcoming
      ? {
          name: upcoming.name,
          schedule: upcoming.schedule,
          at: upcoming.next_run_at as string,
        }
      : null,
    todoCount: todo?.success ? (todo.data?.length ?? 0) : null,
  };
}

function formatTime(value: number | string): string {
  // Session timestamps are unix seconds; cron times are ISO strings.
  const d =
    typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Home mounts on every new chat; reuse a recent load instead of re-running the
// cron/kanban CLIs (slow over SSH) each time.
const CACHE_MS = 60_000;
let cache: {
  profile: string | undefined;
  at: number;
  data: HomeCardsData;
} | null = null;

function goTo(view: string): void {
  window.dispatchEvent(new CustomEvent("navigation:goto", { detail: view }));
}

/**
 * Home "at a glance" cards: the latest session, the next scheduled run and the
 * Kanban to-do count. Each card renders only when its data loaded; nothing is
 * shown in place of a failed or empty source.
 */
export function HomeCards({
  profile,
}: {
  profile?: string;
}): React.JSX.Element | null {
  const [data, setData] = useState<HomeCardsData | null>(() =>
    cache && cache.profile === profile && Date.now() - cache.at < CACHE_MS
      ? cache.data
      : null,
  );

  useEffect(() => {
    if (
      cache &&
      cache.profile === profile &&
      Date.now() - cache.at < CACHE_MS
    ) {
      setData(cache.data);
      return;
    }
    let cancelled = false;
    const api = window.hermesAPI;
    void Promise.allSettled([
      api.listSessions(1, 0, undefined, profile),
      api.listCronJobs(false, profile),
      api.kanbanListTasks({ status: "todo", profile }),
    ]).then(([s, j, k]) => {
      const next = selectHomeCards(
        s.status === "fulfilled" ? s.value : null,
        j.status === "fulfilled" ? j.value : null,
        k.status === "fulfilled" ? k.value : null,
      );
      cache = { profile, at: Date.now(), data: next };
      if (!cancelled) setData(next);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!data) return null;
  const { continueSession, nextRun, todoCount } = data;
  if (!continueSession && !nextRun && !todoCount) return null;

  return (
    <div className="home-cards">
      {continueSession && (
        <button
          type="button"
          className="mx-card home-card"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("session:resume", { detail: continueSession.id }),
            )
          }
        >
          <span className="mx-meta">CONTINUE</span>
          <b className="home-card-title" title={continueSession.title}>
            {continueSession.title}
          </b>
          <span className="mx-meta">
            {continueSession.messageCount} msgs ·{" "}
            {formatTime(continueSession.at)}
          </span>
        </button>
      )}
      {nextRun && (
        <button
          type="button"
          className="mx-card home-card home-card--info"
          onClick={() => goTo("schedules")}
        >
          <span className="mx-meta home-card-label">
            NEXT RUN · {formatTime(nextRun.at)}
          </span>
          <b className="home-card-title" title={nextRun.name}>
            {nextRun.name}
          </b>
          <span className="mx-meta">cron · {nextRun.schedule}</span>
        </button>
      )}
      {!!todoCount && (
        <button
          type="button"
          className="mx-card home-card home-card--warn"
          onClick={() => goTo("kanban")}
        >
          <span className="mx-meta home-card-label">KANBAN</span>
          <b className="home-card-title">{todoCount} tasks in To-do</b>
          <span className="mx-meta">current board</span>
        </button>
      )}
    </div>
  );
}
