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

### CallWindowsCard Component

**Purpose**: Interactive timeline for managing daily call availability windows

**Key Features**:
- **24-Hour Timeline**: Vertical grid with 15-minute increments, scrollable with fixed header
- **Drag-to-Create**: Click and drag on timeline to create new windows (5-minute minimum)
- **Automatic Merging**: Overlapping windows automatically merge without user prompt
- **Undo/Redo**: Full undo/redo support with visual feedback (mdi-undo-variant/mdi-redo-variant icons)
- **Recurring vs One-Off**: 
  - Displays recurring windows as dashed borders when no one-off windows exist
  - First edit converts recurring windows to one-off windows for that specific day
  - Prevents ghost windows from appearing after undo operations
- **Visual Grouping**: Button dividers separate action groups (Add | Undo/Redo | Reset/Clear)

**Interaction Patterns**:
- Hover over window: Shows delete icon inline
- Click window: Opens edit modal with typeable time inputs
- Reset: Clears one-off windows, reverts to recurring defaults
- Clear: Removes all windows for the day

**Styling**:
- Background: `#fcfcf9` (matches page background)
- Borders/Lines: `#e4e4e4`
- Window color: Teal `#20808d` with 15% opacity fill
- Circular buttons with dividers for clean, organized header

## Backend Architecture

### Concept-Based Design

The backend follows a concept-based architecture where each concept is an independent, reusable unit of functionality. Concepts are composed via synchronizations rather than direct dependencies.

**Implemented Concepts:**
- ✅ **CallWindow** - User availability windows for reflection calls
  - Supports both recurring weekly windows and one-off date-specific windows
  - Automatic merge functionality: overlapping windows are automatically merged when created
  - Merge algorithm: takes earliest start time and latest end time of all overlapping windows
  - Backend `mergeOverlappingOneOffWindows` action handles overlap detection and merging
- ✅ **CallSession** - Individual call attempt tracking per user/day
- 🔄 **JournalPrompt** - Customizable reflection prompts (up to 5 per user)
- 🔄 **ReflectionSession** - Live reflection progress tracking
- 🔄 **JournalEntry** - Immutable daily reflection records
- 🔄 **Profile** - User profile information (display name, phone, timezone)
- 🔄 **User** - Core user identity
- 🔄 **UserAuthentication** - Phone-based authentication with SMS verification

**Deferred to Post-MVP:**
- ⏸️ **Tasks** - To-do list generation from reflections (out of scope for MVP)

### Authentication Strategy

**Phone Number Authentication** with mocked SMS for development:
- Users register/login with phone number
- 6-digit verification codes sent via SMS (console-logged in dev mode)
- Sessions persist for 30 days
- Production will integrate Twilio Verify API

**Rationale:**
- Aligns with future phone call feature
- Modern, passwordless user experience
- Mocked SMS keeps development simple and cost-free

### Key Design Decisions

1. **Fully Immutable Records**: Both ReflectionSession and JournalEntry are immutable once completed - responses and ratings are permanent snapshots
2. **Flexible Prompts**: Users can customize up to 5 reflection prompts; prompt text is snapshotted in entries so past reflections aren't affected by changes
3. **Separate Rating Field**: Rating (-2 to 2) is captured separately from prompt responses for cleaner data modeling
4. **Session vs Entry Separation**: ReflectionSession tracks live progress (mutable until completed), JournalEntry preserves completed reflections (fully immutable)

### Technology Stack

- **Runtime**: Deno
- **Database**: MongoDB with concept-based collections
- **Testing**: Vitest with comprehensive test coverage
- **API Pattern**: Discriminated unions for type-safe error handling (`Empty | { error: string }`)

See `concept_backend/CONCEPT_ARCHITECTURE.md` for detailed concept specifications and synchronizations.
