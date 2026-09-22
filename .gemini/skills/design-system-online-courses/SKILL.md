---
name: design-system-online-courses
description: Creates implementation-ready design-system guidance with tokens, component behavior, navbar architecture, and accessibility standards for Samriddhi Gyan online courses. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Samriddhi Gyan — Online Courses & Navigation Design System

## Mission
Deliver implementation-ready design-system guidance for **Samriddhi Gyan** (https://www.samriddhigyan.com/) that can be applied consistently across marketing, guest portals, and global navigation interfaces.

## Brand
- Product/brand: Samriddhi Gyan (समृद्धि ज्ञान)
- URL: https://www.samriddhigyan.com/
- Audience: Students, developers, tech professionals, and lifelong learners
- Product surface: Marketing site, Guest Pre-Login Portal & Global Navbar

## Style Foundations
- Visual style: structured, accessible, implementation-first, clean Udemy-grade aesthetic
- Main font style: `font.family.primary=Udemy Sans`, `font.family.stack=Udemy Sans, Noto Sans JP, Vazirmatn, SF Pro Text, -apple-system, blinkmacsystemfont, roboto, Segoe UI, helvetica, arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol`, `font.size.base=14px`, `font.weight.base=300`, `font.lineHeight.base=22.4px`
- Typography scale: `font.size.xs=12px`, `font.size.sm=14px`, `font.size.md=16px`, `font.size.lg=17.81px`, `font.size.xl=23.23px`, `font.size.2xl=30.46px`, `font.size.3xl=40px`
- Color palette: `color.text.primary=oklch(0.2974 0.0362 281.74)`, `color.text.secondary=oklch(0.9386 0.0108 280.47)`, `color.text.tertiary=oklch(0.4841 0.2342 293.93)`, `color.text.inverse=oklch(1 0 0)`, `color.brand.primary=#a435f0`, `color.brand.hover=#8710d8`, `color.surface.base=#ffffff`, `color.surface.dark=#1c1d1f`
- Spacing scale: `space.1=4px`, `space.2=6px`, `space.3=8px`, `space.4=10px`, `space.5=12px`, `space.6=16px`, `space.7=24px`, `space.8=32px`
- Radius/shadow/motion tokens: `radius.xs=4px`, `radius.sm=8px`, `radius.md=16px`, `radius.lg=1000px` | `shadow.1=oklch(0.6295 0.0204 306.5 / 0.08) 0px 2px 8px 0px, oklch(0.6295 0.0204 306.5 / 0.12) 0px 4px 16px 0px` | `motion.duration.instant=150ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required (Dropdown arrow keys, Escape to close, Tab navigation).
- Focus-visible rules required (`:focus-visible` with 2px solid `#5624d0`).
- Contrast constraints required (minimum 4.5:1 for body text, 3:1 for large headings).

## Navigation Bar (Navbar) Component Rules
- **Desktop Anatomy**: Brand Logo -> Categories Multi-level Flyout -> Flex-grow Search Bar with Live Suggestions -> Pro Plans -> Teach on Samriddhi Gyan -> Cart/Wishlist Badge Icons -> Language Modal -> Auth Buttons (Log in / Sign up) or User Avatar Dropdown.
- **Mobile Anatomy**: Hamburger Drawer Icon -> Center Logo -> Search Icon -> Cart Icon -> Profile Icon. Slide-over Sheet contains category hierarchy, account shortcuts, language picker.
- **States**: Default, hover (150ms transition), focus-visible ring, active, loading skeletons for cart/user data, mobile drawer open/close.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
