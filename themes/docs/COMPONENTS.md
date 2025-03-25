# Shadcn Components Used in the Docs Theme

This file documents the shadcn UI components that are actively used in the theme. Any components not listed here could potentially be removed to reduce bundle size.

## Used Components

| Component | Where Used | Purpose |
|-----------|------------|---------|
| `accordion.tsx` | Not used | Remove or keep for user extensions |
| `alert.tsx` | `callout.tsx` | Used for creating callout boxes in documentation |
| `badge.tsx` | Not used | Remove or keep for user extensions |
| `breadcrumb.tsx` | Not used | Remove or keep for user extensions |
| `button.tsx` | Multiple components | Used in navigation, footer, code blocks |
| `card.tsx` | Not used | Remove or keep for user extensions |
| `checkbox.tsx` | Not used | Remove or keep for user extensions |
| `collapsible.tsx` | Not used | Remove or keep for user extensions |
| `command.tsx` | Not used | Remove or keep for user extensions |
| `dialog.tsx` | Not used | Remove or keep for user extensions |
| `dropdown-menu.tsx` | Not used | Remove or keep for user extensions |
| `hover-card.tsx` | Not used | Remove or keep for user extensions |
| `input.tsx` | Not used | Remove or keep for user extensions |
| `navigation-menu.tsx` | `Navigation.tsx` | Used for the main navigation menu |
| `popover.tsx` | Not used | Remove or keep for user extensions |
| `progress.tsx` | Not used | Remove or keep for user extensions |
| `scroll-area.tsx` | Multiple components | Used in sidebar, TOC, and layouts |
| `select.tsx` | Not used | Remove or keep for user extensions |
| `separator.tsx` | Multiple components | Used for visual dividers |
| `sheet.tsx` | `Navigation.tsx` | Used for mobile navigation menu |
| `switch.tsx` | Not used | Remove or keep for user extensions |
| `table.tsx` | Not used | Remove or keep for user extensions |
| `tabs.tsx` | Not used | Remove or keep for user extensions |
| `toggle.tsx` | Not used | Remove or keep for user extensions |
| `tooltip.tsx` | `code-block.tsx` | Used for copy button tooltip |

## Recommended for Removal

To reduce bundle size, the following components could be safely removed:

- `accordion.tsx`
- `badge.tsx`
- `breadcrumb.tsx`
- `card.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `dialog.tsx`
- `dropdown-menu.tsx`
- `hover-card.tsx`
- `input.tsx`
- `popover.tsx`
- `progress.tsx`
- `select.tsx`
- `switch.tsx`
- `table.tsx`
- `tabs.tsx`
- `toggle.tsx`

## Benefits of Removal

- Reduced bundle size
- Faster page load times
- Cleaner codebase with only necessary components
- Simpler maintenance 