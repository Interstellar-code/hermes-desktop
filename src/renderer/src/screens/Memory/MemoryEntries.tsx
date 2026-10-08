import { useMemo, useState } from "react";
import { Plus, Trash } from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import type { MemoryEntry } from "./types";

interface MemoryEntriesProps {
  entries: MemoryEntry[];
  profile?: string;
  onRefresh: () => void;
}

export function MemoryEntries({
  entries,
  profile,
  onRefresh,
}: MemoryEntriesProps): React.JSX.Element {
  const { t } = useI18n();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      entry.content.toLowerCase().includes(needle),
    );
  }, [entries, query]);

  async function handleAddEntry(): Promise<void> {
    if (!newEntry.trim()) return;
    setError("");
    const result = await window.hermesAPI.addMemoryEntry(
      newEntry.trim(),
      profile,
    );
    if (result.success) {
      setNewEntry("");
      setShowAdd(false);
      onRefresh();
    } else {
      setError(result.error || t("memory.addFailed"));
    }
  }

  async function handleSaveEdit(): Promise<void> {
    if (editingIndex === null) return;
    setError("");
    const result = await window.hermesAPI.updateMemoryEntry(
      editingIndex,
      editContent.trim(),
      profile,
    );
    if (result.success) {
      setEditingIndex(null);
      setEditContent("");
      onRefresh();
    } else {
      setError(result.error || t("memory.updateFailed"));
    }
  }

  async function handleDeleteEntry(index: number): Promise<void> {
    await window.hermesAPI.removeMemoryEntry(index, profile);
    setConfirmDelete(null);
    onRefresh();
  }

  return (
    <div className="memory-entries mx-memory">
      <div className="memory-entries-header">
        <span className="memory-entries-count mx-meta">
          {t("memory.entries", { count: entries.length })}
        </span>
        <label className="mx-search mx-entries-search">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search memories…"
            aria-label="Search memories"
          />
        </label>
        <button
          type="button"
          className="mx-btn mx-btn--primary"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={13} />
          {t("memory.addMemory")}
        </button>
      </div>

      {error && <div className="memory-error">{error}</div>}

      {showAdd && (
        <div className="memory-entry-form mx-entry-form">
          <textarea
            className="memory-entry-textarea"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder={t("memory.entriesPlaceholder")}
            rows={3}
            aria-label={t("memory.addMemory")}
            autoFocus
          />
          <div className="memory-entry-form-actions">
            <span className="memory-entry-chars mx-meta">
              {newEntry.length} chars
            </span>
            <button
              type="button"
              className="mx-btn mx-btn--ghost"
              onClick={() => {
                setShowAdd(false);
                setNewEntry("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mx-btn mx-btn--primary"
              onClick={handleAddEntry}
              disabled={!newEntry.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="memory-empty mx-entries-empty">
          <p>{t("memory.noMemoriesYet")}</p>
          <p className="memory-empty-hint">{t("memory.addManuallyHint")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="memory-empty mx-entries-empty">
          <p>No memories match this search.</p>
        </div>
      ) : (
        <div className="mx-entry-list">
          {filtered.map((entry) => (
            <div
              key={entry.index}
              className="memory-entry-card mx-card mx-entry-card"
            >
              {editingIndex === entry.index ? (
                <div className="memory-entry-form mx-entry-form">
                  <textarea
                    className="memory-entry-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    aria-label={t("memory.edit")}
                    rows={3}
                    autoFocus
                  />
                  <div className="memory-entry-form-actions">
                    <span className="memory-entry-chars mx-meta">
                      {t("memory.chars", { count: editContent.length })}
                    </span>
                    <button
                      type="button"
                      className="mx-btn mx-btn--ghost"
                      onClick={() => setEditingIndex(null)}
                    >
                      {t("memory.cancel")}
                    </button>
                    <button
                      type="button"
                      className="mx-btn mx-btn--primary"
                      onClick={handleSaveEdit}
                    >
                      {t("memory.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="memory-entry-content">{entry.content}</div>
                  <div className="memory-entry-actions">
                    <button
                      type="button"
                      className="mx-btn mx-btn--ghost mx-btn--sm"
                      onClick={() => {
                        setEditingIndex(entry.index);
                        setEditContent(entry.content);
                      }}
                    >
                      {t("memory.edit")}
                    </button>
                    {confirmDelete === entry.index ? (
                      <span className="memory-entry-confirm">
                        {t("memory.deleteConfirm")}
                        <button
                          type="button"
                          className="mx-btn mx-btn--sm mx-btn--danger"
                          onClick={() => handleDeleteEntry(entry.index)}
                        >
                          {t("memory.yes")}
                        </button>
                        <button
                          type="button"
                          className="mx-btn mx-btn--ghost mx-btn--sm"
                          onClick={() => setConfirmDelete(null)}
                        >
                          {t("memory.no")}
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="mx-icon-btn"
                        onClick={() => setConfirmDelete(entry.index)}
                        aria-label="Delete memory"
                        title="Delete memory"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
