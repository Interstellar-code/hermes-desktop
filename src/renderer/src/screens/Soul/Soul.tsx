import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Refresh } from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import { OrbLoader } from "../../components/OrbLoader";
import "./Soul.css";

interface SoulProps {
  profile?: string;
  /** Absolute path of the SOUL.md file, when the caller already knows it. */
  soulPath?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function Soul({ profile, soulPath }: SoulProps): React.JSX.Element {
  const { t } = useI18n();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSoul = useCallback(async (): Promise<void> => {
    loaded.current = false;
    setLoading(true);
    const text = await window.hermesAPI.readSoul(profile);
    setContent(text);
    setLoading(false);
    setTimeout(() => {
      loaded.current = true;
    }, 300);
  }, [profile]);

  useEffect(() => {
    loadSoul();
  }, [loadSoul]);

  const saveSoul = useCallback(
    async (text: string) => {
      if (!loaded.current) return;
      await window.hermesAPI.writeSoul(text, profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [profile],
  );

  useEffect(() => {
    if (!loaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSoul(content);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [content, saveSoul]);

  const size = useMemo(
    () => formatBytes(new TextEncoder().encode(content).length),
    [content],
  );

  async function handleReset(): Promise<void> {
    const newContent = await window.hermesAPI.resetSoul(profile);
    loaded.current = false;
    setContent(newContent);
    setShowReset(false);
    setSaved(true);
    setTimeout(() => {
      loaded.current = true;
      setSaved(false);
    }, 2000);
  }

  if (loading) {
    return (
      <div className="soul-container mx-soul">
        <div className="soul-loading">
          <OrbLoader state="searching" size={64} />
        </div>
      </div>
    );
  }

  return (
    <div className="soul-container mx-soul">
      <div className="soul-header">
        <div>
          <h2 className="soul-title">{t("soul.title")}</h2>
          <p className="soul-subtitle">{t("soul.subtitle")}</p>
        </div>
        <button
          type="button"
          className="mx-btn mx-btn--ghost"
          onClick={() => setShowReset(true)}
          title={t("soul.resetTitle")}
        >
          <Refresh size={14} />
          {t("soul.reset")}
        </button>
      </div>

      <div className="mx-soul-meta">
        <span className="mx-chip mx-soul-path" title={soulPath ?? "SOUL.md"}>
          {soulPath ?? "SOUL.md"}
        </span>
        <span className="mx-chip">{size}</span>
        {saved && (
          <span className="mx-chip mx-chip--ok">{t("common.saved")}</span>
        )}
      </div>

      {showReset && (
        <div className="soul-reset-confirm">
          <span>{t("soul.resetConfirm")}</span>
          <div className="soul-reset-actions">
            <button
              type="button"
              className="mx-btn mx-btn--primary mx-btn--sm"
              onClick={handleReset}
            >
              {t("soul.reset")}
            </button>
            <button
              type="button"
              className="mx-btn mx-btn--ghost mx-btn--sm"
              onClick={() => setShowReset(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <textarea
        className="soul-editor"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("soul.placeholder")}
        aria-label="SOUL.md"
        spellCheck={false}
      />

      <div className="mx-soul-footer">
        <span className="soul-hint">{t("soul.hint")}</span>
      </div>
    </div>
  );
}

export default Soul;
