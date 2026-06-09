import http from "node:http";

import { describe, expect, it } from "vitest";

import { createCliLoginUrl, startBrowserLogin } from "./login.js";

describe("browser login", () => {
  it("builds a local callback login URL", () => {
    expect(
      createCliLoginUrl({
        apiUrl: "http://localhost:3000",
        redirectUri: "http://127.0.0.1:49152/callback",
        state: "state_1",
      }),
    ).toBe(
      "http://localhost:3000/cli/login?redirect_uri=http%3A%2F%2F127.0.0.1%3A49152%2Fcallback&state=state_1",
    );
  });

  it("waits for a local browser callback", async () => {
    const session = await startBrowserLogin({
      apiUrl: "http://localhost:3000",
      timeoutMs: 2_000,
    });
    const url = new URL(session.loginUrl);
    const callbackUrl = new URL(url.searchParams.get("redirect_uri") ?? "");
    callbackUrl.searchParams.set("state", url.searchParams.get("state") ?? "");
    callbackUrl.searchParams.set("token", "token_1");
    callbackUrl.searchParams.set("email", "founder@example.com");
    callbackUrl.searchParams.set("expires_at", "2026-07-09T12:00:00.000Z");

    await new Promise<void>((resolve, reject) => {
      http
        .get(callbackUrl, (response) => {
          response.resume();
          response.on("end", resolve);
        })
        .on("error", reject);
    });

    await expect(session.waitForResult).resolves.toEqual({
      token: "token_1",
      email: "founder@example.com",
      expiresAt: "2026-07-09T12:00:00.000Z",
    });
    await session.close();
  });
});
