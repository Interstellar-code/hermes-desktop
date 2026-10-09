import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const { TEST_HOME, aliveGatewayPids } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("os");
  return {
    TEST_HOME: path.join(os.tmpdir(), `hermes-gateway-info-${Date.now()}`),
    aliveGatewayPids: new Set<number>(),
  };
});

vi.mock("../src/main/installer", () => ({
  HERMES_HOME: TEST_HOME,
  HERMES_PYTHON: process.execPath,
  HERMES_REPO: TEST_HOME,
  hermesCliArgs: vi.fn(),
  getEnhancedPath: () => process.env.PATH || "",
}));

vi.mock("../src/main/config", () => ({
  getModelConfig: () => ({ model: "m", provider: "openrouter" }),
  getApiServerKey: () => "",
  readEnv: () => ({}),
  getConnectionConfig: () => ({ mode: "local" }),
  getConfigValue: () => "",
  setConfigValue: vi.fn(),
}));

vi.mock("../src/main/ssh-tunnel", () => ({
  getSshTunnelUrl: () => null,
  isSshTunnelActive: () => false,
  isSshTunnelHealthy: () => Promise.resolve(false),
  startSshTunnel: () => Promise.resolve(),
}));

vi.mock("../src/main/utils", () => ({
  stripAnsi: (s: string) => s,
  pidIsAliveAs: (pid: number) => aliveGatewayPids.has(pid),
  getActiveProfileNameSync: () => "default",
  normalizeProfileName: (profile?: string) =>
    !profile || profile === "default" ? undefined : profile,
  profileHome: (profile?: string) =>
    profile ? join(TEST_HOME, "profiles", profile) : TEST_HOME,
  profilePaths: (profile?: string) => {
    const home = profile ? join(TEST_HOME, "profiles", profile) : TEST_HOME;
    return {
      home,
      configFile: join(home, "config.yaml"),
      envFile: join(home, ".env"),
      authFile: join(home, "auth.json"),
    };
  },
}));

vi.mock("../src/main/gateway-ports", () => ({
  getProfilePort: vi.fn(() => 8642),
}));
vi.mock("../src/main/models", () => ({ readModels: () => [] }));
vi.mock("../src/main/process-options", () => ({
  HIDDEN_SUBPROCESS_OPTIONS: {},
}));

import { gatewayInfo } from "../src/main/hermes";

describe("gatewayInfo", () => {
  beforeEach(() => {
    mkdirSync(TEST_HOME, { recursive: true });
    aliveGatewayPids.clear();
  });
  afterEach(() => {
    rmSync(TEST_HOME, { recursive: true, force: true });
  });

  it("returns nulls when no gateway is running", () => {
    expect(gatewayInfo()).toEqual({
      running: false,
      pid: null,
      startedAt: null,
      port: null,
    });
  });

  it("reads pid, pid-file time and port for a running gateway", () => {
    const pidFile = join(TEST_HOME, "gateway.pid");
    writeFileSync(pidFile, "4242");
    aliveGatewayPids.add(4242);
    expect(gatewayInfo()).toEqual({
      running: true,
      pid: 4242,
      startedAt: statSync(pidFile).mtimeMs,
      port: 8642,
    });
  });

  it("treats a stale pid file as not running", () => {
    writeFileSync(join(TEST_HOME, "gateway.pid"), "4242");
    expect(gatewayInfo().running).toBe(false);
    expect(gatewayInfo().pid).toBeNull();
  });
});
