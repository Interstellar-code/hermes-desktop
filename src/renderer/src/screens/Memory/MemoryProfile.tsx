import { useState } from "react";
import { useI18n } from "../../components/useI18n";

interface MemoryProfileProps {
  content: string;
  charLimit: number;
  profile?: string;
  onRefresh: () => void;
}

export function MemoryProfile({
  content: initialContent,
  charLimit,
  profile,
  onRefresh,
}: MemoryProfileProps): React.JSX.Element {
  const { t } = useI18n();
  const [userContent, setUserContent] = useState(initialContent);
  const [userEditing, setUserEditing] = useState(false);
  const [userSaved, setUserSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(): Promise<void> {
    setError("");
    const result = await window.hermesAPI.writeUserProfile(
      userContent,
      profile,
    );
    if (result.success) {
      setUserEditing(false);
      setUserSaved(true);
      setTimeout(() => setUserSaved(false), 2000);
      onRefresh();
    } else {
      setError(result.error || t("memory.saveFailed"));
    }
  }

  return (
    <div className="memory-profile mx-memory">
      <div className="memory-profile-header">
        <span className="memory-profile-hint mx-sub">
          {t("memory.userProfileHint")}
        </span>
        {userSaved && (
          <span className="mx-chip mx-chip--ok">{t("common.saved")}</span>
        )}
      </div>

      {error && <div className="memory-error">{error}</div>}

      <textarea
        className="memory-profile-textarea"
        value={userContent}
        onChange={(e) => {
          setUserContent(e.target.value);
          setUserEditing(true);
        }}
        placeholder={t("memory.userProfilePlaceholder")}
        aria-label={t("memory.userProfile")}
        rows={8}
      />
      <div className="memory-profile-footer">
        <span className="memory-entry-chars mx-meta">
          {t("memory.chars", { count: userContent.length })} / {charLimit}{" "}
          {t("memory.chars", { count: 1 }).split(" ")[1]}
        </span>
        {userEditing && (
          <button
            type="button"
            className="mx-btn mx-btn--primary"
            onClick={handleSave}
          >
            {t("memory.saveProfile")}
          </button>
        )}
      </div>
    </div>
  );
}
