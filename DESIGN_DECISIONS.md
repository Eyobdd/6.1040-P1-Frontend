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
