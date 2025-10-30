# Day Mode Implementation - Final Design

## 🎯 Concept: Recurring vs Custom Mode

Instead of tracking "cleared" days, we now track whether each day uses **recurring (default)** or **custom (one-off)** windows.

### Flag: `useRecurring` (boolean)
- `true` = **Recurring Mode** (default) - Show recurring windows
- `false` = **Custom Mode** - Show one-off windows (might be empty)

---

## 📊 State Transitions

```
┌─────────────────────────────────────┐
│   RECURRING MODE (Default)          │
│   Shows: Recurring windows          │
│   Flag: useRecurring = true         │
└─────────────────────────────────────┘
              │
              ├─ User ADDS/EDITS window
              │   └─→ Convert recurring to one-off
              │       Set useRecurring = false
              │
              ↓
┌─────────────────────────────────────┐
│   CUSTOM MODE                       │
│   Shows: One-off windows            │
│   Flag: useRecurring = false        │
└─────────────────────────────────────┘
              │
              ├─ User CLEARS
              │   └─→ Delete all one-off
              │       Keep useRecurring = false
              │       (Empty custom mode)
              │
              ├─ User ADDS window
              │   └─→ Create one-off
              │       Keep useRecurring = false
              │
              └─ User RESETS
                  └─→ Delete all one-off
                      Set useRecurring = true
                      (Back to recurring mode)
```

---

## 🔄 User Workflows

### Workflow 1: First Edit (Recurring → Custom)
1. **Initial State:** Day shows recurring windows (useRecurring = true)
2. **User Action:** Adds or edits a window
3. **System:**
   - Converts all recurring windows to one-off
   - Sets `useRecurring = false`
4. **Result:** Day is now in custom mode

### Workflow 2: Clear (Stay in Custom Mode)
1. **Initial State:** Day in custom mode with windows
2. **User Action:** Clicks "Clear"
3. **System:**
   - If in recurring mode, convert to custom first
   - Delete all one-off windows
   - Keep `useRecurring = false`
4. **Result:** Day is empty but still in custom mode (no recurring windows show)

### Workflow 3: Add to Empty Custom Day
1. **Initial State:** Day in custom mode, empty (cleared)
2. **User Action:** Adds a window
3. **System:**
   - Creates one-off window
   - Keeps `useRecurring = false`
4. **Result:** Window appears, day stays in custom mode

### Workflow 4: Reset (Custom → Recurring)
1. **Initial State:** Day in custom mode (with or without windows)
2. **User Action:** Clicks "Reset"
3. **System:**
   - Deletes all one-off windows
   - Sets `useRecurring = true`
4. **Result:** Day returns to recurring mode, shows recurring windows

---

## 💾 Database Schema

### Collection: `CallWindow.dayModes`

```typescript
interface DayModeDoc {
  _id: ObjectId;
  user: string;
  date: string; // YYYY-MM-DD
  useRecurring: boolean; // true = recurring mode, false = custom mode
}
```

### Example Documents:

```javascript
// Day in custom mode (user edited it)
{
  _id: "...",
  user: "user123",
  date: "2025-10-24",
  useRecurring: false
}

// Day in recurring mode (explicitly set, or default if no document)
{
  _id: "...",
  user: "user123",
  date: "2025-10-25",
  useRecurring: true
}

// Day with no document = defaults to recurring mode
// (no document needed for default behavior)
```

---

## 🔧 Backend Methods

### File: `/concept_backend/src/concepts/CallWindow/CallWindowConcept.ts`

```typescript
/**
 * Set day to custom mode (use one-off windows)
 */
async setDayModeCustom({ user, date })

/**
 * Set day to recurring mode (use recurring windows)
 */
async setDayModeRecurring({ user, date })

/**
 * Check if day should use recurring windows
 * Returns true if no mode set (default) or if useRecurring = true
 */
async shouldUseRecurring({ user, date }): Promise<boolean>
```

---

## 🎨 Frontend Implementation

### API Methods (`/src/services/api.ts`)

```typescript
async setDayModeCustom(user: string, date: string)
async setDayModeRecurring(user: string, date: string)
async shouldUseRecurring(user: string, date: string): Promise<boolean>
```

### Component Logic (`/src/components/CallWindowsCard.vue`)

