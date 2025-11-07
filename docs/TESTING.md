# Testing Documentation

This document describes the testing setup and coverage for the Zien application.

## Test Framework

- **Framework**: Vitest with Vue Testing Library
- **Test Runner**: Vitest (configured in `vite.config.ts`)
- **Assertions**: @testing-library/jest-dom
- **User Interactions**: @testing-library/user-event

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run tests with UI
npm run test:ui

# Run tests with verbose output
npm test -- --run --reporter=verbose
```

## Test Coverage

### Sidebar Component (`src/components/Sidebar/Sidebar.test.ts`)

**Total: 20 tests**

#### Navigation Structure (4 tests)
- ✅ Renders the main navigation with proper ARIA label
- ✅ Displays all navigation links (Today, Journal, Schedule, Account)
- ✅ Displays the Zien logo
- ✅ Displays visible text labels for each nav item

#### Navigation Routing (4 tests)
- ✅ Navigates to Today page when Today link is clicked
- ✅ Navigates to Journal page when Journal link is clicked
- ✅ Navigates to Schedule page when Schedule link is clicked
- ✅ Navigates to Account page when Account link is clicked

#### Hover Behavior - Panel Display (4 tests)
- ✅ Shows Today panel when hovering over Today icon
- ✅ Shows Journal panel when hovering over Journal icon
- ✅ Shows Schedule panel when hovering over Schedule icon
- ✅ Shows Account panel when hovering over Account icon

#### Hover Behavior - Panel Hiding (3 tests)
- ✅ Hides panel after 500ms when mouse leaves icon
- ✅ Keeps panel open when moving from icon to panel
- ✅ Hides panel immediately when leaving entire sidebar

#### Active State Indication (5 tests)
- ✅ Highlights Today icon when on Today page
- ✅ Highlights Journal icon when on Journal page
- ✅ Highlights Schedule icon when on Schedule page
- ✅ Highlights Account icon when on Account page
- ✅ Shows hovering state on icon when panel is open

### App Component (`src/App.test.ts`)

**Total: 14 tests**

#### Application Structure (3 tests)
- ✅ Renders the main application container
- ✅ Renders the Sidebar component
- ✅ Renders the router view for page content

#### Route Integration (4 tests)
- ✅ Displays Today view when navigating to root path
- ✅ Displays Journal view when navigating to /journal
- ✅ Displays Schedule view when navigating to /schedule
- ✅ Displays Account view when navigating to /account

#### Sidebar and Content Integration (2 tests)
- ✅ Shows sidebar navigation alongside page content
- ✅ Maintains sidebar presence across route changes

#### Layout and Styling (2 tests)
- ✅ Applies main-content class to the main element
- ✅ Applies zien-app class to the application container

#### Accessibility (3 tests)
- ✅ Provides navigation landmark for sidebar
- ✅ Provides accessible labels for all navigation links
- ✅ Provides alt text for logo image

## Testing Principles

### User-Centric Testing
All tests follow user-centric testing principles:

1. **Query by ARIA labels and roles**: Tests use `getByRole`, `getByLabelText`, and `getByAltText` to query elements as users would interact with them
2. **Visible text**: Tests query by visible text that users can see
3. **Accessibility first**: All interactive elements have proper ARIA labels and semantic HTML

### Test Organization
- Tests are co-located with components in the same directory
- Test files follow the naming convention: `<ComponentName>.test.ts`
- Tests are organized into logical describe blocks by feature area

### Assertions
- Use semantic queries (role, label, text) over implementation details (class names, IDs)
- Test behavior, not implementation
- Verify accessibility attributes are present

## Configuration

### Vitest Setup (`vite.config.ts`)
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test-setup.ts',
  include: ['**/*.test.ts'],
  server: {
    deps: {
      inline: ['vuetify'],
    },
  },
}
```

### Test Setup (`src/test-setup.ts`)
- Imports @testing-library/jest-dom for extended matchers
- Mocks ResizeObserver for Vuetify components

## Key Features Tested

### Sidebar Hover Behavior
The tests ensure the critical hover behavior works correctly:
- Panel appears when hovering over icons
- Panel stays open when moving from icon to panel
- Panel hides after 500ms when not hovering
- Panel hides immediately when leaving sidebar entirely

### Navigation and Routing
Tests verify:
- All routes are accessible via sidebar links
- Active state correctly reflects current route
- Router integration works properly
- Sidebar persists across route changes

### Accessibility
Tests ensure:
- Proper ARIA labels on all interactive elements
- Semantic HTML structure (nav, main, etc.)
- Alt text on images
- Keyboard navigation support (via semantic HTML)

## Maintenance

When adding new features:
1. Add tests before or alongside implementation
2. Follow existing test patterns
3. Use semantic queries (role, label, text)
4. Test user interactions, not implementation details
5. Ensure accessibility attributes are tested

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:
```bash
npm test -- --run --reporter=json --outputFile=test-results.json
```
