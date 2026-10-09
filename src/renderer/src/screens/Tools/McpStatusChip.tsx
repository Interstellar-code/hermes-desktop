import type React from "react";

interface McpStatusChipProps {
  enabled: boolean;
  toolCount: number | undefined;
}

export function McpStatusChip({
  enabled,
  toolCount,
}: McpStatusChipProps): React.JSX.Element {
  if (!enabled) {
    return <span className="mx-chip">off</span>;
  }
  if (toolCount === undefined) {
    return <span className="mx-chip">not tested</span>;
  }
  return (
    <span className="mx-chip mx-chip--ok">
      <span aria-hidden="true">●</span>
      {toolCount} {toolCount === 1 ? "tool" : "tools"}
    </span>
  );
}
