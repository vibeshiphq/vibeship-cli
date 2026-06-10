import { afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeArgv,
  starterCloneRecoveryActions,
  starterCloneSources,
} from "./program.js";

describe("program argv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("drops the pnpm dev separator before parsing", () => {
    expect(normalizeArgv(["node", "cli", "--", "--help"])).toEqual([
      "node",
      "cli",
      "--help",
    ]);
  });

  it("leaves regular argv untouched", () => {
    expect(normalizeArgv(["node", "cli", "doctor"])).toEqual([
      "node",
      "cli",
      "doctor",
    ]);
  });

  it("tries SSH and HTTPS starter clone URLs by default", () => {
    expect(starterCloneSources()).toEqual([
      {
        label: "ssh",
        url: "git@github.com:vibeshiphq/vibeship-starter.git",
      },
      {
        label: "https",
        url: "https://github.com/vibeshiphq/vibeship-starter.git",
      },
    ]);
  });

  it("allows support to override the starter clone URL", () => {
    expect(starterCloneSources("https://example.com/custom.git")).toEqual([
      { label: "custom", url: "https://example.com/custom.git" },
    ]);

    vi.stubEnv("VIBESHIP_STARTER_REPO_URL", "file:///tmp/starter.git");
    expect(starterCloneSources()).toEqual([
      { label: "custom", url: "file:///tmp/starter.git" },
    ]);
  });

  it("explains GitHub access recovery when clone fails", () => {
    expect(
      starterCloneRecoveryActions([
        {
          label: "ssh",
          url: "git@github.com:vibeshiphq/vibeship-starter.git",
          message: "Permission denied",
        },
      ]).join("\n"),
    ).toContain("GitHub repository access benefit");
  });
});
