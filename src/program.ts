import fs from "node:fs";
import path from "node:path";

import { Command } from "commander";
import { execa } from "execa";
import open from "open";

import { fetchEntitlements } from "./api.js";
import {
  clearAuth,
  defaultApiUrl,
  defaultPilotMcpUrl,
  readConfig,
  requireAuth,
  writeConfig,
} from "./config.js";
import { installPilotCodexConfig } from "./codex.js";
import { startBrowserLogin } from "./login.js";
import { renderDone } from "./ui.js";

async function commandLogin(options: {
  token?: string;
  email?: string;
  apiUrl?: string;
}) {
  const config = readConfig();
  const apiUrl = options.apiUrl ?? config.apiUrl ?? defaultApiUrl();

  if (!options.token) {
    const login = await startBrowserLogin({ apiUrl });
    console.log(`Opening ${login.loginUrl}`);
    await open(login.loginUrl);
    console.log("Waiting for browser login callback...");
    const result = await login.waitForResult;
    await login.close();

    writeConfig({
      ...config,
      apiUrl,
      auth: {
        token: result.token,
        email: result.email ?? options.email,
        expiresAt: result.expiresAt,
      },
    });
    renderDone("Logged in", [
      ["config", "~/.vibeship/config.json"],
      ["api", apiUrl],
      ["email", result.email ?? options.email ?? "unknown"],
      ["expires", result.expiresAt ?? "unknown"],
    ]);
    return;
  }

  writeConfig({
    ...config,
    apiUrl,
    auth: {
      token: options.token,
      email: options.email,
    },
  });
  renderDone("Logged in", [
    ["config", "~/.vibeship/config.json"],
    ["api", apiUrl],
  ]);
}

async function commandWhoami() {
  const config = readConfig();
  const auth = requireAuth(config);
  const status = await fetchEntitlements({
    apiUrl: config.apiUrl ?? defaultApiUrl(),
    auth,
  });
  renderDone("Account", [
    ["email", status.email ?? auth.email ?? "unknown"],
    ["starter", status.starterAccess ? "yes" : "no"],
    ["pilot", status.pilotActive ? "active" : "inactive"],
  ]);
}

async function commandDoctor(options: { projectDir?: string }) {
  const config = readConfig();
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const marker = path.join(projectDir, ".vibeship", "project.json");
  const codexConfig = path.join(projectDir, ".codex", "config.toml");

  renderDone("Doctor", [
    ["auth", config.auth?.token ? "present" : "missing"],
    ["project", fs.existsSync(marker) ? "vibeship starter" : "not detected"],
    ["pilot config", fs.existsSync(codexConfig) ? codexConfig : "not installed"],
  ]);
}

async function cloneStarter({
  targetDir,
  localStarter,
}: {
  targetDir: string;
  localStarter?: string;
}) {
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`${targetDir} already exists and is not empty.`);
  }

  if (localStarter) {
    await execa("cp", ["-R", `${path.resolve(localStarter)}/.`, targetDir]);
    return;
  }

  await execa("git", [
    "clone",
    "git@github.com:vibeshiphq/vibeship-starter.git",
    targetDir,
  ]);
}

async function commandInit(options: {
  dir?: string;
  localStarter?: string;
  skipInstall?: boolean;
}) {
  const config = readConfig();
  const auth = requireAuth(config);
  const status = await fetchEntitlements({
    apiUrl: config.apiUrl ?? defaultApiUrl(),
    auth,
  });

  if (!status.starterAccess) {
    throw new Error("This account does not have VibeShip starter access.");
  }

  const targetDir = path.resolve(options.dir ?? "vibeship-app");
  await cloneStarter({ targetDir, localStarter: options.localStarter });

  if (!options.skipInstall) {
    await execa("pnpm", ["install"], { cwd: targetDir, stdio: "inherit" });
  }

  renderDone("Starter initialized", [
    ["directory", targetDir],
    ["next", `cd ${targetDir} && vibeship pilot install`],
  ]);
}

async function commandPilotInstall(options: {
  projectDir?: string;
  mcpUrl?: string;
}) {
  const config = readConfig();
  const auth = requireAuth(config);
  const status = await fetchEntitlements({
    apiUrl: config.apiUrl ?? defaultApiUrl(),
    auth,
  });

  if (!status.pilotActive) {
    throw new Error("This account does not have an active VibeShip Pilot subscription.");
  }

  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const mcpUrl = options.mcpUrl ?? config.pilotMcpUrl ?? defaultPilotMcpUrl();
  const file = installPilotCodexConfig({ projectDir, mcpUrl });

  renderDone("Pilot installed", [
    ["config", file],
    ["mcp", mcpUrl],
    ["env", "export VIBESHIP_PILOT_TOKEN=$(vibeship whoami --token-only)"],
  ]);
}

async function commandPilotStatus(options: { projectDir?: string }) {
  const config = readConfig();
  const auth = requireAuth(config);
  const status = await fetchEntitlements({
    apiUrl: config.apiUrl ?? defaultApiUrl(),
    auth,
  });
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const codexConfig = path.join(projectDir, ".codex", "config.toml");

  renderDone("Pilot status", [
    ["subscription", status.pilotActive ? "active" : "inactive"],
    ["config", fs.existsSync(codexConfig) ? codexConfig : "missing"],
  ]);
}

export async function run(argv: string[]) {
  const program = new Command();
  program
    .name("vibeship")
    .description("Initialize VibeShip starter repos and install VibeShip Pilot.")
    .version("0.1.0");

  program
    .command("login")
    .option("--token <token>", "CLI token issued by VibeShip")
    .option("--email <email>", "Email to store with a development token")
    .option("--api-url <url>", "VibeShip API URL")
    .action(commandLogin);

  program.command("logout").action(() => {
    clearAuth();
    renderDone("Logged out", [["config", "~/.vibeship/config.json"]]);
  });

  program
    .command("whoami")
    .option("--token-only", "Print the stored CLI token only")
    .action((options: { tokenOnly?: boolean }) => {
      if (options.tokenOnly) {
        process.stdout.write(`${requireAuth(readConfig()).token}\n`);
        return;
      }

      return commandWhoami();
    });

  program
    .command("doctor")
    .option("--project-dir <dir>", "Project directory", process.cwd())
    .action(commandDoctor);

  program
    .command("init")
    .option("--dir <dir>", "Target directory")
    .option("--local-starter <dir>", "Use a local starter checkout")
    .option("--skip-install", "Skip pnpm install")
    .action(commandInit);

  const pilot = program.command("pilot");
  pilot
    .command("install")
    .option("--project-dir <dir>", "Project directory", process.cwd())
    .option("--mcp-url <url>", "Pilot MCP URL")
    .action(commandPilotInstall);
  pilot
    .command("status")
    .option("--project-dir <dir>", "Project directory", process.cwd())
    .action(commandPilotStatus);

  await program.parseAsync(argv);
}
