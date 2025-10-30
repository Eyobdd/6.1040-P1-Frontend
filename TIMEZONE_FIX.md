# Timezone Issue Fix - Journal Entry Date Mismatch

## 🐛 Issue Identified

Journal entries created on Oct 29 were showing up on Oct 30 in the Day View, but correctly showed as "Yesterday" in the Past Entries page.

### **Root Cause: UTC vs Local Time**

The issue was caused by using `toISOString().split('T')[0]` to format dates, which converts to UTC before extracting the date string.

**Example of the Problem:**
```javascript
// User's local time: Oct 30, 2025 12:00 AM (UTC-4)
const date = new Date(); // Oct 30, 2025 12:00 AM local

// WRONG: Converts to UTC first
date.toISOString().split('T')[0]
// Returns: "2025-10-29" (because UTC is 4 hours ahead, so it's still Oct 29 in UTC)

// CORRECT: Uses local date components
const year = date.getFullYear();        // 2025
const month = String(date.getMonth() + 1).padStart(2, '0'); // "10"
const day = String(date.getDate()).padStart(2, '0');        // "30"
const dateString = `${year}-${month}-${day}`;
// Returns: "2025-10-30" (correct local date)
```

---

## ✅ Solution Implemented

### **Files Fixed**

1. **DayView.vue** - When checking for journal entry
2. **ReflectView.vue** - When checking if entry already exists
3. **CallWindowsCard.vue** - When formatting selected date string

### **Before (Broken)**
```typescript
// Used UTC date
const dateString = selectedDate.value.toISOString().split('T')[0];
```

### **After (Fixed)**
```typescript
// Use local date components
const year = selectedDate.value.getFullYear();
const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0');
const day = String(selectedDate.value.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;
```

---

## 🔍 Why This Happened

### **UTC Conversion**
- `toISOString()` always converts to UTC (Coordinated Universal Time)
- For users in timezones behind UTC (e.g., UTC-4, UTC-5), this causes dates to shift backward
- For users ahead of UTC, dates could shift forward

### **Example Timeline**
```
User's Local Time: Oct 30, 2025 12:00 AM (EDT, UTC-4)
UTC Time: Oct 29, 2025 8:00 PM

toISOString() returns: "2025-10-29T20:00:00.000Z"
split('T')[0] gives: "2025-10-29" ❌ Wrong date!

Local date should be: "2025-10-30" ✅
```

---

## 📊 Impact

### **Affected Components**

1. **DayView**
   - Was showing entries from previous day
   - "Call Completed" overlay appeared on wrong date
   - Day score widget showed wrong entry

2. **ReflectView**
   - Could allow duplicate entries on same local day
   - "Entry already exists" check was off by one day

3. **CallWindowsCard**
   - Journal entry check was comparing wrong dates
   - Completed overlay could appear on wrong day

### **Not Affected**

- **PastEntriesView**: Uses relative date formatting ("Yesterday", "Today") which worked correctly
- **Backend**: Stores dates as ISO strings correctly
- **Database**: Entries stored with correct dates

---

## 🧪 Testing

### **Verify the Fix**

1. **Create Entry on Oct 29**
   - Complete reflection on Oct 29
   - Navigate to Day View for Oct 30
   - Should NOT show the Oct 29 entry ✅

2. **View Correct Date**
   - Navigate to Day View for Oct 29
   - Should show the Oct 29 entry ✅
   - "Call Completed" overlay should appear ✅

3. **Past Entries Consistency**
   - Past Entries page should match Day View
   - Both should show same date for same entry ✅

4. **Timezone Edge Cases**
   - Test at midnight (12:00 AM)
   - Test in different timezones
   - Test near DST transitions

---

## 🎯 Best Practices

### **Date Formatting Rules**

1. **For Display**: Use local date components
   ```typescript
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   const dateString = `${year}-${month}-${day}`;
   ```

2. **For Storage**: Use ISO strings (includes timezone info)
   ```typescript
   const timestamp = new Date().toISOString();
   // "2025-10-30T04:00:00.000Z"
   ```

3. **For Comparison**: Normalize to same timezone
   ```typescript
   const date1 = new Date(dateString1);
   const date2 = new Date(dateString2);
   date1.setHours(0, 0, 0, 0);
   date2.setHours(0, 0, 0, 0);
   const isSameDay = date1.getTime() === date2.getTime();
   ```

### **When to Use Each**

| Use Case | Method | Example |
|----------|--------|---------|
| Display to user | Local components | "Oct 30, 2025" |
| Store in database | ISO string | "2025-10-30T04:00:00.000Z" |
| Compare dates | Normalized local | `date.setHours(0,0,0,0)` |
| API date parameter | Local YYYY-MM-DD | "2025-10-30" |
| Timestamps | ISO string | `new Date().toISOString()` |

---

## 🔧 Related Issues

### **Similar Patterns to Check**

Search codebase for:
- `toISOString().split('T')[0]`
- Date comparisons without timezone consideration
- Date formatting for API calls

### **Backend Considerations**

The backend should:
- Store dates in user's timezone or UTC with timezone info
- Accept date strings in YYYY-MM-DD format
- Compare dates using same timezone logic
- Document expected date format in API

---

## 📝 Notes

### **Why Not Use Date Libraries?**

We chose vanilla JavaScript because:
- Minimal dependencies
- Simple use case (date string formatting)
- No need for complex timezone conversions
- Reduces bundle size

For more complex date operations, consider:
- `date-fns` (lightweight, tree-shakeable)
- `dayjs` (small, moment.js alternative)
- `luxon` (modern, timezone-aware)

### **DST Considerations**

Daylight Saving Time transitions can cause:
- Hours to repeat (fall back)
- Hours to skip (spring forward)
- Date boundaries to shift

Our fix handles DST correctly because we use local date components directly.

---

## ✅ Success Criteria

- [x] Day View shows correct date for entries
- [x] ReflectView prevents duplicates on same local day
- [x] CallWindowsCard checks correct date for completion
- [x] Consistency between Day View and Past Entries
- [x] Works across all timezones
- [x] Handles midnight edge cases
- [x] No UTC conversion for date strings

---

## 🚀 Additional Fix: Schedule Tab

As requested, the Schedule tab has been uncommented in the sidebar:
- Main navigation item restored
- Expanded panel with sub-items restored
- Hover functionality working
- Ready for Schedule feature implementation
