# Verdigris ambient desktop & aurora (shell host)

**Status:** Implemented (v1) — see `DesktopBackdropComponent`, `ShellThemeService`, `ShellChromeService`  
**Scope:** `ts/apps/host` live shell (`app.html`, statusbar, dock, backdrop)  
**Source of truth:** Verdigris Interface Protocol (colors, typography, Roman Glass, substrate aurora)

---

## 1. Goals

1. Replace dual blur orbs + ad-hoc radial stack with a **single Verdigris substrate aurora** (gunmetal base + imperial purple + roman aqua wash).
2. **Adaptive ambient brand (mode C):** empty desktop shows stage watermark; open windows hide watermark and restore header wordmark.
3. **Light and dark** appearance via `system_preferences.theme` (`light` | `dark` | `system`) and `data-theme` on `<html>`.
4. Align `@theme` / `:root` aliases with Verdigris MD3 tokens; keep **Λ Ξ V O S** identity accents (magenta on “O S”, header hex gradient) as shell branding layered on Verdigris—not aurora paint.

**Non-goals (v1):** WebGL/shaders, custom wallpaper URLs, empty-desktop CTA panel, unused `DesktopComponent` parity unless separately requested.

---

## 2. Verdigris token contract (dark)

Implement dark theme from the protocol YAML. Tailwind `@theme` names map as follows (add missing MD3 roles; deprecate ad-hoc names only where a Verdigris role exists).

| Protocol key | Hex | Tailwind / CSS role |
|--------------|-----|---------------------|
| `surface-container-lowest` | `#0d0e12` | Aurora **substrate** (Tier 0 canvas) |
| `background` / `surface` | `#121317` | `bg-background`, default body |
| `surface-container-low` … `highest` | per YAML | Existing `surface-low` … `surface-highest` ladder |
| `primary` / `primary-container` | `#dfb7ff` / `#6a0dad` | Tints vs authority fills |
| `secondary` / `secondary-container` | `#59dad1` / `#00a8a0` | Roman aqua telemetry |
| `tertiary` / `tertiary-container` | `#65dbb1` / `#00523c` | Patina / acquisition |
| `on-surface` | `#e3e2e7` | Primary text (narrative “Vitreous White” may apply to **high-emphasis** chrome only via utility, not global replace) |
| `on-surface-variant` | `#cfc2d5` | Muted metadata |
| `outline` / `outline-variant` | `#988d9e` / `#4d4353` | Glass borders (use `color-mix` for 12–15% strokes per Roman Glass) |

**Shell-only extensions (unchanged intent):**

- `--color-magenta`, `--color-magenta-glow`, `--color-magenta-dim` — wordmark and hex mark gradient only; **excluded from aurora bands**.

**Reconciliation vs current `styles.css`:**

- Substrate should trend to `#0d0e12` (lowest), not `#0e1015` / `#08090c`.
- `on-surface` protocol `#e3e2e7` vs legacy `#f5fffa` — adopt protocol for body; use `#f5fffa` only where brand doc demands “active readout” emphasis.
- `primary-container` in repo was `#3b0764`; protocol is `#6a0dad` — **protocol wins**.
- Secondary/tertiary hex in repo (`#20b2aa`, `#3eb991`) are narrative aliases; map utilities to protocol `secondary` / `tertiary` tokens (close enough for gradients).

---

## 3. Aurora layer (Verdigris “Substrate Glow”)

**Structure** (`DesktopBackdropComponent`, `pointer-events-none`, decorative `aria-hidden="true"`):

1. **Base:** flat `surface-container-lowest` (`#0d0e12`).
2. **Aurora wash:** one composed layer (no separate orb divs):
   - Radial/conic fusion: **~12%** `primary-container` (`#6a0dad`) + **~8%** `secondary` (roman aqua; use `#20b2aa` or token `secondary` at equivalent luminance).
   - Optional second band at very low opacity using `tertiary` for patina fringe (≤4%) — not a second “orb.”
3. **Roman glass sheet (optional, subtle):** full-bleed `backdrop-blur` + `bg-[rgba(18,20,26,0.72)]` at **low** opacity overlay on aurora only if needed for depth; default v1 may omit to avoid muddying wash.
4. **Grain:** CSS/SVG noise, opacity 0.02–0.04, `mix-blend-mode: overlay`.

**Motion:** slow `transform` drift on aurora layer only, `@media (prefers-reduced-motion: no-preference)`; static gradient when reduced.

