import { useId, useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { useI18n } from "../../components/useI18n";
import type { MemoryProviderInfo } from "./types";

// [SECURITY 2026-07-03] Escape a runtime value before it is interpolated into a
// translation string rendered via dangerouslySetInnerHTML. The translation
// markup itself is trusted; only the runtime provider value must be escaped.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PROVIDER_URLS: Record<string, string> = {
  honcho: "https://app.honcho.dev",
  hindsight: "https://ui.hindsight.vectorize.io",
  mem0: "https://app.mem0.ai",
  retaindb: "https://retaindb.com",
  supermemory: "https://supermemory.ai",
  byterover: "https://app.byterover.dev",
};

interface MemoryProvidersProps {
  providers: MemoryProviderInfo[];
  activeProvider: string | null;
  profile?: string;
  onRefresh: () => void;
}

function ProviderKeyFields({
  provider,
  providerEnv,
  providerSavedKey,
  setProviderEnv,
  setProviderSavedKey,
  profile,
  t,
}: {
  provider: MemoryProviderInfo;
  providerEnv: Record<string, string>;
  providerSavedKey: string | null;
  setProviderEnv: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setProviderSavedKey: (key: string | null) => void;
  profile?: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  // The same provider can be mounted twice (Memory screen + profile modal), so
  // ids must not be derived from the provider name alone.
  const fieldIdPrefix = useId();
  return (
    <div className="memory-provider-fields mx-provider-fields">
      {provider.envVars.map((envKey) => {
        const inputId = `${fieldIdPrefix}-${envKey}`;
        return (
          <div key={envKey} className="memory-provider-field">
            <label className="memory-provider-field-label" htmlFor={inputId}>
              {envKey}
              {providerSavedKey === envKey && (
                <span className="mx-chip mx-chip--ok">{t("common.saved")}</span>
              )}
            </label>
            <input
              id={inputId}
              className="input"
              type="password"
              value={providerEnv[envKey] || ""}
              onChange={(e) =>
                setProviderEnv((prev) => ({
                  ...prev,
                  [envKey]: e.target.value,
                }))
              }
              onBlur={async () => {
                await window.hermesAPI.setEnv(
                  envKey,
                  providerEnv[envKey] || "",
                  profile,
                );
                setProviderSavedKey(envKey);
                setTimeout(() => setProviderSavedKey(null), 2000);
              }}
              placeholder={t("memory.enterEnvKey", { key: envKey })}
            />
          </div>
        );
      })}
    </div>
  );
}

export function MemoryProviders({
  providers,
  activeProvider,
  profile,
  onRefresh,
}: MemoryProvidersProps): React.JSX.Element {
  const { t } = useI18n();
  const [currentProvider, setCurrentProvider] = useState(activeProvider);
  const [providerList, setProviderList] = useState(providers);
  const [providerEnv, setProviderEnv] = useState<Record<string, string>>({});
  const [providerSavedKey, setProviderSavedKey] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  async function handleActivate(name: string): Promise<void> {
    setActivating(name);
    await window.hermesAPI.setConfig("memory.provider", name, profile);
    setCurrentProvider(name);
    setProviderList((prev) =>
      prev.map((p) => ({ ...p, active: p.name === name })),
    );
    setActivating(null);
    onRefresh();
  }

  async function handleDeactivate(): Promise<void> {
    setActivating("deactivate");
    await window.hermesAPI.setConfig("memory.provider", "", profile);
    setCurrentProvider(null);
    setProviderList((prev) => prev.map((p) => ({ ...p, active: false })));
    setActivating(null);
    onRefresh();
  }

  const activeCard = providerList.find((p) => p.active) ?? null;
  const inactiveCards = providerList.filter((p) => !p.active);

  return (
    <div className="memory-providers mx-providers mx-memory">
      <div className="memory-providers-hint">
        {t("memory.providersHint")}
        {currentProvider ? (
          <span
            dangerouslySetInnerHTML={{
              __html: t("memory.providersHintActive", {
                provider: escapeHtml(currentProvider),
              }),
            }}
          />
        ) : (
          <span> {t("memory.providersHintInactive")}</span>
        )}
      </div>

      {providerList.length === 0 ? (
        <div className="memory-empty mx-entries-empty">
          <p>{t("memory.noProvidersFound")}</p>
        </div>
      ) : (
        <>
          {activeCard && (
            <div className="memory-provider-card mx-card mx-provider-active-card memory-provider-active">
              <span className="mx-provider-dot" aria-hidden="true" />
              <div className="mx-provider-body">
                <div className="mx-provider-title">
                  <b>{activeCard.name}</b>
                  <span className="memory-provider-badge mx-chip mx-chip--ok">
                    <Check size={10} /> {t("memory.active")}
                  </span>
                  {PROVIDER_URLS[activeCard.name] && (
                    <button
                      type="button"
                      className="mx-provider-docs"
                      onClick={() =>
                        window.hermesAPI.openExternal(
                          PROVIDER_URLS[activeCard.name],
                        )
                      }
                      aria-label={t("memory.openProviderWebsite")}
                      title={t("memory.openProviderWebsite")}
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
                <span className="memory-provider-desc">
                  {t(activeCard.description)}
                </span>
                {activeCard.envVars.length > 0 && (
                  <ProviderKeyFields
                    provider={activeCard}
                    providerEnv={providerEnv}
                    providerSavedKey={providerSavedKey}
                    setProviderEnv={setProviderEnv}
                    setProviderSavedKey={setProviderSavedKey}
                    profile={profile}
                    t={t}
                  />
                )}
              </div>
              <div className="memory-provider-actions">
                <button
                  type="button"
                  className="mx-btn mx-btn--ghost"
                  onClick={handleDeactivate}
                  disabled={activating !== null}
                >
                  {t("memory.deactivate")}
                </button>
              </div>
            </div>
          )}

          <div className="memory-providers-grid mx-providers-grid">
            {inactiveCards.map((p) => (
              <div key={p.name} className="memory-provider-card mx-card">
                <div className="memory-provider-header">
                  <div className="memory-provider-name">{p.name}</div>
                  {PROVIDER_URLS[p.name] && (
                    <button
                      type="button"
                      className="mx-provider-docs"
                      onClick={() =>
                        window.hermesAPI.openExternal(PROVIDER_URLS[p.name])
                      }
                      aria-label={t("memory.openProviderWebsite")}
                      title={t("memory.openProviderWebsite")}
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
                <span className="memory-provider-desc">{t(p.description)}</span>

                {p.envVars.length > 0 && (
                  <ProviderKeyFields
                    provider={p}
                    providerEnv={providerEnv}
                    providerSavedKey={providerSavedKey}
                    setProviderEnv={setProviderEnv}
                    setProviderSavedKey={setProviderSavedKey}
                    profile={profile}
                    t={t}
                  />
                )}

                <div className="memory-provider-actions">
                  <button
                    type="button"
                    className="mx-btn mx-btn--primary mx-btn--sm"
                    onClick={() => handleActivate(p.name)}
                    disabled={activating !== null}
                  >
                    {activating === p.name
                      ? t("memory.activating")
                      : t("memory.activate")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-providers-footnote mx-meta">
            Only one provider is active at a time.
          </p>
        </>
      )}
    </div>
  );
}
