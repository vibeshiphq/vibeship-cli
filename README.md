# VibeShip CLI

Public CLI for initializing the private VibeShip starter and installing VibeShip Pilot for guided setup.

```bash
pnpm install
pnpm build
pnpm dev -- doctor
```

The CLI does not embed proprietary setup runbooks. It authenticates the user, checks starter/Pilot entitlement through VibeShip, clones the private starter, and writes local Codex MCP config for Pilot.

## Local Dogfood

Run the internal app first:

```bash
cd ~/projects/vibeship-workspace/internal
pnpm dev
```

Then log in from the CLI repo:

```bash
cd ~/projects/vibeship-workspace/cli
pnpm dev login
```

When invoked through the `dev` script, the CLI uses `http://localhost:3000` as the VibeShip API URL. A built CLI uses the production VibeShip URL by default. Override either path with `VIBESHIP_API_URL` or `--api-url`.
