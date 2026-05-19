---
version: alpha
name: Turtask
description: Calm, focused design system for a multi-board Kanban ERP — neutral surfaces, a single accent for action, semantic colors for status chips.
colors:
  primary: "#1E40AF"
  secondary: "#475569"
  surface: "#FFFFFF"
  background: "#F8FAFC"
  on-primary: "#FFFFFF"
  on-surface: "#0F172A"
  success: "#047857"
  danger: "#B91C1C"
  surface-tint: "#EEF2FF"
  surface-elevated: "#FFFFFF"
  state-progress-bg: "#DBEAFE"
  state-progress-fg: "#1D4ED8"
  state-done-bg: "#D1FAE5"
  state-done-fg: "#047857"
  state-overdue-bg: "#FEE2E2"
  state-overdue-fg: "#B91C1C"
priority:
  high: "#DC2626"
  medium: "#F59E0B"
  low: "#10B981"
  none: "#94A3B8"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 2rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1rem
    letterSpacing: 0.02em
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
size:
  pill-h: 24px
  priority-bar-w: 3px
  tag-dot: 5px
  avatar-sm: 18px
  status-icon: 14px
  popover-max: 320px
components:
  board:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    padding: 24px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 12px
  tag-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 4px
  tag-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 4px
---

## Overview

Turtask is a real-time Kanban workspace. The UI must read as **calm and focused** — long sessions of triage, drag-and-drop, and review. The system favors neutral surfaces, a single restrained accent for action (deep indigo), and semantic colors reserved for status chips. Density is moderate: cards are scannable at a glance but never cramped.

The visual language pairs with the product's functional posture: type-safe end-to-end, no surprises. The design system mirrors that — a small, opinionated palette and a single sans-serif family across the whole product.

## Colors

The palette is built around a near-white surface, a deep-ink text color, and a single indigo accent that drives all primary interaction. Status colors (success, danger) are used **only** on chips, badges, and toasts — never on prose or layout.

