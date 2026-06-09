import fs from "node:fs";
import path from "node:path";

export function projectCodexConfigPath(projectDir: string) {
  return path.join(projectDir, ".codex", "config.toml");
}

export function pilotCodexConfig({
  mcpUrl,
}: {
  mcpUrl: string;
}) {
  return `[mcp_servers.vibeship-pilot]
url = "${mcpUrl}"
bearer_token_env_var = "VIBESHIP_PILOT_TOKEN"
default_tools_approval_mode = "prompt"
`;
}

export function installPilotCodexConfig({
  projectDir,
  mcpUrl,
}: {
  projectDir: string;
  mcpUrl: string;
}) {
  const file = projectCodexConfigPath(projectDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const marker = "[mcp_servers.vibeship-pilot]";
  const next = existing.includes(marker)
    ? existing.replace(
        /\[mcp_servers\.vibeship-pilot\][\s\S]*?(?=\n\[|$)/,
        pilotCodexConfig({ mcpUrl }).trimEnd(),
      )
    : `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${pilotCodexConfig({
        mcpUrl,
      }).trimEnd()}\n`;

  fs.writeFileSync(file, next);
  return file;
}
