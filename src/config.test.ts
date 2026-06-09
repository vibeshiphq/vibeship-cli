import { describe, expect, it } from "vitest";

import { defaultApiUrl, defaultPilotMcpUrl } from "./config.js";

describe("defaults", () => {
  it("uses production VibeShip endpoints by default", () => {
    expect(defaultApiUrl()).toBe("https://vibeship.dev");
    expect(defaultPilotMcpUrl()).toBe("https://pilot.vibeship.dev/mcp");
  });
});
