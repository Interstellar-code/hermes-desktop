import { memo } from "react";
import { fmtTokens, type ContextUsage } from "./ContextGauge";

interface ChatHeaderProps {
  /** Model label for this conversation. Already resolved by the caller to a
   *  non-empty display string (it falls back to an i18n "no model" string). */
  model: string;
  /** Latest turn's context occupancy; null until the first response. */
  contextUsage: ContextUsage | null;
}

/**
 * Status line above the transcript: the conversation's model on the left, the
 * context token count on the right. Session tabs live in the window title bar
 * (lat.md/window-chrome), so this is a status line only — never a tab strip.
 */
export const ChatHeader = memo(function ChatHeader({
  model,
  contextUsage,
}: ChatHeaderProps): React.JSX.Element {
  return (
    <div className="mx-chat-header">
      <span className="mx-chat-header-model" title={model}>
        {model}
      </span>
      <span className="mx-chat-header-spacer" />
      {contextUsage && contextUsage.used > 0 && (
        <span className="mx-chip mx-chip--info">
          {fmtTokens(contextUsage.used)} tok
        </span>
      )}
    </div>
  );
});
