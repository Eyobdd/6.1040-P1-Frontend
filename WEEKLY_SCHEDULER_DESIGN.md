# Weekly Scheduler Design - Google Calendar + Notion Inspired 🎨

## 🎯 Design Goals:

Combine the best of both worlds:
- **Google Calendar:** Clean grid, clear time blocks, professional layout
- **Notion Calendar:** Modern aesthetic, smooth interactions, beautiful typography

---

## 📐 Layout Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  [<] October 26 - November 1, 2025 [>]           [Today] [Week] │ Header
├─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┤
│     │   SUN   │   MON   │   TUE   │   WED   │   THU   │   FRI   │ Day Headers
│     │   26    │   27    │   28    │   29    │   30    │   31    │
├─────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 12A │         │         │         │         │         │         │
│  1A │         │         │         │         │         │         │
│  2A │         │         │         │         │         │         │
│  3A │         │         │         │         │         │         │
│  4A │         │         │         │         │         │         │
│  5A │         │         │         │         │         │         │
│  6A │         │  ┌────┐ │         │         │  ┌────┐ │         │
│  7A │         │  │Call│ │         │         │  │Call│ │         │
│  8A │         │  └────┘ │         │         │  └────┘ │         │
│  9A │         │         │         │         │         │         │
│ 10A │         │         │         │         │         │         │
│ 11A │         │         │         │         │         │         │
│ 12P │         │         │         │         │         │         │
│  1P │         │         │         │         │         │         │
│  2P │         │         │         │         │         │         │
│  3P │         │         │         │         │         │         │
│  4P │         │         │         │         │         │         │
│  5P │         │         │         │         │         │         │
│  6P │         │         │         │         │         │         │
│  7P │         │         │         │         │         │         │
│  8P │         │         │         │         │         │         │
│  9P │         │         │         │         │         │         │
│ 10P │         │         │         │         │         │         │
│ 11P │         │         │         │         │         │         │
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 🎨 Design Aesthetic:

### Google Calendar Inspiration:
- ✅ Clean 7-column grid
- ✅ Hour-based rows (24 hours)
- ✅ Event blocks positioned by time
- ✅ Clear time labels on left
- ✅ Professional, organized feel

### Notion Calendar Inspiration:
- ✅ Modern, minimal design
- ✅ Soft shadows and borders
- ✅ Beautiful typography (SF Pro / Inter)
- ✅ Smooth hover states
- ✅ Subtle color palette
- ✅ Rounded corners
- ✅ Clean spacing

---

## 🎨 Color Palette:

```css
/* Background */
--bg-primary: #ffffff
--bg-secondary: #fafafa
--bg-hover: #f5f5f5

/* Borders */
--border-light: #e5e5e5
--border-medium: #d4d4d4

/* Text */
--text-primary: #171717
--text-secondary: #737373
--text-tertiary: #a3a3a3

/* Accent (Teal) */
--accent-primary: #20808d
--accent-hover: #1a6b76
--accent-light: #e6f4f6

/* Call Window */
--window-bg: #20808d
--window-border: #1a6b76
--window-text: #ffffff

/* Today Highlight */
--today-bg: #fef3c7
--today-border: #fbbf24
```

---

## 📏 Spacing & Sizing:

```css
/* Grid */
--hour-height: 60px
--day-column-width: 1fr (equal columns)
--time-column-width: 60px

/* Typography */
--font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif
--font-size-sm: 12px
--font-size-base: 14px
--font-size-lg: 16px
--font-size-xl: 20px

/* Borders */
--border-radius: 8px
--border-width: 1px

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)
```

---

## 🔧 Features:

### Navigation:
- ✅ Week navigation (prev/next arrows)
- ✅ "Today" button to jump to current week
- ✅ Week range display (e.g., "Oct 26 - Nov 1, 2025")

### Day Columns:
- ✅ Day name (SUN, MON, TUE, etc.)
- ✅ Date number (26, 27, 28, etc.)
- ✅ Today indicator (highlighted background)
- ✅ Click day to focus on single day view

### Time Grid:
- ✅ 24-hour labels (12A, 1A, ..., 11P)
- ✅ Hour lines (solid)
- ✅ Half-hour lines (dashed, subtle)
- ✅ Scrollable timeline (fixed header)

### Call Windows:
- ✅ Positioned by start/end time
- ✅ Teal background (#20808d)
- ✅ White text
- ✅ Time range displayed
- ✅ Hover effects
- ✅ Click to edit
- ✅ Drag to create (optional)

### Interactions:
- ✅ Hover states on days, windows
- ✅ Click day to view single day
- ✅ Click window to edit
- ✅ Smooth transitions
- ✅ Keyboard navigation (arrows)

---

## 📱 Responsive:

### Desktop (>1024px):
- Full 7-day week view
- All hours visible with scroll

### Tablet (768px - 1024px):
- 5-day work week view
- Compact time labels

### Mobile (<768px):
- Single day view
- Swipe to navigate days

---

## 🎯 Component Structure:

```
WeeklyScheduler.vue
├── Header (navigation, date range, controls)
├── DayHeaders (7 columns with day names/dates)
├── TimeGrid
│   ├── TimeLabels (left column)
│   └── DayColumns (7 columns)
│       └── CallWindowBlocks (positioned by time)
└── Modals (edit, create)
```

---

## 🔄 Integration:

**Reuse existing:**
- ✅ `useDayCallWindows` composable (for each day)
- ✅ `CallWindowEditModal` component
- ✅ `CallWindowMergePrompt` component
- ✅ Existing API methods

**New components:**
- `WeeklyScheduler.vue` - Main weekly view
- `useWeekScheduler.ts` - Composable for week logic (optional)

---

## 🎨 Visual Polish:

### Notion-inspired touches:
- Subtle hover states (background change)
- Smooth transitions (200ms ease)
- Clean typography (SF Pro / Inter)
- Minimal borders (1px, light gray)
- Rounded corners (8px)
- Soft shadows on hover

### Google Calendar touches:
- Clear grid structure
- Professional time labels
- Organized layout
- Familiar navigation
- Clean, uncluttered design

---

## 🚀 Implementation Plan:

1. **Create WeeklyScheduler component**
2. **Build grid layout (CSS Grid)**
3. **Add day headers with navigation**
4. **Render time labels and grid lines**
5. **Position call windows by time**
6. **Add interactions (click, hover)**
7. **Style with modern aesthetic**
8. **Test and polish**

---

**Ready to build!** Let's create a beautiful, modern weekly scheduler! 🎨✨
