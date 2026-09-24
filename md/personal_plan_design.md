# Design System: Online Courses & Personal Plan (Udemy Standard)

## Context and Goals
Deliver implementation-ready token and component specifications for the Online Courses marketing surface (`/personal-plan` and `/subscribe`) adhering strictly to Udemy's token-driven UI framework, accessibility standards (WCAG 2.2 AA), and high conversion clarity.

---

## 1. Design Tokens & Foundations

### Typography
- **Primary Font**: `Udemy Sans`, `Noto Sans JP`, `-apple-system`, `BlinkMacSystemFont`, `Roboto`, `Segoe UI`, `Helvetica`, `Arial`, `sans-serif`
- **Scale**:
  - `font.size.xs`: `14px` / line-height: `19.6px` (caption, badges, footnotes)
  - `font.size.sm`: `16px` / line-height: `22.4px` (body text, standard links)
  - `font.size.md`: `18px` / line-height: `25.2px` (subtitles, prominent cards)
  - `font.size.lg`: `32px` / line-height: `38.4px` (section headers, plan card titles)
  - `font.size.xl`: `48px` / line-height: `52.8px` (hero page display headers)
- **Weights**:
  - Regular: `400`
  - Bold: `700`

### Color Palette (OKLCH & Hex Tokens)
- **Primary Text**: `oklch(0.2974 0.0362 281.74)` (`#1c1d1f` - deep charcoal)
- **Secondary Text / Neutral Muted**: `oklch(0.4841 0.0388 281.74)` (`#6a6f73` - muted text)
- **Brand Accent / Primary Interactive**: `oklch(0.4841 0.2342 293.93)` (`#a435f0` - Udemy purple)
- **Brand Dark Accent**: `#5624d0` (button hover, high-contrast links)
- **Surface Dark**: `#1c1d1f` / Surface Light: `#ffffff` / Surface Secondary: `#f7f9fa`
- **Border Neutral**: `#d1d7dc` (standard container borders)
- **Highlight Badge Surface**: `#eceb98` / Text: `#3d3d00`

### Spacing Scale
- `space.1`: `8px`
- `space.2`: `10px`
- `space.3`: `12px`
- `space.4`: `16px`
- `space.5`: `24px`
- `space.6`: `48px`

### Radii & Elevation
- `radius.xs`: `4px`
- `radius.sm`: `8px`
- `radius.full`: `9999px`
- `shadow.card`: `0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.08)`

---

## 2. Component-Level Rules

### Plan Comparison Cards (`/personal-plan` & `/subscribe`)
- **Anatomy**: Card container with `border border-[#d1d7dc]`, `radius.xs (4px)` to `radius.sm (8px)`.
  - Header: Plan name (`font.size.lg`, `font-bold`), target user descriptor (`font.size.xs`).
  - Pricing display: Monthly price in big bold numbers, annual/prorated billing notice.
  - Primary CTA: High-contrast button (`bg-[#a435f0]` or `bg-[#1c1d1f]`, `text-white`, `font-bold`, `h-[48px]`).
  - Feature bullet checklist: Icon `Check` in `#1c1d1f` or `#a435f0` with descriptive string.
- **States**:
  - `default`: Neutral border `#d1d7dc`.
  - `selected / active`: `2px solid #1c1d1f` or `2px solid #a435f0` border highlight.
  - `hover`: Subtle transform + shadow elevation.
  - `disabled / current-plan`: Low-opacity CTA with `"Current Plan"` badge.

### Sticky Navigation / Offer Trigger Bar
- **Behavior**: Appears smoothly as user scrolls past hero CTA (`opacity-100`, `transition-all duration-200`).
- **Anatomy**: Left pricing summary + Right instant checkout CTA button.

---

## 3. Accessibility Requirements (WCAG 2.2 AA)

- **Keyboard First**: All cards, buttons, accordions, and links must have visible `:focus-visible` focus rings (2px solid `#1c1d1f` with 2px offset).
- **Contrast**: Text contrast ratio must exceed 4.5:1 against surfaces (all dark hero text is pure `#ffffff` or `rgba(255,255,255,0.9)` on `#1c1d1f` = 16:1 ratio).
- **Interactive Target Size**: Minimum 44x44px bounding box for all touch/pointer targets.

---

## 4. QA Checklist

- [x] All headings match the Udemy typography hierarchy.
- [x] Primary colors use semantic tokens (`#1c1d1f`, `#2d2f31`, `#a435f0`, `#5624d0`, `#f7f9fa`).
- [x] Responsive layout collapses smoothly from 3-column desktop grid to single column on mobile (<768px).
- [x] Full keyboard navigation works with Tab/Shift+Tab and Enter/Space triggers.
