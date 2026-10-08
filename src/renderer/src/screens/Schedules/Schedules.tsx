import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash,
  Refresh,
  X,
  Play,
  Pause,
  Zap,
  Alert,
} from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import { OrbLoader } from "../../components/OrbLoader";
import "./Schedules.css";

const DELIVER_TARGETS = [
  { value: "local", label: "Local" },
  { value: "origin", label: "Origin" },
  { value: "telegram", label: "Telegram" },
  { value: "discord", label: "Discord" },
  { value: "slack", label: "Slack" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "signal", label: "Signal" },
  { value: "matrix", label: "Matrix" },
  { value: "mattermost", label: "Mattermost" },
  { value: "email", label: "Email" },
  { value: "webhook", label: "Webhook" },
  { value: "sms", label: "SMS" },
  { value: "homeassistant", label: "Home Assistant" },
  { value: "dingtalk", label: "DingTalk" },
  { value: "feishu", label: "Feishu" },
  { value: "wecom", label: "WeCom" },
];

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  state: "active" | "paused" | "completed";
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  repeat: { times: number | null; completed: number } | null;
  deliver: string[];
  skills: string[];
  script: string | null;
}

type FrequencyType = "minutes" | "hourly" | "daily" | "weekly" | "custom";

interface SchedulesProps {
  profile?: string;
}

