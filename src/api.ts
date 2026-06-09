import type { AuthState } from "./config.js";

export type EntitlementStatus = {
  email?: string;
  starterAccess: boolean;
  pilotActive: boolean;
  entitlements: string[];
};

export async function fetchEntitlements({
  apiUrl,
  auth,
}: {
  apiUrl: string;
  auth: AuthState;
}): Promise<EntitlementStatus> {
  if (process.env.VIBESHIP_CLI_OFFLINE === "1") {
    return {
      email: auth.email,
      starterAccess: true,
      pilotActive: true,
      entitlements: ["license:starter", "pilot:active"],
    };
  }

  const response = await fetch(new URL("/api/cli/entitlements", apiUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${auth.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Entitlement check failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as EntitlementStatus;
}
