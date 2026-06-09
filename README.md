# VibeShip CLI

Public CLI for initializing the private VibeShip starter and installing VibeShip Pilot for guided setup.

```bash
pnpm install
pnpm build
pnpm dev -- doctor
```

The CLI does not embed proprietary setup runbooks. It authenticates the user, checks starter/Pilot entitlement through VibeShip, clones the private starter, and writes local Codex MCP config for Pilot.
