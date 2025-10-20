# Style Guide

This document outlines the coding style and conventions for this project.

## TypeScript

- **General Style**: We adhere to the official TypeScript style guide found at [ts.dev/style](https://ts.dev/style/).
- **Enforcement**: ESLint with TypeScript plugin automatically checks code style.

## Code Formatting

- **Tool**: Prettier is used for automatic code formatting.
- **Configuration**: Settings are defined in `.prettierrc`:
  - Single quotes for strings
  - Semicolons required
  - Trailing commas (ES5 style)
  - 80 character line width
  - 2 spaces for indentation

## Available Commands

- `npm run lint` - Check and auto-fix linting issues
- `npm run format` - Format all files with Prettier
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI interface

## File Naming Conventions

- **Components**: PascalCase (e.g., `HelloWorld.vue`)
- **Test Files**: `<filename>.test.ts` (e.g., `HelloWorld.test.ts`)
- **Component Structure**: Co-locate components and tests in the same directory
