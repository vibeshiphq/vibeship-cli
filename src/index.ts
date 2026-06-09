#!/usr/bin/env node
import { run } from "./program.js";

run(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`VibeShip CLI failed: ${message}`);
  process.exitCode = 1;
});
