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
  - **Day View**: Default active page (calendar-today icon)
  - **Journal**: Journal entries view (book icon) with sub-navigation:
    - **Past Entries**: View all completed journal entries (default)
    - **Current Prompts**: Customize reflection prompts
  - **Schedule**: Call scheduling interface (calendar icon) - *Currently hidden*
  - **Account**: User account settings (avatar, bottom-aligned)
- **Visual Design**:
  - Background: `#f7f7f7` (matches across both columns for seamless appearance)
  - Active state: Teal accent color (`#20808d`) with left border indicator
  - Hover states: Color change and subtle background highlight
  - No ripple effects on buttons for cleaner interaction
- **Expanded Panel Content**: Shows contextual items for the active section with icons and hover states
- **Layout Integration**: Fixed sidebar with 72px left margin applied to main content area via global `#app` styles
- **Route Highlighting**: Uses `path.startsWith()` to highlight parent route for sub-pages (e.g., Journal tab highlights for both `/journal` and `/journal/prompts`)

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
- ✅ **JournalPrompt** - Customizable reflection prompts (up to 5 per user)
  - CRUD operations: create, update, delete, reorder prompts
  - Active/inactive toggle: users can deactivate prompts without deleting
  - Position-based ordering: prompts sorted by position field (1-5)
  - Default prompts: 4 prompts auto-created for new users
  - `_getActivePrompts`: Returns only active prompts for reflection sessions
- ✅ **ReflectionSession** - Live reflection progress tracking
  - Tracks IN_PROGRESS, COMPLETED, or ABANDONED status
  - Records prompt responses with timestamps
  - Optional rating: Rating (-2 to 2) is now optional based on user preference
  - Prompt snapshots: Captures prompt text at session start for immutability
- ✅ **JournalEntry** - Immutable daily reflection records
  - Creates entries from completed reflection sessions
  - Stores prompt responses with position ordering
  - Optional rating: Supports entries without ratings (defaults to 0)
  - `_getEntriesWithResponsesByUser`: Returns entries with responses included (optimized query)
- ✅ **Profile** - User profile information (display name, phone, timezone)
  - Added `includeRating` field: Boolean preference for day rating prompt
  - Defaults to `true` for new users
  - `updateRatingPreference`: Action to toggle rating preference
- ✅ **User** - Core user identity
- ✅ **UserAuthentication** - Phone-based authentication with SMS verification

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
3. **Optional Rating**: Rating (-2 to 2) is now optional based on user preference stored in Profile
   - Users can toggle rating on/off in Current Prompts page
   - ReflectionSession and JournalEntry support optional ratings
   - Defaults to 0 if not provided for database consistency
4. **Session vs Entry Separation**: ReflectionSession tracks live progress (mutable until completed), JournalEntry preserves completed reflections (fully immutable)
5. **Active Prompts Only**: ReflectionSession uses only active prompts from JournalPrompt concept
   - `getActivePrompts` filters by `isActive: true`
   - Inactive prompts are excluded from new sessions
   - Prompt changes affect only future sessions, not completed entries
6. **User Authentication Consistency**: All components use authenticated user ID from token
   - No hardcoded user IDs in production code
   - Authentication required for all data access
   - Proper user isolation in multi-tenant system

### Technology Stack

- **Runtime**: Deno
- **Database**: MongoDB with concept-based collections
- **Testing**: Vitest with comprehensive test coverage
- **API Pattern**: Discriminated unions for type-safe error handling (`Empty | { error: string }`)

See `concept_backend/CONCEPT_ARCHITECTURE.md` for detailed concept specifications and synchronizations.

## Application Pages

### Day View (`/`)
**Purpose**: Main dashboard showing today's overview

**Features**:
- Hero section with date and icon
- Call Windows card for managing availability
- Day score widget (if completed)
- Navigation to reflection call

**Call Completed State**:
- When journal entry exists for the date, CallWindowsCard shows overlay
- Grayed out background with "Call Completed" message
- Prevents editing of windows for completed days
- Visual feedback: check icon, semi-transparent overlay

### Reflect View (`/reflect`)
**Purpose**: Guided reflection session interface

