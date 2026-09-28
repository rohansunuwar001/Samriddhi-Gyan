# Online Courses

## Mission
Create implementation-ready, token-driven UI guidance for Online Courses that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: Online Courses
- URL: https://www.udemy.com/
- Audience: developers and technical teams
- Product surface: marketing site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=Udemy Sans`, `font.family.stack=Udemy Sans, Noto Sans JP, Vazirmatn, SF Pro Text, -apple-system, blinkmacsystemfont, roboto, Segoe UI, helvetica, arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol`, `font.size.base=14px`, `font.weight.base=300`, `font.lineHeight.base=22.4px`
- Typography scale: `font.size.xs=12px`, `font.size.sm=14px`, `font.size.md=16px`, `font.size.lg=18px`, `font.size.xl=24px`, `font.size.2xl=32px`
- Color palette: `color.text.primary=oklch(0.2974 0.0362 281.74)`, `color.border.muted=oklch(0.9386 0.0108 280.47)`, `color.text.tertiary=oklch(0.4841 0.2342 293.93)`, `color.text.inverse=oklch(1 0 0)`, `color.surface.base=#000000`
- Spacing scale: `space.1=4px`, `space.2=6px`, `space.3=8px`, `space.4=10px`, `space.5=12px`, `space.6=16px`, `space.7=24px`, `space.8=32px`
- Radius/shadow/motion tokens: `radius.xs=4px`, `radius.sm=8px`, `radius.md=16px`, `radius.lg=1000px` | `shadow.1=oklch(0.6295 0.0204 306.5 / 0.08) 0px 2px 8px 0px, oklch(0.6295 0.0204 306.5 / 0.12) 0px 4px 16px 0px` | `motion.duration.instant=150ms`, `motion.duration.fast=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (132), cards (112), buttons (96), lists (57), inputs (11), navigation (3).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
