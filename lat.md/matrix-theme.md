# Matrix theme

Matrix is the default dark theme: phosphor green on near-black, monospace throughout, matching the Matrix Desktop design canvas.

It is a normal entry in `THEMES` ([[src/renderer/src/constants.ts]]) with a `[data-theme="matrix"]` token block in `src/renderer/src/assets/main.css`, and `DEFAULT_DARK_THEME` points at it, so the "System" setting on a dark OS and a fresh install both land on Matrix. Users who saved another theme keep it.

## Shell styling

The sidebar, footer actions, status strip and Home empty state get their Matrix look from rules scoped to `[data-theme="matrix"]` at the end of `main.css`, so every other theme renders exactly as before.

The Matrix rules paint the sidebar and status strip opaque, overriding the macOS vibrancy transparency described in [[window-chrome#Translucent sidebar (macOS vibrancy)]] for this theme only. Monospace is applied by re-pointing `--font-sans` on `body` (and setting the family on `body` and form controls), because [[src/renderer/src/components/FontProvider.tsx]] writes `--font-sans` inline on `<html>`, which a `[data-theme]` rule on the same element cannot override.

## Shared mx- classes

Screens restyled for Matrix Desktop opt into `mx-` building blocks (`mx-btn`, `mx-chip`, `mx-card`, `mx-tabs`/`mx-tab`, `mx-search`, `mx-pill`, `mx-h1`, `mx-page`) defined after the shell rules.

They read only theme tokens (plus optional `--mx-*` accents that fall back to standard tokens), so a screen using them still renders correctly under every theme. Screen-specific CSS lives in a file next to the screen, not in `main.css`.
