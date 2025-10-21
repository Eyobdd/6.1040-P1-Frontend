# Design Decisions

This document records the architectural and design decisions made for this project.

## Testing

- **Framework**: Vitest and Vue Testing Library are used for unit and component testing.
- **Structure**: Components and their corresponding tests are co-located within the same directory (e.g., `src/components/MyComponent/MyComponent.vue` and `src/components/MyComponent/MyComponent.test.ts`).
- **Naming Convention**: Test files follow the `<filename>.test.ts` naming convention.
- **Configuration**: Vitest is configured in `vite.config.ts` with jsdom environment and global test utilities.

## Code Quality

- **Linting**: ESLint v9 with flat config format is used for static code analysis.
- **Formatting**: Prettier is integrated with ESLint for consistent code formatting.
- **Plugins**: TypeScript ESLint and Vue ESLint plugins are configured for framework-specific rules.

## UI Framework

- **Component Library**: Vuetify 3 is used for Material Design components.
- **Icons**: Material Design Icons (@mdi/font) are included for comprehensive icon support.
- **Configuration**: Vuetify is configured with auto-import enabled via vite-plugin-vuetify for optimal tree-shaking and developer experience.
- **Theming**: Vuetify's built-in theming system provides Material Design 3 support and customization options.

## Navigation & Layout

### Sidebar Component

- **Architecture**: Two-column expandable sidebar with fixed positioning
  - **Left Column (72px)**: Fixed navigation with icon + label layout
  - **Right Column (200px)**: Contextual panel that appears on hover
- **Interaction Pattern**: Hover-based expansion inspired by modern web applications
  - Compact state: 72px width showing icons and labels
  - Expanded state: 272px total width (72px + 200px) with smooth 0.3s transition
- **Navigation Items**:
  - **Today**: Default active page (calendar-today icon)
  - **Journal**: Journal entries view (book icon)
  - **Schedule**: Call scheduling interface (calendar icon)
  - **Account**: User account settings (avatar, bottom-aligned)
- **Visual Design**:
  - Background: `#f7f7f7` (matches across both columns for seamless appearance)
  - Active state: Teal accent color (`#20808d`) with left border indicator
  - Hover states: Color change and subtle background highlight
  - No ripple effects on buttons for cleaner interaction
- **Expanded Panel Content**: Shows contextual items for the active section with icons and hover states
- **Layout Integration**: Fixed sidebar with 72px left margin applied to main content area via global `#app` styles

### Branding

- **Logo**: Custom Zien logo using `ZienNameLogo.svg` asset
- **Color Scheme**: Teal accent (`#20808d`) for interactive elements and active states
- **Typography**: System font stack with clean, modern appearance
