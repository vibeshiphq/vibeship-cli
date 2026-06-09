import React from "react";
import { Box, Text, render } from "ink";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        VibeShip Pilot
      </Text>
      {subtitle ? <Text color="gray">{subtitle}</Text> : null}
    </Box>
  );
}

export function StatusLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Text>
      <Text color="gray">{label}: </Text>
      {value}
    </Text>
  );
}

export function renderDone(title: string, lines: Array<[string, string]>) {
  const instance = render(
    <Box flexDirection="column">
      <Logo subtitle={title} />
      {lines.map(([label, value]) => (
        <StatusLine key={label} label={label} value={value} />
      ))}
    </Box>,
  );
  instance.unmount();
}