**When windows open (adaptive C):** reduce aurora peak opacity ~15–20% (opacity transition only) so glass windows read clearly; do not remove aurora entirely.

---

## 4. Light theme (derived Verdigris)

Protocol YAML is dark-first. Light mode uses **MD3 inverse roles** from the same YAML plus brand rules (cool enterprise, not inverted neon):

| Role | Light value (from / derived) |
|------|------------------------------|
| Canvas / lowest | `#e3e2e7` (`inverse-surface`) |
| Background | `#f0f1f5` (slightly above inverse-surface) |
| On-surface | `#2f3035` (`inverse-on-surface`) |
| On-surface-variant | `#4d4353` (`outline-variant`) |
| Aurora wash | Same hue angles; **6–10%** peak opacity (purple + aqua), no magenta |
| Glass panels | `rgba(255,255,255,0.55–0.72)`, blur 16px, border `outline-variant` @ 12% |
| Watermark | ~6–8% opacity; patina/secondary fringe instead of purple glow |

Apply via `[data-theme="light"] { @theme { … } }` (Tailwind v4) and mirror `:root` legacy aliases for `window.css`.

---

## 5. Adaptive ambient brand (mode C)

**Preference:** `localStorage` key `lxv-shell-ambient-brand`: `adaptive` | `always-on` | `always-off` (default `adaptive`).

**Signals:**

- `hasVisibleWindows`: any process `isOpen && !isMinimized`.
- `ambientBrandVisible`:
  - `always-on` → true
  - `always-off` → false
  - `adaptive` → `!hasVisibleWindows`

**Stage watermark (when visible):** centered hex + `Λ Ξ V O S` (magenta on O S), low opacity, `aria-hidden`.

**Statusbar:**

- `ambientBrandVisible` → hex icon + clock (and existing controls); **hide** long wordmark on narrow breakpoints always; on wide, hide wordmark when ambient on.
- `!ambientBrandVisible` → show wordmark in header.

Transitions: opacity only, ~200ms; respect `prefers-reduced-motion`.

---

## 6. Theme mode plumbing

1. **`ShellThemeService`** (or extend existing prefs): read/write `theme: light | dark | system`.
2. Resolve `system` with `prefers-color-scheme`.
3. Set `document.documentElement.dataset.theme` and `color-scheme: light dark`.
4. **Settings app:** Appearance row (Light / Dark / System) — wire to API `system_preferences.theme` when gateway available; optimistic local apply immediately.

Orthogonal to ambient brand toggle (separate Settings control).

---

## 7. Roman Glass (chrome reference)

Windows, dock, statusbar, popovers should converge toward protocol (incremental, not one PR):

- Panel fill: `rgba(18, 20, 26, 0.72)` dark; light per §4.
- Blur: 16–24px, `saturate(130%)` where supported.
- Border: 1px `outline` @ 15%; specular patina on top/left via gradient border or pseudo-element (Tier 2+).

Aurora implementation does not require full chrome refactor in v1.

---

## 8. Typography & layout

Use protocol scale: Comfortaa headlines, Lexend body; `label-sm` / `label-md` uppercase for instrumentation labels in new UI only (don’t mass-refactor apps in v1).

Spacing: `gutter` 1.25rem desktop, `gutter-mobile` 0.75rem; radii `rounded` 0.5rem default, `rounded-lg` modals.

---

## 9. Architecture

**Recommended:** `DesktopBackdropComponent` + `ShellChromeService` exposing `ambientBrandVisible`, `themeResolved`, `auroraIntensity` (calm vs idle).

```
app.html
  app-statusbar [chrome from ShellChromeService]
  DesktopBackdropComponent
  window loop
  app-dock / app-search
```

Remove inline orb markup from `app.html`.

---

## 10. Verification

- [ ] Dark: substrate `#0d0e12`, aurora purple+aqua only (no magenta blobs).
- [ ] Light: readable contrast, subdued aurora.
- [ ] Adaptive: empty vs window open header/watermark behavior.
- [ ] Theme: Light / Dark / System from Settings.
- [ ] `prefers-reduced-motion`: no aurora drift.
- [ ] Build: `bun run dev` / production build clean.
- [ ] 320 / 768 / 1024 / 1440 layouts; statusbar not crowded on mobile.

---

## 11. Approval checklist

- [ ] Product owner accepts Verdigris YAML as dark token source (with magenta shell accent exception).
- [ ] Light derivation (§4) accepted.
- [ ] Adaptive C + storage keys accepted.
- [ ] Proceed to implementation plan (`writing-plans`).
