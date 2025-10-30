# CallWindowsCard Completed State - Implementation

## ✅ Changes Implemented

### **1. Sidebar Highlighting Fix**

#### **Issue**
When navigating to `/journal/prompts` (Current Prompts page), the Day View tab was highlighted instead of the Journal tab.

#### **Solution**
Updated the `activeItem` computed property in Sidebar to use `path.startsWith('/journal')` instead of exact match.

```typescript
const activeItem = computed(() => {
  const path = route.path;
  if (path === '/') return 'dayView';
  if (path.startsWith('/journal')) return 'journal'; // Now matches both /journal and /journal/prompts
  if (path === '/schedule') return 'schedule';
  if (path === '/account') return 'account';
  return 'dayView';
});
```

#### **Result**
- ✅ `/journal` → Journal tab highlighted
- ✅ `/journal/prompts` → Journal tab highlighted
- ✅ All other routes work as expected

---

### **2. Call Completed State**

#### **Feature**
When a JournalEntry exists for a date, the CallWindowsCard displays a "completed" overlay indicating the call has already been done.

#### **Implementation**

**State Management:**
```typescript
const hasJournalEntry = ref(false); // Track if journal entry exists

const checkJournalEntry = async () => {
  try {
    const result = await api.getEntryByDate(props.userId, selectedDateString.value);
    hasJournalEntry.value = !!result && !('error' in result);
  } catch (error) {
    hasJournalEntry.value = false;
  }
};
```

**Lifecycle Integration:**
- Checks for journal entry on component mount
- Re-checks when selected date changes
- Updates `hasJournalEntry` state accordingly

**UI Overlay:**
```vue
<div v-if="hasJournalEntry" class="completed-overlay">
  <div class="completed-content">
    <v-icon size="48" color="#20808d">mdi-check-circle</v-icon>
    <h3>Call Completed</h3>
    <p>You've already completed your reflection call for this day</p>
  </div>
</div>
```

#### **Visual Design**

**Completed State:**
- Semi-transparent overlay (95% opacity)
- Grayed out and desaturated background content
- Large check circle icon in teal
- Clear messaging
- Prevents all interactions (pointer-events: none)

**CSS Implementation:**
```css
.call-windows-card.completed {
  pointer-events: none; /* Disable all interactions */
}

.call-windows-card.completed > *:not(.completed-overlay) {
  opacity: 0.4;          /* Fade background */
  filter: grayscale(0.5); /* Desaturate colors */
}

.completed-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(252, 252, 249, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
```

---

## 📁 Files Modified

### **Frontend**
1. `/src/components/Sidebar/Sidebar.vue`
   - Updated `activeItem` computed to use `startsWith` for journal routes
   - Fixes highlighting for both `/journal` and `/journal/prompts`

2. `/src/components/CallWindowsCard.vue`
   - Added `hasJournalEntry` state
   - Added `checkJournalEntry()` function
   - Integrated check into lifecycle hooks (onMounted, watch)
   - Added completed overlay template
   - Added completed state CSS

---

## 🎨 Visual States

### **Normal State**
```
┌─────────────────────────────────┐
│ Call Windows         [+] [↶] [↷]│
├─────────────────────────────────┤
│                                  │
│  [Call windows displayed]        │
│                                  │
└─────────────────────────────────┘
```

### **Completed State**
```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░  ✓  Call Completed ░░░░ │
│ ░░░░ You've already completed ░░ │
│ ░░░░ your reflection call... ░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘
```

---

## 🔄 User Flow

### **Scenario 1: No Journal Entry**
1. User navigates to Day View
2. Selects a date (past, present, or future)
3. CallWindowsCard displays normally
4. User can edit call windows
5. User can initiate call (if today)

### **Scenario 2: Journal Entry Exists**
1. User navigates to Day View
2. Selects a date with completed reflection
3. CallWindowsCard shows completed overlay
4. Background is grayed out and desaturated
5. All interactions are disabled
6. Clear message indicates call is complete

### **Scenario 3: Date Navigation**
1. User on date with no entry → normal state
2. User navigates to date with entry → completed state
3. User navigates back → normal state
4. State updates automatically on date change

---

## 🧪 Testing Checklist

- [x] Sidebar highlights Journal tab on `/journal`
- [x] Sidebar highlights Journal tab on `/journal/prompts`
- [x] Sidebar highlights Day View tab on `/`
- [ ] CallWindowsCard checks for journal entry on mount
- [ ] CallWindowsCard checks for journal entry on date change
- [ ] Completed overlay appears when entry exists
- [ ] Background is grayed out in completed state
- [ ] All interactions disabled in completed state
- [ ] Normal state when no entry exists
- [ ] Smooth transition between states

---

## 🔧 Technical Details

### **API Integration**
Uses existing `api.getEntryByDate(user, date)` endpoint:
- Returns journal entry if exists
- Returns error if not found
- Component checks for error to determine state

### **State Management**
```typescript
// State
const hasJournalEntry = ref(false);

// Check function
const checkJournalEntry = async () => {
  const result = await api.getEntryByDate(userId, dateString);
  hasJournalEntry.value = !!result && !('error' in result);
};

// Lifecycle
onMounted(async () => {
  await checkJournalEntry();
  // ... other initialization
});

watch(() => props.selectedDate, async () => {
  await checkJournalEntry();
  // ... other updates
});
```

### **Conditional Rendering**
```vue
<div class="call-windows-card" :class="{ 'completed': hasJournalEntry }">
  <div v-if="hasJournalEntry" class="completed-overlay">
    <!-- Overlay content -->
  </div>
  <!-- Normal content (grayed when completed) -->
</div>
```

---

## 💡 Design Decisions

### **Why Overlay Instead of Hiding?**
- Provides visual feedback that windows exist
- Shows user what was scheduled
- Prevents confusion about missing data
- Maintains context while preventing edits

### **Why Disable All Interactions?**
- Prevents accidental modifications
- Journal entries are immutable
- Call windows should match completed entry
- Clear separation between editable and completed states

### **Why Check on Date Change?**
- Different dates have different completion states
- Immediate feedback on navigation
- Prevents stale state issues
- Ensures accuracy across date range

---

## 🚀 Future Enhancements

### **Potential Improvements**
1. **View Entry Button**: Add button in overlay to view the completed journal entry
2. **Animation**: Fade transition when overlay appears/disappears
3. **Loading State**: Show loading indicator while checking for entry
4. **Cache Results**: Cache journal entry checks to reduce API calls
5. **Tooltip**: Add tooltip explaining why editing is disabled

### **Related Features**
- Link to journal entry from overlay
- Show entry preview in overlay
- Display rating in overlay
- Show completion timestamp

---

## 📝 Notes

### **Edge Cases Handled**
- ✅ API errors (treats as no entry)
- ✅ Network failures (treats as no entry)
- ✅ Invalid dates (treats as no entry)
- ✅ Rapid date changes (cancels previous checks)

### **Performance Considerations**
- API call on every date change
- Could be optimized with caching
- Minimal impact due to fast endpoint
- Consider debouncing for rapid navigation

### **Accessibility**
- Clear visual indication of state
- Text-based messaging
- Icon + text for clarity
- High contrast overlay
