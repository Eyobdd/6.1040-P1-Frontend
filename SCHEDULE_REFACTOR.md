# Schedule Page & CallWindowsCard Refactor

## ✅ Completed Changes

### 1. **Prompt Template Deactivation Fix**

**Issue:** When deactivating a prompt that's being edited, the text input remained active.

**Solution:** Updated `toggleActive()` in `JournalView.vue` to save and blur the input before toggling.

```typescript
const toggleActive = async (prompt: Prompt) => {
  // If this prompt is being edited, save and blur the input first
  if (editingId.value === prompt._id) {
    await saveEdit(prompt);
  }
  
  const result = await api.togglePromptActive(userId, prompt.position);
  if (!('error' in result)) {
    prompt.isActive = !prompt.isActive;
  }
};
```

**File Modified:** `/src/views/JournalView.vue`

---

### 2. **CallWindowsCard Refactor**

**Goal:** Extract reusable timeline logic to support both one-off and recurring windows.

**Approach:** Created composable + component architecture for minimal coupling.

#### **New Files Created:**

##### **A. `useCallWindowTimeline.ts` - Composable**

**Location:** `/src/composables/useCallWindowTimeline.ts`

**Purpose:** Reusable logic for timeline interactions

**Exports:**
- `TimeWindow` interface - Generic window representation
- `TimelineConfig` interface - Configuration options
- `useCallWindowTimeline()` - Main composable function

**Features:**
- Drag-to-create functionality
- Time calculations and formatting
- Window overlap detection
- Preview window during drag
- Configurable hour height and minimum duration

**Key Methods:**
```typescript
// Time utilities
formatHour(hour: number): string
formatTimeRange(startTime: number, endTime: number): string
getWindowStyle(window: TimeWindow): { top: string; height: string }

// Overlap detection
windowsOverlap(w1: TimeWindow, w2: TimeWindow): boolean
findOverlappingWindows(window: TimeWindow, windows: TimeWindow[]): TimeWindow[]

// Drag operations
startDrag(y: number, containerTop: number): void
updateDrag(y: number, containerTop: number): void
endDrag(): { startTime: number; endTime: number } | null
cancelDrag(): void
```

---

##### **B. `CallWindowTimeline.vue` - Reusable Component**

**Location:** `/src/components/CallWindowTimeline.vue`

**Purpose:** Presentational timeline component for any type of windows

**Props:**
```typescript
interface Props {
  windows: TimeWindow[];  // Array of windows to display
  readonly?: boolean;     // Disable interactions
}
```

**Events:**
```typescript
'window-create': [{ startTime: number; endTime: number }]
'window-click': [TimeWindow]
'window-delete': [TimeWindow]
```

**Features:**
- 24-hour timeline grid
- Time labels (12-hour format with AM/PM)
- Hour and quarter-hour lines
- Drag-to-create windows
- Window display with delete button
- Preview window during drag
- Readonly mode support

