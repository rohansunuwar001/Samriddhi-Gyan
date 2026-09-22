# Samriddhi Gyan — Full Site & Navbar Design System

## Mission
Create implementation-ready, token-driven UI guidance for **Samriddhi Gyan** (https://www.samriddhigyan.com/) optimized for consistency, WCAG 2.2 AA accessibility, and fast delivery across marketing, guest portal, and navbar surfaces.

---

## Brand & Product Context
- **Product / Brand**: Samriddhi Gyan (समृद्धि ज्ञान)
- **URL**: https://www.samriddhigyan.com/
- **Target Audience**: Students, developers, tech professionals, and lifelong learners
- **Product Surface**: Marketing Site, Guest Pre-Login Portal & Global Navigation (Navbar)

---

## Style Foundations & Semantic Tokens

### 1. Typography
- **Primary Font Family**: `'Udemy Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Fallback Stack**: `font.family.stack='Udemy Sans', 'Noto Sans JP', 'Vazirmatn', 'SF Pro Text', -apple-system, BlinkMacSystemFont, Roboto, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`
- **Base Typography**:
  - `font.size.base = 14px`
  - `font.weight.base = 300` / `400`
  - `font.lineHeight.base = 22.4px`
- **Typography Scale**:
  - `font.size.xs = 12px` (Badge text, micro-labels)
  - `font.size.sm = 14px` (Navbar links, input placeholder, body small)
  - `font.size.md = 16px` (Default body, dropdown menu items)
  - `font.size.lg = 17.81px` (Card titles, section subtitles)
  - `font.size.xl = 23.23px` (Subsection headers, promo titles)
  - `font.size.2xl = 30.46px` (Hero billboard headlines, page titles)
  - `font.size.3xl = 40px` (Marketing impact banners)

### 2. Color Palette
- **Brand Accents**:
  - `color.brand.primary = #a435f0` (Udemy Purple)
  - `color.brand.hover = #8710d8` (Deep Purple Hover)
  - `color.brand.active = #6d0eb5` (Pressed State)
  - `color.brand.subtle = #f7f0fa` (Light Purple Tint for active badge/pill)
- **Text & Contrast**:
  - `color.text.primary = #2d2f31` / `oklch(0.2974 0.0362 281.74)`
  - `color.text.secondary = #6a6f73` / `oklch(0.9386 0.0108 280.47)`
  - `color.text.tertiary = #808488` / `oklch(0.4841 0.2342 293.93)`
  - `color.text.inverse = #ffffff` / `oklch(1 0 0)`
  - `color.surface.base = #ffffff` / `#000000` (Dark Mode)
- **Spacing Scale**:
  - `space.1 = 4px`, `space.2 = 6px`, `space.3 = 8px`, `space.4 = 10px`, `space.5 = 12px`, `space.6 = 16px`, `space.7 = 24px`, `space.8 = 32px`
- **Radius & Shadows**:
  - `radius.xs = 4px`, `radius.sm = 8px`, `radius.md = 16px`, `radius.lg = 1000px` (Pills/Badges)
  - `shadow.1 = 0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12)`
  - `shadow.dropdown = 0 4px 20px rgba(0,0,0,0.15)`
  - `motion.duration.instant = 150ms`

---

## Global Navigation Bar (Navbar) Specification

### 1. Navbar Anatomy (Desktop)
```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] [Categories ▾] [ 🔍 Search for anything...                     ] [Plans] [Teach] [🛒] [🌐] [Log in] [Sign up]│
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
1. **Brand Logo**:
   - Left aligned, fixed height `34px-40px`.
   - Links to `/` (Home or Guest Home depending on auth state).
2. **Categories Mega Dropdown (`CategoriesFlyout`)**:
   - Hover trigger with `150ms` intent delay.
   - **Level 1 (Parent Categories)**: Root domains (Development, Business, IT, Design, AI, etc.) with right chevron.
   - **Level 2 (Subcategories)**: Flyout column displaying relevant child categories upon hover.
   - **Level 3 (Topics)**: Deep topic links (e.g., Python, React, AWS).
3. **Global Search Bar (`NavbarSearch`)**:
   - Flex-grow input with pill border (`radius: 1000px` or `radius: 4px`).
   - Magnifying glass icon on left.
   - Focus state: `2px solid #1c1d1f` outline.
   - Instant live search suggestions dropdown on typing with recent search history and clear button.
4. **Quick Navigation Links**:
   - **Samriddhi Gyan Pro / Plans**: Target `/subscribe` or `/pricing`.
   - **Teach on Samriddhi Gyan**: Target `/signup` (or `/instructor/course` if instructor).
5. **Interactive Utility Icons**:
   - **Cart (`ShoppingCart`)**: Hover mini-cart preview popover with items and checkout CTA. Number badge indicator.
   - **Wishlist (`Heart`)**: Direct link to wishlist page with count badge.
   - **Notifications (`Bell`)**: Notification feed popover.
   - **Language Selector (`Globe`)**: Triggers language modal (English / Nepali).
6. **Authentication Actions**:
   - **Guest State**:
     - `Log in` Button: Outline border `#1c1d1f`, text `#1c1d1f`, hover `bg-gray-50`.
     - `Sign up` Button: Solid dark `bg-[#1c1d1f]`, text `#ffffff`, hover `bg-black`.
   - **Logged-in State**:
     - User Avatar (Circle with initials or profile image).
     - Hover dropdown: Profile details, My Learning, Purchase History, Settings, Logout.

---

### 2. Navbar Anatomy (Mobile & Tablet)
```
┌────────────────────────────────────────────────────────┐
│ [☰ Menu]           [Logo]              [🔍] [🛒] [User] │
└────────────────────────────────────────────────────────┘
```
- **Hamburger Button**: Left aligned, triggers full-height slide-over drawer (`Sheet`).
- **Mobile Drawer**:
  - Top: User greeting or Sign in / Sign up CTA buttons.
  - Section 1: "Most popular categories" accordion list with collapsible children.
  - Section 2: "More from Samriddhi Gyan" (Teach, Business, Blog, Contact).
  - Bottom: Language picker and Theme toggle.

---

## Component States & Accessibility Rules (WCAG 2.2 AA)
- **Keyboard Navigation**:
  - `Tab` moves focus sequentially through Logo -> Categories Button -> Search Bar -> Nav Links -> Auth/Profile.
  - `Escape` closes any open category dropdown, search suggestions, or cart popover.
  - `ArrowUp` / `ArrowDown` traverses through dropdown menu items.
- **Focus Indicators**:
  - Non-negotiable `:focus-visible` indicator on all interactive elements (`2px solid #5624d0` or `#1c1d1f`).
- **Screen Reader Support**:
  - `aria-expanded="true/false"` on Categories dropdown and user menu.
  - `aria-label="Search courses"`, `aria-label="Shopping Cart with 2 items"`.
