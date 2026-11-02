# Implementation Plan - Background Logo Integration & Frosted Glass CSS Enhancement

## User Requirements
- Integrate the app logo `Λ Ξ V O S` into the background as a subtle centered watermark in the workspace.
- Improve global background and CSS with a minimalist frosted glass dark surface theme.

## Proposed Changes

### 1. Global CSS (`/src/styles.css`)
- Enhance background styling with rich minimalist frosted glass utilities (`backdrop-blur-md`, subtle radial gradients in Digital Wabi Sabi palette `#0E1015`, `#6A0DAD`, `#20B2AA`, `#E0218A`).
- Add glowing backdrop highlights and noise/texture overlay classes.

### 2. Desktop Shell (`/src/app/components/desktop/desktop.component.ts`)
- Embed the subtle centered watermark `Λ Ξ V O S` with elegant typography (Comfortaa display font, low opacity, letter-spacing, and subtle glow) right in the center of the desktop workspace background.
- Ensure the watermark sits behind all application windows (`z-0`) so it never interferes with interaction, meeting WCAG AA accessibility standards.

## Verification Plan
- Compile applet with `compile_applet`.
- Verify linter with `lint_applet`.
- Run unit tests with `npm run test:unit`.
