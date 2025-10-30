# Journal Page Updates - Summary

## ✅ Changes Implemented

### **1. Visual Improvements**

#### **Header Styling**
- ✅ Updated to match DayView page style
- Large hero card with icon, title (48px, bold), and subtitle
- Centered layout with consistent spacing
- Icon: `mdi-message-text-outline` in teal

#### **Prompt Text Alignment**
- ✅ Left-aligned all prompt text
- Maintains readability and follows standard UI patterns

#### **Inactive Prompt Visual Distinction**
- ✅ Grayed out background (#fafafa)
- Reduced opacity (0.6)
- Italic gray text (#999)
- Empty dashed circle instead of number
- Lighter drag handle color
- No hover effects on inactive prompts
- **Active prompts show sequential numbering (1, 2, 3...) only for active items**

### **2. Rating Prompt Feature**

#### **New Section Added**
- ✅ Separate "Day Rating" section below prompts list
- Special prompt: "On a scale from -2 to 2 using only whole numbers, what would you rate today?"
- Toggle button (eye/eye-off icon) to activate/deactivate
- **Active by default** as requested
- Visual styling matches prompt items
- Descriptive text explaining it's asked at end of call

#### **State Management**
- `includeRating` ref tracks active/inactive state
- TODO: Backend integration for persisting rating preference

### **3. Default Prompts**

#### **Auto-Creation for New Users**
- ✅ Checks if user has no prompts on mount
- ✅ Automatically calls `createDefaultPrompts` API
- ✅ Backend updated with correct 4 default prompts:
  1. "What are you grateful for today?"
  2. "What did you do today?"
  3. "What are you proud of today?"
  4. "What do you want to do tomorrow?"

### **4. Navigation & Routing**

#### **Sidebar Updates**
- ✅ Removed "Favourite Entries" option
- ✅ Added routing to "Past Entries" (default) - `/journal`
- ✅ Added routing to "Current Prompts" - `/journal/prompts`
- Both are now clickable router-links

#### **Router Configuration**
- ✅ `/journal` → PastEntriesView (new default)
- ✅ `/journal/prompts` → JournalView (current prompts)

### **5. Past Entries Page**

#### **New Page Created**
- ✅ `/src/views/PastEntriesView.vue`
- Matches DayView header style
- Lists all journal entries in reverse chronological order
- Shows date, rating, and preview of first 2 responses
- Click to view full entry (TODO: detailed view)
- Empty state for no entries
- Loading state

#### **Features**
- Date formatting (Today, Yesterday, or full date)
- Rating badge display
- Response preview with truncation
- Hover effects and animations
- Responsive card layout

## 📁 Files Modified

### **Frontend**
1. `/src/views/JournalView.vue`
   - Updated header to match DayView style
   - Left-aligned prompt text
   - Enhanced inactive prompt styling
   - Added rating prompt section with toggle
   - Added auto-creation of default prompts
   - Sequential numbering for active prompts only

2. `/src/views/PastEntriesView.vue` (NEW)
   - Complete past entries listing page
   - Entry cards with date, rating, and previews
   - Loading and empty states

3. `/src/components/Sidebar/Sidebar.vue`
   - Updated journal panel items
   - Removed "Favourite Entries"
   - Added router-links for navigation

4. `/src/router/index.ts`
   - Updated `/journal` to point to PastEntriesView
   - Added `/journal/prompts` route

### **Backend**
1. `/concept_backend/src/concepts/JournalPrompt/JournalPromptConcept.ts`
   - Updated default prompts from 5 to 4
   - Removed "Any other thoughts or reflections?"

## 🎨 Visual Design

### **Inactive Prompts**
```
Before: Same as active, just eye-off icon
After:  - Grayed background
        - Reduced opacity
        - Italic gray text
        - Empty dashed circle (no number)
        - Clearly distinct from active prompts
```

### **Active Prompt Numbering**
```
Example with 5 prompts (2 inactive):
[1] Active prompt 1
[2] Active prompt 2
[○] Inactive prompt (no number)
[3] Active prompt 3
[○] Inactive prompt (no number)
```

### **Rating Prompt**
```
┌─────────────────────────────────────────────┐
│ Day Rating                                   │
│                                              │
│ ⭐ On a scale from -2 to 2 using only...   👁│
│    This prompt asks users to rate their...  │
└─────────────────────────────────────────────┘
```

## 🔄 Integration Points

### **ReflectionSession Integration**
- ✅ Active prompts from JournalView should be used in ReflectionSession
- ✅ Rating prompt (if active) should be included at end of session
- When prompts change, uncompleted/not-in-progress sessions use new prompts
- Completed sessions remain unchanged (immutable)

### **Backend Requirements**
The rating prompt feature may require backend modifications:
1. Store user preference for including rating
2. Include rating in ReflectionSession prompt list if active
3. Handle rating response separately from text prompts

## 🧪 Testing Checklist

- [ ] Navigate to /journal → see Past Entries page
- [ ] Navigate to /journal/prompts → see Current Prompts page
- [ ] Sidebar journal hover shows correct links
- [ ] New user gets 4 default prompts automatically
- [ ] Inactive prompts show empty dashed circle (no number)
- [ ] Active prompts show sequential numbering (1, 2, 3...)
- [ ] Prompt text is left-aligned
- [ ] Rating prompt toggle works
- [ ] Rating prompt is active by default
- [ ] Inactive prompts are visually distinct (gray, italic, faded)
- [ ] Header matches DayView style
- [ ] Past entries load and display correctly
- [ ] Entry cards show date, rating, and response previews

## 📝 TODO Items

### **High Priority**
1. **Backend: Rating Prompt Persistence**
   - Add field to store user's rating preference
   - API endpoint to update preference
   - Include in ReflectionSession prompt generation

2. **ReflectionSession Integration**
   - Ensure active prompts are used in new sessions
   - Include rating prompt if active
   - Handle rating response in session completion

3. **Entry Detail View**
   - Create detailed view for past entries
   - Show all responses
   - Display rating prominently
   - Allow navigation between entries

### **Medium Priority**
4. **Rating Preference Persistence**
   - Save `includeRating` state to backend
   - Load on component mount
   - Sync across devices

5. **Entry Filtering/Search**
   - Filter by date range
   - Search in responses
   - Filter by rating

6. **Entry Actions**
   - Edit entry (if within time window)
   - Delete entry
   - Export entry

### **Low Priority**
7. **Favorite Entries** (if needed later)
   - Add favorite toggle to entries
   - Create favorites view
   - Add back to sidebar

## 🎯 User Experience Flow

### **New User Journey**
1. User signs up
2. Navigates to Journal (sees Past Entries - empty)
3. Clicks "Current Prompts" in sidebar
4. Sees 4 default prompts + rating prompt (all active)
5. Can customize prompts
6. Completes first reflection call
7. Entry appears in Past Entries

### **Existing User Journey**
1. User navigates to Journal
2. Sees list of past entries
3. Can click to view details
4. Can navigate to Current Prompts to customize
5. Changes to prompts affect future sessions only

## 🔧 Technical Notes

### **Active Prompt Counting**
```typescript
const getActiveIndex = (index: number) => {
  let activeCount = 0;
  for (let i = 0; i <= index; i++) {
    if (prompts.value[i].isActive) {
      activeCount++;
    }
  }
  return activeCount;
};
```

### **Rating Prompt State**
```typescript
const includeRating = ref(true); // Active by default
const toggleRating = () => {
  includeRating.value = !includeRating.value;
  // TODO: Save to backend
};
```

### **Default Prompts Creation**
```typescript
onMounted(async () => {
  await loadPrompts();
  if (prompts.value.length === 0) {
    await api.createDefaultPrompts(userId);
    await loadPrompts();
  }
});
```
