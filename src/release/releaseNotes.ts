export const releaseNotesTemplate = ({ version, changes }: { version: string; changes: string[] }) => `# Shivi AI Release ${version}

## What’s new
${changes.map((item) => `- ${item}`).join('\n')}

## Notes
- Stable channel release
- Auto-update enabled for all consumers
- If you experience issues, please contact support@shivi.ai
`;