#### 1. Display Windows
```typescript
const updateDisplayWindows = async () => {
  const useRecurring = await api.shouldUseRecurring(userId, date);
  
  if (useRecurring) {
    // Show recurring windows
  } else {
    // Show one-off windows (might be empty)
  }
};
```

#### 2. Create Window
```typescript
const createOneOffWindow = async (startTime, endTime) => {
  const useRecurring = await api.shouldUseRecurring(userId, date);
  
  if (useRecurring) {
    // First edit: convert to custom mode
    await ensureOneOffWindowsExist(); // Convert recurring to one-off
    await api.setDayModeCustom(userId, date);
  }
  
  // Create the window...
};
```

#### 3. Clear
```typescript
const handleClear = async () => {
  const useRecurring = await api.shouldUseRecurring(userId, date);
  
  if (useRecurring) {
    // Convert to custom mode first
    await ensureOneOffWindowsExist();
    await api.setDayModeCustom(userId, date);
  }
  
  // Delete all one-off windows
  // Stay in custom mode (useRecurring = false)
};
```

#### 4. Reset
```typescript
const handleReset = async () => {
  // Delete all one-off windows
  // ...
  
  // Switch back to recurring mode
  await api.setDayModeRecurring(userId, date);
};
```

---

## ✅ Behavior Matrix

| Action | Initial Mode | Final Mode | Windows Shown | Flag Value |
|--------|-------------|------------|---------------|------------|
| **View** | Recurring | Recurring | Recurring windows | `true` |
| **View** | Custom (with windows) | Custom | One-off windows | `false` |
| **View** | Custom (empty) | Custom | No windows | `false` |
| **Add/Edit** | Recurring | Custom | New one-off + converted | `false` |
| **Add/Edit** | Custom | Custom | One-off windows | `false` |
| **Clear** | Recurring | Custom | No windows | `false` |
| **Clear** | Custom | Custom | No windows | `false` |
| **Reset** | Recurring | Recurring | Recurring windows | `true` |
| **Reset** | Custom | Recurring | Recurring windows | `true` |

---

## 🎯 Key Insights

### Why This Design Works:

1. **Clear Semantics:**
   - Recurring mode = "Use my weekly schedule"
   - Custom mode = "I've customized this day"

2. **Intuitive Behavior:**
   - Clear doesn't bring back recurring (day stays customized)
   - Reset explicitly returns to weekly schedule
   - First edit automatically switches to custom mode

3. **Database Efficiency:**
   - Default to recurring (no document needed)
   - Only store when user customizes
   - Simple boolean flag

4. **User Mental Model:**
   - "This day follows my weekly schedule" (recurring)
   - "This day is special/customized" (custom)
   - Clear = "Remove windows but keep it custom"
   - Reset = "Go back to my weekly schedule"

---

## 🧪 Test Scenarios

### Scenario 1: First Edit
- Start: Recurring mode, shows recurring windows
- Action: User adds window
- Expected: Converts to custom mode, shows one-off windows
- Result: ✅ `useRecurring = false`

### Scenario 2: Clear Then Add
- Start: Custom mode with windows
- Action 1: User clears
- Expected: Empty, still custom mode
- Action 2: User adds window
- Expected: Window appears, stays custom mode
- Result: ✅ `useRecurring = false` throughout

### Scenario 3: Reset After Clear
- Start: Custom mode, empty (after clear)
- Action: User resets
- Expected: Returns to recurring mode, shows recurring windows
- Result: ✅ `useRecurring = true`

### Scenario 4: Clear in Recurring Mode
- Start: Recurring mode
- Action: User clears
- Expected: Converts to custom mode, then empties
- Result: ✅ `useRecurring = false`, no windows

---

## 📝 Migration Notes

**From Old "Cleared Day" Design:**
- Old: `clearedDays` collection tracked "cleared" state
- New: `dayModes` collection tracks recurring vs custom mode
- Migration: Any cleared day → set `useRecurring = false`

**Benefits of New Design:**
- More intuitive user experience
- Clearer separation of concerns
- Better matches user mental model
- Simpler to explain and document

---

## 🚀 Status

✅ **Backend:** Implemented in `CallWindowConcept.ts`  
✅ **Frontend API:** Implemented in `api.ts`  
✅ **Component:** Implemented in `CallWindowsCard.vue`  
✅ **Logic:** All workflows implemented correctly  

**Ready for testing and refactor!**