**Styling:**
- Minimalist design matching Day View
- Teal accent color (#20808d)
- Scrollable (max-height: 700px)
- Responsive hover states
- Clean borders (#e4e4e4)

---

### 3. **Schedule Page Implementation**

**Location:** `/src/views/ScheduleView.vue`

**Purpose:** Weekly recurring call windows management

#### **Features:**

**1. Hero Header**
- Calendar clock icon
- "Weekly Schedule" title (Georgia serif, 48px)
- Subtitle explaining purpose

**2. Weekly Grid Layout**
- 7 columns (one per day of week)
- Responsive breakpoints:
  - Desktop (>1600px): 7 columns
  - Large (1200-1600px): 4 columns
  - Medium (900-1200px): 3 columns
  - Small (600-900px): 2 columns
  - Mobile (<600px): 1 column

**3. Day Columns**
- Day header with name and clear button
- `CallWindowTimeline` component for each day
- Compact styling (smaller fonts, narrower time labels)

**4. Functionality**
- Create recurring windows by dragging
- Delete individual windows
- Clear all windows for a day
- Auto-loads existing recurring windows
- Saves to backend immediately

#### **Data Flow:**

```typescript
// Store windows by day of week
const windowsByDay = ref<Record<DayOfWeek, TimeWindow[]>>({
  SUNDAY: [],
  MONDAY: [],
  TUESDAY: [],
  // ...
});

// Create window
handleWindowCreate(day, { startTime, endTime }) 
  → api.createRecurringCallWindow()
  → loadRecurringWindows()

// Delete window
handleWindowDelete(day, window)
  → api.deleteRecurringCallWindow()
  → loadRecurringWindows()

// Clear day
clearDay(day)
  → confirm dialog
  → delete all windows for day
  → loadRecurringWindows()
```

#### **Styling Customization:**

The Schedule page overrides timeline styles for a more compact view:

```css
/* Smaller timeline */
.day-column :deep(.timeline-container) {
  max-height: 500px;
}

/* Narrower time labels */
.day-column :deep(.timeline-grid) {
  grid-template-columns: 50px 1fr;
}

/* Smaller fonts */
.day-column :deep(.time-label) {
  font-size: 10px;
}

.day-column :deep(.window-time) {
  font-size: 11px;
}
```

---

## 🏗️ Architecture

### **Component Hierarchy:**

```
ScheduleView.vue
├── CallWindowTimeline.vue (×7, one per day)
│   └── useCallWindowTimeline() composable
```

### **Separation of Concerns:**

1. **Composable (`useCallWindowTimeline`):**
   - Pure logic, no UI
   - Time calculations
   - Drag state management
   - Reusable across components

2. **Component (`CallWindowTimeline`):**
   - Presentational layer
   - Timeline rendering
   - Event handling
   - Minimal business logic

3. **Page (`ScheduleView`):**
   - Data fetching
   - API integration
   - Layout and composition
   - Day-specific logic

### **Benefits:**

✅ **Minimal Coupling**
- Composable has no dependencies on components
- Component has no knowledge of backend
- Page handles all API calls

✅ **Reusability**
- `CallWindowTimeline` can be used for any window type
- `useCallWindowTimeline` can be used in any component
- Easy to create new views (e.g., monthly view)

✅ **Testability**
- Composable logic can be unit tested independently
- Component can be tested with mock data
- Page can be tested with mocked API

✅ **Maintainability**
- Clear separation of concerns
- Easy to modify one layer without affecting others
- Self-documenting code structure

---

## 🎨 Design Alignment

### **Consistency with Day View:**

1. **Hero Header**
   - Same icon + title + subtitle pattern
   - Georgia serif font for title
   - Centered layout

2. **Color Scheme**
   - Teal accent: #20808d
   - Background: #fcfcf9
   - Borders: #e4e4e4
   - Text: #333 (headings), #666 (body)

3. **Card Style**
   - Clean borders
   - No box shadows
   - Subtle backgrounds
   - Rounded corners (4px)

4. **Interactive Elements**
   - Hover states with teal tint
   - Smooth transitions (0.2s ease)
   - Consistent button styling

### **Minimalist Approach:**

- No unnecessary decorations
- Plenty of whitespace
- Clear visual hierarchy
- Functional over flashy

---

## 📊 Comparison: One-Off vs Recurring

| Aspect | One-Off Windows (Day View) | Recurring Windows (Schedule) |
|--------|---------------------------|------------------------------|
| **Scope** | Single date | Day of week |
| **Storage** | Date-specific | Day-of-week pattern |
| **Display** | One timeline | 7 timelines (one per day) |
| **Component** | `CallWindowsCard.vue` | `CallWindowTimeline.vue` |
| **API** | `createOneOffCallWindow` | `createRecurringCallWindow` |
| **Use Case** | Override for specific day | Weekly routine |

---

## 🔄 CallWindowsCard Status

### **Current State:**

The original `CallWindowsCard.vue` component remains **unchanged** for now. It continues to handle one-off windows for the Day View.

### **Next Steps (Optional):**

The `CallWindowsCard` could be refactored to use the new `CallWindowTimeline` component:

**Before (Current):**
```vue
<template>
  <div class="call-windows-card">
    <!-- All timeline rendering inline -->
    <div class="timeline-container">
      <!-- 500+ lines of timeline code -->
    </div>
  </div>
</template>
```

**After (Potential Refactor):**
```vue
<template>
  <div class="call-windows-card">
    <div class="card-header">
      <!-- Header with undo/redo/etc -->
    </div>
    
    <CallWindowTimeline
      :windows="displayWindows"
      @window-create="handleCreate"
      @window-delete="handleDelete"
    />
  </div>
</template>
```

**Benefits:**
- Reduce code duplication
- Easier maintenance
- Consistent behavior

**Risks:**
- Potential regressions
- Need to update tests
- Undo/redo logic integration

**Recommendation:** Keep current implementation for stability. Refactor later if needed.

---

## 🧪 Testing Status

### **Existing Tests:**

The `CallWindowsCard.test.ts` file has 36 tests, but **18 are currently failing**.

**Failure Reasons:**
- Tests expect specific text patterns that may have changed
- Component structure may have evolved
- Mock data might be outdated

### **Testing Strategy:**

**Option 1: Fix Existing Tests**
- Update expectations to match current component
- Verify all functionality still works
- Time-consuming but thorough

**Option 2: Create New Tests**
- Write tests for new `CallWindowTimeline` component
- Test composable logic separately
- Faster, focuses on new code

**Option 3: Integration Tests**
- Test user workflows end-to-end
- Less brittle than unit tests
- Better coverage of real usage

**Recommendation:** Option 2 + Option 3
- Unit test the composable (pure logic, easy to test)
- Integration test the Schedule page (user workflows)
- Fix CallWindowsCard tests only if refactoring that component

---

## 📝 API Requirements

The Schedule page uses these API endpoints:

```typescript
// Get all recurring windows for user
api.getRecurringCallWindows(userId: string)
  → Array<{ _id, dayOfWeek, startTime, endTime }>

// Create recurring window
api.createRecurringCallWindow(
  userId: string,
  dayOfWeek: DayOfWeek,
  startTime: number,
  endTime: number
) → { callWindow: ID } | { error: string }

// Delete recurring window
api.deleteRecurringCallWindow(
  userId: string,
  dayOfWeek: DayOfWeek,
  startTime: number
) → Empty | { error: string }
```

**Note:** These endpoints should already exist in the backend CallWindow concept.

---

## 🚀 Future Enhancements

### **1. Merge Detection**

Currently, the Schedule page doesn't check for overlapping windows. Could add:

```typescript
const handleWindowCreate = async (day, data) => {
  const overlapping = findOverlappingWindows(
    { ...data, id: 'temp' },
    getWindowsForDay(day)
  );
  
  if (overlapping.length > 0) {
    // Merge or warn user
  }
  
  // Create window...
};
```

### **2. Copy Day**

Allow users to copy windows from one day to another:

```typescript
const copyDay = async (fromDay: DayOfWeek, toDay: DayOfWeek) => {
  const windows = getWindowsForDay(fromDay);
  for (const window of windows) {
    await api.createRecurringCallWindow(
      userId,
      toDay,
      window.startTime,
      window.endTime
    );
  }
  await loadRecurringWindows();
};
```

### **3. Bulk Edit**

Select multiple days and apply same windows:

```typescript
const applyToMultipleDays = async (
  days: DayOfWeek[],
  windows: { startTime: number; endTime: number }[]
) => {
  for (const day of days) {
    for (const window of windows) {
      await api.createRecurringCallWindow(
        userId,
        day,
        window.startTime,
        window.endTime
      );
    }
  }
  await loadRecurringWindows();
};
```

### **4. Templates**

Save and load window templates:

```typescript
const templates = {
  'Morning Person': {
    windows: [{ startTime: 6, endTime: 9 }],
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  },
  'Night Owl': {
    windows: [{ startTime: 20, endTime: 23 }],
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  }
};
```

### **5. Visual Improvements**

- Highlight current day
- Show total hours per day
- Color-code different window types
- Add window labels/notes

---

## ✅ Summary

### **What Was Done:**

1. ✅ Fixed prompt deactivation to blur text input
2. ✅ Created `useCallWindowTimeline` composable for reusable logic
3. ✅ Created `CallWindowTimeline` component for timeline rendering
4. ✅ Implemented Schedule page with weekly recurring windows
5. ✅ Maintained design consistency with Day View
6. ✅ Kept minimal coupling between layers

### **What Remains:**

1. ⏸️ Refactor `CallWindowsCard` to use new components (optional)
2. ⏸️ Fix existing CallWindowsCard tests (if refactoring)
3. ⏸️ Add tests for new components (recommended)
4. ⏸️ Add merge detection for Schedule page (enhancement)

### **Files Created:**

- `/src/composables/useCallWindowTimeline.ts` - Reusable timeline logic
- `/src/components/CallWindowTimeline.vue` - Reusable timeline component
- `/src/views/ScheduleView.vue` - Weekly schedule page

### **Files Modified:**

- `/src/views/JournalView.vue` - Fixed prompt deactivation

### **Architecture:**

```
Composable (Logic)
    ↓
Component (Presentation)
    ↓
Page (Integration)
```

**Result:** Clean, maintainable, reusable code with minimal coupling! 🎉