**Features**:
- Step-by-step prompt progression with progress bar
- Textarea input for each prompt response
- Optional rating step (based on user preference)
- Auto-completion when rating disabled
- Session state management (start, record, complete)
- Redirect prevention if entry already exists for today

**Prompt Loading**:
- Uses `api.getActivePrompts(user)` to get current active prompts
- Loads fresh prompts on every session start
- Respects user's prompt customizations immediately
- Creates prompt snapshots for immutability

**Rating Behavior**:
- Loads `includeRating` preference from user profile
- Conditionally shows rating step
- Total steps = prompts.length + (includeRating ? 1 : 0)
- Auto-completes after last prompt if rating disabled

### Past Entries (`/journal`)
**Purpose**: Browse and view completed journal entries

**Features**:
- List view with entry cards sorted by date (newest first)
- Each card shows: date, rating badge, first 2 response previews
- Click to expand: modal with full entry details
- Empty state for no entries
- Loading state during fetch

**Entry Detail Modal**:
- Full date display with relative formatting (Today, Yesterday, or full date)
- Rating display: "⭐ X (Scale: -2 to +2)" for clarity
- All responses shown with numbered circles
- Scrollable for long entries
- Close via X button or click outside

**Data Loading**:
- Uses `api.getEntriesWithResponsesByUser(user)` for optimized query
- Single API call returns entries with responses included
- Authenticates user before loading (no hardcoded user IDs)

### Current Prompts (`/journal/prompts`)
**Purpose**: Customize reflection prompts

**Features**:
- Drag-and-drop reordering (HTML5 drag API)
- Inline text editing (click to edit, Google Docs style)
- Add new prompts (max 5)
- Delete prompts with confirmation
- Toggle active/inactive status
- Visual distinction for inactive prompts:
  - Grayed background and text
  - Italic styling
  - Empty dashed circle (no number)
  - Reduced opacity
- Sequential numbering for active prompts only

**Rating Prompt Section**:
- Special toggleable prompt for day rating
- Active by default for new users
- Separate from regular prompts (not counted in 5-prompt limit)
- Persists preference to user profile
- Clear description: "On a scale from -2 to 2..."

**Default Prompts** (auto-created for new users):
1. "What are you grateful for today?"
2. "What did you do today?"
3. "What are you proud of today?"
4. "What do you want to do tomorrow?"

**Design**:
- Hero header matching Day View style (48px title, Georgia serif font)
- Left-aligned prompt text
- Figma-inspired UI with clean cards and hover states
- Teal accent color (#20808d) for active elements

## Component Architecture

### CallWindowsCard
- Checks for journal entry on mount and date change
- Shows completed overlay when entry exists
- Prevents interactions on completed days
- Integrates with JournalEntry concept

### ReflectView
- Loads active prompts on every mount (no caching)
- Loads rating preference from profile
- Dynamic step calculation based on preferences
- Handles optional rating in session completion
- Creates journal entry with optional rating

### PastEntriesView  
- Authenticates user before loading entries
- Uses optimized backend query with responses
- Handles empty and loading states
- Modal for detailed entry view

### JournalView (Current Prompts)
- Loads prompts and rating preference on mount
- Creates default prompts for new users
- Saves all changes to backend immediately
- Visual feedback for active/inactive states

## Testing Strategy

### Unit Tests
- **ReflectView**: 9 tests verifying prompt loading, active filtering, text updates, rating preference
- **CallWindowsCard**: 40+ tests covering window management, undo/redo, overlap detection
- All tests use Vitest with Vue Test Utils
- Mocked API responses for isolation
- Focus on component logic and state management

### Integration Points
- Prompt changes immediately affect new reflection sessions
- Rating preference syncs across all components
- User authentication consistent across all views
- Journal entries link to reflection sessions

## Known Issues & Future Work

### Current Limitations
- Schedule feature temporarily hidden (commented out in sidebar)
- Rating defaults to 0 when not provided (could be null)
- No pagination for past entries (loads all)
- No search/filter for past entries
- No edit/delete for completed entries

### Planned Enhancements
- Entry filtering by date range and rating
- Search within entry responses
- Export entries (PDF, text)
- Prompt templates and categories
- Analytics dashboard for trends
- Schedule feature implementation