function Schedules({ profile }: SchedulesProps): React.JSX.Element {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newDeliver, setNewDeliver] = useState("local");

  // Schedule builder state
  const [frequency, setFrequency] = useState<FrequencyType>("daily");
  const [minutesInterval, setMinutesInterval] = useState("30");
  const [hourlyInterval, setHourlyInterval] = useState("1");
  const [dailyTime, setDailyTime] = useState("09:00");
  const [weeklyDay, setWeeklyDay] = useState("1");
  const [weeklyTime, setWeeklyTime] = useState("09:00");
  const [customCron, setCustomCron] = useState("");

  const totalJobs = jobs.length;
  const activeCount = jobs.filter((j) => j.state === "active").length;
  const pausedCount = jobs.filter((j) => j.state === "paused").length;
  const completedCount = jobs.filter((j) => j.state === "completed").length;

  const loadJobs = useCallback(async (): Promise<void> => {
    try {
      const list = await window.hermesAPI.listCronJobs(true, profile);
      setJobs(list);
    } catch {
      setError(t("schedules.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [profile, t]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Escape key to close modals
  useEffect(() => {
    if (!showCreate && !confirmDelete) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(null);
        else if (showCreate) setShowCreate(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showCreate, confirmDelete]);

  function resetForm(): void {
    setNewName("");
    setNewPrompt("");
    setNewDeliver("local");
    setFrequency("daily");
    setMinutesInterval("30");
    setHourlyInterval("1");
    setDailyTime("09:00");
    setWeeklyDay("1");
    setWeeklyTime("09:00");
    setCustomCron("");
  }

  function closeCreateModal(): void {
    setShowCreate(false);
    resetForm();
  }

  function buildSchedule(): string {
    switch (frequency) {
      case "minutes":
        return `${minutesInterval}m`;
      case "hourly":
        return `${hourlyInterval}h`;
      case "daily": {
        const [h, m] = dailyTime.split(":");
        return `${m} ${h} * * *`;
      }
      case "weekly": {
        const [h, m] = weeklyTime.split(":");
        return `${m} ${h} * * ${weeklyDay}`;
      }
      case "custom":
        return customCron.trim();
    }
  }

  function isScheduleValid(): boolean {
    if (frequency === "custom") return customCron.trim().length > 0;
    if (frequency === "minutes") return parseInt(minutesInterval) > 0;
    if (frequency === "hourly") return parseInt(hourlyInterval) > 0;
    return true;
  }

  async function handleCreate(): Promise<void> {
    if (!isScheduleValid()) return;
    setActionInProgress("creating");
    setError("");
    try {
      const result = await window.hermesAPI.createCronJob(
        buildSchedule(),
        newPrompt.trim() || undefined,
        newName.trim() || undefined,
        newDeliver !== "local" ? newDeliver : undefined,
        profile,
      );
      if (result.success) {
        closeCreateModal();
        await loadJobs();
      } else {
        setError(result.error || "Failed to create job");
      }
    } catch {
      setError("Failed to create job");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleRemove(jobId: string): Promise<void> {
    setActionInProgress(jobId);
    setError("");
    try {
      const result = await window.hermesAPI.removeCronJob(jobId, profile);
      setConfirmDelete(null);
      if (result.success) {
        await loadJobs();
      } else {
        setError(result.error || "Failed to remove job");
      }
    } catch {
      setError("Failed to remove job");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleToggle(job: CronJob): Promise<void> {
    setActionInProgress(job.id);
    setError("");
    try {
      const result =
        job.state === "paused"
          ? await window.hermesAPI.resumeCronJob(job.id, profile)
          : await window.hermesAPI.pauseCronJob(job.id, profile);
      if (result.success) {
        await loadJobs();
      } else {
        setError(result.error || "Failed to update job");
      }
    } catch {
      setError("Failed to update job");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleTrigger(jobId: string): Promise<void> {
    setActionInProgress(jobId);
    setError("");
    try {
      const result = await window.hermesAPI.triggerCronJob(jobId, profile);
      if (result.success) {
        await loadJobs();
      } else {
        setError(result.error || "Failed to trigger job");
      }
    } catch {
      setError("Failed to trigger job");
    } finally {
      setActionInProgress(null);
    }
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "--";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  // Presentation-only humanizing of a cron/shorthand schedule ("0 15 * * *"
  // → "daily 15:00", "0 9 * * 1" → "Mondays 09:00", "30m" → "every 30 min").
  // Returns "" when the expression is not a form we render confidently.
  function humanSchedule(expr: string): string {
    const s = expr.trim();
    let m = /^(\d+)m$/i.exec(s);
    if (m) return `every ${m[1]} min`;
    m = /^(\d+)h$/i.exec(s);
    if (m) return `every ${m[1]} h`;
    const fields = s.split(/\s+/);
    if (fields.length !== 5) return "";
    const [min, hour, dom, mon, dow] = fields;
    if (dom !== "*" || mon !== "*") return "";
    const hourParts = hour.split(",");
    const minParts = min.split(",");
    if (dow === "*") {
      if (minParts.length !== 1) return "";
      return `daily ${hourParts
        .map((h) => `${h.padStart(2, "0")}:${min.padStart(2, "0")}`)
        .join(", ")}`;
    }
    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const days = dow.split(",").map((d) => {
      const key = dayKeys[parseInt(d, 10)];
      return key ? t(`schedules.${key}`) : "";
    });
    if (days.some((d) => !d)) return "";
    const time =
      minParts.length === 1 && hourParts.length === 1
        ? ` ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`
        : "";
    const label = days.length === 1 ? `${days[0]}s` : days.join(", ");
    return `${label}${time}`;
  }

  if (loading) {
    return (
      <div className="mxs-root">
        <div className="schedules-loading">
          <OrbLoader state="searching" size={64} />
        </div>
      </div>
    );
  }

  return (
    <div className="mxs-root">
      {/* Create Modal */}
      {showCreate && (
        <div className="skills-detail-overlay" onClick={closeCreateModal}>
          <div className="schedules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedules-modal-header">
              <h3>{t("schedules.newTask")}</h3>
              <button className="btn-ghost" onClick={closeCreateModal}>
                <X size={18} />
              </button>
            </div>
            <div className="schedules-modal-body">
              <div className="schedules-field">
                <label className="schedules-field-label">
                  {t("schedules.name")}
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={t("schedules.namePlaceholder")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="schedules-field">
                <label className="schedules-field-label">
                  {t("schedules.frequency")}{" "}
                  <span className="schedules-required">*</span>
                </label>
                <div className="schedules-freq-pills">
                  {(
                    [
                      ["minutes", t("schedules.frequencyMinutes")],
                      ["hourly", t("schedules.frequencyHourly")],
                      ["daily", t("schedules.frequencyDaily")],
                      ["weekly", t("schedules.frequencyWeekly")],
                      ["custom", t("schedules.frequencyCustom")],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`schedules-freq-pill ${frequency === val ? "active" : ""}`}
                      onClick={() => setFrequency(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {frequency === "minutes" && (
                <div className="schedules-field">
                  <label className="schedules-field-label">
                    {t("schedules.minutesInterval")}
                  </label>
                  <select
                    className="input"
                    value={minutesInterval}
                    onChange={(e) => setMinutesInterval(e.target.value)}
                  >
                    {["5", "10", "15", "30", "45"].map((v) => (
                      <option key={v} value={v}>
                        {t("schedules.everyNMinutes", { n: v })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === "hourly" && (
                <div className="schedules-field">
                  <label className="schedules-field-label">
                    {t("schedules.hoursInterval")}
                  </label>
                  <select
                    className="input"
                    value={hourlyInterval}
                    onChange={(e) => setHourlyInterval(e.target.value)}
                  >
                    {["1", "2", "3", "4", "6", "8", "12"].map((v) => (
                      <option key={v} value={v}>
                        {t("schedules.everyNHours", { n: v })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === "daily" && (
                <div className="schedules-field">
                  <label className="schedules-field-label">
                    {t("schedules.executionTime")}
                  </label>
                  <input
                    className="input"
                    type="time"
                    value={dailyTime}
                    onChange={(e) => setDailyTime(e.target.value)}
                  />
                </div>
              )}

              {frequency === "weekly" && (
                <>
                  <div className="schedules-field">
                    <label className="schedules-field-label">
                      {t("schedules.weekday")}
                    </label>
                    <select
                      className="input"
                      value={weeklyDay}
                      onChange={(e) => setWeeklyDay(e.target.value)}
                    >
                      {[
                        ["1", t("schedules.monday")],
                        ["2", t("schedules.tuesday")],
                        ["3", t("schedules.wednesday")],
                        ["4", t("schedules.thursday")],
                        ["5", t("schedules.friday")],
                        ["6", t("schedules.saturday")],
                        ["0", t("schedules.sunday")],
                      ].map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="schedules-field">
                    <label className="schedules-field-label">
                      {t("schedules.executionTime")}
                    </label>
                    <input
                      className="input"
                      type="time"
                      value={weeklyTime}
                      onChange={(e) => setWeeklyTime(e.target.value)}
                    />
                  </div>
                </>
              )}

              {frequency === "custom" && (
                <div className="schedules-field">
                  <label className="schedules-field-label">
                    {t("schedules.cronExpression")}
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder={t("schedules.cronPlaceholder")}
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                  />
                  <div className="schedules-field-hint">
                    {t("schedules.cronHint")}
                  </div>
                </div>
              )}
              <div className="schedules-field">
                <label className="schedules-field-label">
                  {t("schedules.prompt")}
                </label>
                <textarea
                  className="input schedules-textarea"
                  placeholder={t("schedules.promptPlaceholder")}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="schedules-field">
                <label className="schedules-field-label">
                  {t("schedules.deliverTo")}
                </label>
                <select
                  className="input"
                  value={newDeliver}
                  onChange={(e) => setNewDeliver(e.target.value)}
                >
                  {DELIVER_TARGETS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="schedules-field-hint">
                  {t("schedules.deliverHint")}
                </div>
              </div>
            </div>
            <div className="schedules-modal-footer">
              <button className="btn btn-secondary" onClick={closeCreateModal}>
                {t("common.cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!isScheduleValid() || actionInProgress === "creating"}
              >
                {actionInProgress === "creating"
                  ? t("schedules.creating")
                  : t("schedules.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="skills-detail-overlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="schedules-modal schedules-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="schedules-modal-header">
              <h3>{t("schedules.deleteTaskTitle")}</h3>
              <button
                className="btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="schedules-modal-body">
              <p className="schedules-confirm-text">
                {t("schedules.deleteConfirmText")}
              </p>
            </div>
            <div className="schedules-modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmDelete(null)}
              >
                {t("common.cancel")}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRemove(confirmDelete)}
                disabled={actionInProgress === confirmDelete}
              >
                {actionInProgress === confirmDelete
                  ? t("schedules.deleting")
                  : t("schedules.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mxs-header">
        <div>
          <h1 className="mx-h1 mxs-h1">{t("schedules.title")}</h1>
          <p className="mx-sub">
            {t("schedules.subtitle")}. {totalJobs} jobs · {activeCount} active ·{" "}
            {pausedCount} paused
            {completedCount > 0 ? ` · ${completedCount} completed` : ""}
          </p>
        </div>
        <div className="mxs-actions">
          <button className="mx-btn mx-btn--ghost mxs-btn" onClick={loadJobs}>
            <Refresh size={12} />
            {t("schedules.refresh")}
          </button>
          <button
            className="mx-btn mx-btn--primary mxs-btn"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={12} />
            {t("schedules.newTask")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mxs-error">
          <span>{error}</span>
          <button
            className="mxs-error-dismiss"
            aria-label={t("common.dismiss")}
            onClick={() => setError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="schedules-empty">
          <p className="schedules-empty-text">{t("schedules.empty")}</p>
          <p className="schedules-empty-hint">{t("schedules.emptyHint")}</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} />
            {t("schedules.firstTask")}
          </button>
        </div>
      ) : (
        <div className="mxs-list">
          {jobs.map((job) => {
            const human = humanSchedule(job.schedule);
            const stateChip =
              job.state === "active"
                ? "mx-chip mx-chip--ok"
                : job.state === "paused"
                  ? "mx-chip mx-chip--warn"
                  : "mx-chip";
            const stateLabel =
              job.state === "active"
                ? t("schedules.active")
                : job.state === "paused"
                  ? t("schedules.paused")
                  : t("schedules.completed");
            const toggleLabel =
              job.state === "paused"
                ? t("schedules.resume")
                : t("schedules.pause");
            return (
              <article
                key={job.id}
                className={`mx-card mxs-row${
                  job.state === "paused" ? " mxs-row--paused" : ""
                }`}
              >
                <div className="mxs-row-top">
                  <div className="mxs-row-name">
                    <b className="mxs-name">{job.name}</b>
                    <code className="mxs-cron">{job.schedule}</code>
                    {human && <span className="mx-meta">{human}</span>}
                  </div>
                  <div className="mxs-row-actions">
                    <span className={`${stateChip} mxs-state`}>
                      {stateLabel}
                    </span>
                    {job.state !== "completed" && (
                      <button
                        type="button"
                        className="mx-icon-btn"
                        aria-label={toggleLabel}
                        title={toggleLabel}
                        onClick={() => handleToggle(job)}
                        disabled={actionInProgress === job.id}
                      >
                        {job.state === "paused" ? (
                          <Play size={12} />
                        ) : (
                          <Pause size={12} />
                        )}
                      </button>
                    )}
                    {job.state === "active" && (
                      <button
                        type="button"
                        className="mx-icon-btn"
                        aria-label={t("schedules.triggerNow")}
                        title={t("schedules.triggerNow")}
                        onClick={() => handleTrigger(job.id)}
                        disabled={actionInProgress === job.id}
                      >
                        <Zap size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="mx-icon-btn"
                      aria-label={t("schedules.delete")}
                      title={t("schedules.delete")}
                      onClick={() => setConfirmDelete(job.id)}
                      disabled={actionInProgress === job.id}
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>

                {job.prompt && <p className="mxs-prompt">{job.prompt}</p>}

                <div className="mx-meta mxs-row-meta">
                  <span>
                    {t("schedules.nextRun")}{" "}
                    <b className="mxs-time">{formatTime(job.next_run_at)}</b>
                  </span>
                  {job.last_run_at && (
                    <span>
                      {t("schedules.lastRun")} {formatTime(job.last_run_at)}
                      {job.last_status === "ok" && (
                        <span className="mxs-ok" aria-label="ok">
                          {" "}
                          ✓
                        </span>
                      )}
                      {job.last_status && job.last_status !== "ok" && (
                        <span className="mxs-err-icon">
                          {" "}
                          <Alert size={12} />
                        </span>
                      )}
                    </span>
                  )}
                  {job.repeat && job.repeat.times && (
                    <span>
                      {t("schedules.runCount")}: {job.repeat.completed}/
                      {job.repeat.times}
                    </span>
                  )}
                  {job.deliver.length > 0 &&
                    !(
                      job.deliver.length === 1 && job.deliver[0] === "local"
                    ) && <span>→ {job.deliver.join(", ")}</span>}
                  {job.skills.length > 0 && (
                    <span>
                      {t("schedules.skills")}: {job.skills.join(", ")}
                    </span>
                  )}
                </div>

                {job.last_error && (
                  <div className="mxs-error-text">{job.last_error}</div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Schedules;
