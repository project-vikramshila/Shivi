# Shivi AI Deployment Guide

This guide covers production packaging, updates, monitoring, crash recovery, and release automation for Shivi AI.

## Production Packaging

- Use `npm run build` to compile the code.
- Use `npm run dist` to package the Windows installer and portable build.
- Build artifacts are emitted to `dist_electron/`.
- Packaging is configured via `electron-builder.yml`.

## Installation

- Windows users install Shivi from the generated `.exe` installer.
- Portable builds are available through the `Portable` target.

## Auto Updates

- Shivi supports stable, beta, and development update channels.
- The update channel is controlled by `UPDATE_CHANNEL`.
- Auto-update behavior is managed by `src/updates/autoUpdater.ts`.

## Monitoring & Crash Reporting

- Local diagnostics and structured logs are written to `logs/shivi.log`.
- Crash reports are captured by `src/monitoring/crashReporter.ts`.
- Optional remote reporting is enabled via `CRASH_REPORT_URL`.

## Release Pipeline

- `CI` workflow validates builds and tests on every push and PR.
- `Release` workflow packages and publishes GitHub releases on semantic version tags.
- Deployments are generated as GitHub Draft Releases for manual review.

## Security & Hardening

- Renderer security is enforced through `src/security/hardening.ts`.
- Environment variables are loaded securely in `src/security/envManager.ts`.
- Sensitive API keys are never exposed to the renderer.

## Crash Recovery

- Session state is saved and restored through `src/recovery/recoveryManager.ts`.
- Core recovery state is persisted under the app user data directory.

## Plugin Deployment

- Plugin validation and state management are defined in `src/updates/pluginUpdateManager.ts`.
- Plugin manifests are validated before activation.

## Recommended Release Flow

1. Create a release branch.
2. Run full `npm test` and `npm run build` locally.
3. Tag the release with `vX.Y.Z`.
4. Push the tag to GitHub.
5. Review generated artifacts in the GitHub Release draft.
6. Publish when verified.