- **Primary (#1E40AF):** Deep indigo for the primary call-to-action — "Create board", "Save card", confirm buttons. Used sparingly so it remains visually loud.
- **Secondary (#475569):** Slate for secondary actions, muted icons, and metadata captions.
- **Surface (#FFFFFF):** Card and panel background. The canvas where work lives.
- **Background (#F8FAFC):** Board canvas behind columns — slightly cooler than pure white so card edges read crisply.
- **On Primary (#FFFFFF):** Text and icon color placed on top of any saturated brand color.
- **On Surface (#0F172A):** Primary text on light surfaces. High-contrast ink for headings and body.
- **Success (#047857):** Done / completed status chips. Never used for prose.
- **Danger (#B91C1C):** Destructive confirmations, overdue badges, error toasts.

## Typography

Inter at four steps. One family, four weights, predictable rhythm.

- **h1 — 2rem / 700:** Page titles ("Board: Q2 Roadmap", "My Tasks"). One per view.
- **h2 — 1.5rem / 600:** Section headers, modal titles, column titles.
- **body-md — 1rem / 400:** Card titles, descriptions, form inputs.
- **label-sm — 0.75rem / 500 / +0.02em:** Metadata, chip labels, helper text. Slight letter-spacing keeps small caps legible at low weight.

Negative letter-spacing on h1 / h2 (`-0.02em`, `-0.01em`) tightens display type without making it feel cramped.

## Layout

Layout uses a 4-pixel base scale. Cards sit on the board canvas with `md` padding; modals and panels use `lg`. Vertical rhythm between stacked elements defaults to `sm` inside a card, `md` between cards.

- **`{spacing.xs}` (4px):** Chip inner padding, icon offsets.
- **`{spacing.sm}` (8px):** Tight stacks — card title to metadata, label to input.
- **`{spacing.md}` (16px):** Card content padding, gap between cards in a column.
- **`{spacing.lg}` (24px):** Board canvas padding, modal padding, gap between columns.
- **`{spacing.xl}` (32px):** Top-level page padding, section separation.

## Shapes

Two corner radii cover the whole product. Buttons and chips use `sm` for a crisp action feel; cards and panels use `md` for a softer container feel; modals use `lg`.

- **`{rounded.sm}` (4px):** Buttons, chips, badges, inputs.
- **`{rounded.md}` (8px):** Cards, columns, dropdown panels.
- **`{rounded.lg}` (12px):** Modals, large surfaces, toast container.

## Components

- **board:** Full-bleed canvas, `background` surface with `on-surface` ink, `lg` padding. Hosts the column list horizontally.
- **card:** White `surface` with `on-surface` ink, `md` rounded, `md` padding. The atomic unit of work — title, optional description, assignee, due date, tags.
- **button-primary:** `primary` indigo with `on-primary` text, `sm` rounded, `md` padding. Used once per view max for the dominant action.
- **button-secondary:** `secondary` slate with `on-primary` text, `sm` rounded, `md` padding. For "Cancel", "Back", non-destructive secondary flows.
- **tag-success:** `success` green chip with `on-primary` text. Marks "Done" status, completed milestones.
- **tag-danger:** `danger` red chip with `on-primary` text. Marks overdue cards, blocked items, destructive confirmations.
- **pill-task:** Calendar task pill — `pill-h` (24px) tall, `priority-bar-w` (3px) vertical bar on the left in `priority.*`, `status-icon` on the inside, title in `body-md`, optional duration (`secondary` slate), `tag-dot` (5px), `avatar-sm` (18px). Background by state: todo = `surface`, in-progress = `state-progress-bg` + 2px progress bar in `state-progress-fg` at bottom, done = `state-done-bg` with check icon in `state-done-fg` (never strikethrough), overdue = `state-overdue-bg` with bold title and red duration. Hover → `surface-tint`.
- **span-bar:** Multi-day calendar task. `primary` indigo background, `on-primary` text, avatar at the head. Only the head/tail of the span carry `rounded.sm`; intermediate days are square so the bar reads as continuous.
- **chip-filter:** Calendar filter row. Outline default (`secondary` border, `on-surface` text); active state = `surface-tint` background + `primary` text. `rounded.full`, `label-sm` typography.
- **popover-card:** Hover preview / day-detail popover. `surface-elevated` with shadow-md, `rounded.md`, `lg` padding, `popover-max` (320px) wide. Contains **at most one** `button-primary` ("Open card"); secondary actions are text-only links in `secondary` slate.
- **today-cell:** Today's date cell. `surface-tint` background wash + a `primary` `rounded.full` disc around the date number.

## Do's and Don'ts

**Do**

- Use **one** `button-primary` per view. If two actions compete for primary, demote one to `button-secondary`.
- Reserve `success` / `danger` for status signals on chips and toasts.
- Stick to the four typography steps. New sizes mean a spec change, not an inline override.
- Let `background` and `surface` carry hierarchy — cards lift off the board canvas through the surface delta alone, not borders.

**Don't**

- Don't use `primary` indigo for prose, links inside cards, or icon defaults — it loses its meaning as the "act now" color.
- Don't tint `danger` red into prose or pink alerts. Status colors are component-scoped.
- Don't introduce a third corner radius. Two radii cover every container in the product.
- Don't pair saturated colors against each other (e.g. `primary` text on `danger` background) — every paired surface in this system uses `on-primary` (white) for text on saturation.
- Don't use `priority.*` colors as a background — they live **only** on the 3px left bar of `pill-task` (and as a small disc inside the priority chip in a popover). Priority is signal, not fill.
- Don't use strikethrough to indicate "done" — that pattern leaked from the old calendar where both completed and past-due cards were struck out, making the two indistinguishable. Use the check icon + `state-done-bg` instead.
- Don't grow calendar cells to fit content. Every day cell is the same height; overflow becomes a "+N more" affordance that opens a `popover-card`.
- Don't reach for raw Tailwind color utilities (`bg-rose-50`, `bg-amber-100`, `text-emerald-600`) in calendar code. If a state needs a color, it goes in `state-*` / `priority.*` tokens first.
