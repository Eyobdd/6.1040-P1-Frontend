# Zien User Journey

> **For detailed technical documentation, see [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md)**

## Overview

Zien is a daily reflection app that helps users maintain clarity and focus through structured journaling. Users complete guided reflection sessions with customizable prompts, track their mood over time, and review past entries to see their personal growth journey.

## Complete User Journey

### First-Time User Experience

**Jordan**, a busy grad student, discovers Zien and decides to try it for daily reflection.

#### 1. **Registration & Onboarding**
- Opens Zien and sees the clean authentication page
- Registers using phone number: `+1-555-0123`
- Receives a 6-digit verification code via SMS (mocked in console for demo)
- Enters code and is authenticated
- Automatically redirected to Day View

#### 2. **Setting Up Weekly Schedule**
- Navigates to **Schedule** in the sidebar
- Sees the **Recurring Week Scheduler** with 7 day columns (Mon-Sun)
- Clicks and drags on Monday column from 9:00 AM to 10:00 AM
- Window appears instantly on Monday
- Clicks **Add** button in header to create windows for multiple days
- Selects Tuesday, Wednesday, Thursday checkboxes
- Sets time: 2:00 PM - 3:00 PM
- Clicks Create - windows appear on all three days
- Uses **Clear** button on Friday column to remove a window
- Clicks **Undo** to restore it
- Weekly template is now set up and will apply to all future weeks

#### 3. **Day View Dashboard**
- Returns to **Day View** (sidebar navigation)
- Sees today's date with a hero icon at the top
- Views the **Call Windows** card showing today's recurring windows from the weekly schedule
- Windows displayed with dashed borders (indicating recurring mode)
- Clicks **"Initiate Call"** button to start first reflection

#### 4. **First Reflection Session**
- Enters the **Reflect View** with a clean, focused interface
- Sees progress bar showing "1 of 5" steps
- Answers the **4 default prompts** one by one:
  1. **"What are you grateful for today?"**  
     → "My supportive friends and good health"
  2. **"What did you do today?"**  
     → "Finished a challenging project milestone for my thesis"
  3. **"What are you proud of today?"**  
     → "Staying focused despite distractions and meeting my deadline"
  4. **"What do you want to do tomorrow?"**  
     → "Start the next phase of my project and go for a run"

- After the last prompt, sees the **rating step**
- Rates the day as **+1** on a scale from -2 to +2
- Clicks **"Complete"** and sees success message
- Redirected back to Day View

#### 5. **Viewing Completed Entry**
- Day View now shows the **Call Completed** overlay on Call Windows card
- Grayed out with checkmark icon and message
- Windows are locked and cannot be edited for completed days
- Navigates to **Journal** in the sidebar

#### 6. **Past Entries Page**
- Sees the first journal entry card with:
  - Date: "Today"
  - Rating badge: ⭐ +1
  - Preview of first 2 responses
  - "+2 more responses" indicator
- Clicks the card to view full details

#### 7. **Entry Detail Modal**
- Modal opens showing:
  - Full date: "Today"
  - Rating: "⭐ +1 (Scale: -2 to +2)"
  - All 4 responses with numbered circles
  - Full text of each response
- Scrolls through responses
- Closes modal and returns to list

---

### Returning User Experience

**Day 2**: Jordan returns to Zien the next day.

#### 8. **Customizing a Specific Day**
- Opens **Day View** for tomorrow
- Sees recurring windows from weekly schedule (dashed borders)
- Decides tomorrow needs different availability
- Clicks and drags to add a new window from 11:00 AM to 12:00 PM
- System automatically:
  - Converts all recurring windows to one-off windows for this day
  - Switches day to **custom mode**
  - Windows now show solid borders (indicating custom mode)
- Edits one window by clicking it - time inputs are typeable
- Accidentally creates overlapping window
- System automatically merges overlapping windows (earliest start, latest end)
- Clicks **Undo** to revert last change
- Clicks **Redo** to bring it back
- Satisfied with custom schedule for tomorrow

#### 9. **Customizing Prompts**
- Navigates to **Journal → Current Prompts** in sidebar
- Sees the 4 default prompts with drag handles
- Decides to customize:
  - Edits prompt 2: "What did you do today?" → "What made you smile today?"
  - Deactivates prompt 4 (doesn't want to plan ahead every day)
  - Adds a new prompt: "What challenged you today?"
- Notices the **Day Rating** section below prompts
- Keeps rating enabled (default)
- Changes are saved automatically

#### 10. **Second Reflection with Custom Prompts**
- Returns to Day View
- Clicks **"Initiate Call"**
- Sees the **updated prompts** in reflection session:
  1. "What are you grateful for today?"
  2. "What made you smile today?" *(updated text)*
  3. "What are you proud of today?"
  4. "What challenged you today?" *(new prompt)*
  - *(Deactivated prompt is not shown)*
- Answers all prompts
- Rates day as **+2** (great day!)
- Completes session

#### 11. **Browsing Past Entries**
- Navigates to **Past Entries**
- Sees 2 entry cards now, sorted newest first:
  - **Today** - Rating: +2
  - **Yesterday** - Rating: +1
- Clicks yesterday's entry to review
- Sees the original prompts (immutable snapshot)
- Compares responses between days
- Notices personal growth and patterns

---

### Advanced Usage

**Week Later**: Jordan has been using Zien daily.

#### 12. **Managing Call Windows - Clear vs Reset**
- Opens **Day View** for a custom day (previously edited)
- Decides to remove all windows for that day
- Clicks **Clear** button
  - All windows disappear
  - Day stays in custom mode (no recurring windows show)
  - Can add new custom windows if needed later
- Next day, decides to go back to weekly schedule
- Clicks **Reset** button
  - Day returns to recurring mode
  - Shows recurring windows from weekly template again
  - Dashed borders indicate recurring mode

#### 13. **Disabling Rating**
- Decides rating feels too quantitative
- Goes to **Current Prompts**
- Toggles the **Day Rating** off (eye icon changes to eye-off)
- Preference saved to profile

#### 14. **Reflection Without Rating**
- Starts new reflection session
- Answers all prompts as usual
- **No rating step appears** (auto-completes after last prompt)
- Session completes immediately
- Entry saved without rating (defaults to 0)

#### 15. **Managing Prompts**
- Reorders prompts via drag-and-drop
- Temporarily deactivates a prompt without deleting
- Inactive prompt shown with:
  - Grayed background
  - Italic text
  - Empty dashed circle (no number)
- Can reactivate later if needed

#### 16. **Reviewing Growth**
- Opens **Past Entries**
- Scrolls through week of entries
- Sees mix of entries with and without ratings
- Notices themes in responses
- Feels more self-aware and focused

---

## Key Features Demonstrated

### ✅ **Recurring Week Scheduler**
- Set up weekly availability template across all 7 days
- Drag-to-create windows on any day column
- Multi-day creation via Add modal with checkbox selection
- Per-column clear buttons for individual days
- Page-level undo/redo (10-action limit)
- Perfect grid alignment with sticky headers
- Time conversion between frontend (minutes) and backend (ISO strings)

### ✅ **Day Mode System**
- **Recurring Mode** (default): Shows windows from weekly schedule
- **Custom Mode**: Shows day-specific one-off windows
- Automatic conversion on first edit
- Clear vs Reset distinction:
  - Clear: Removes windows, stays in custom mode (empty)
  - Reset: Returns to recurring mode, shows weekly schedule
- Visual indicators: Dashed borders (recurring) vs solid borders (custom)

### ✅ **Smart Window Management**
- Automatic merging of overlapping windows
- Undo/Redo with full state management
- Typeable time inputs with validation
- Inline delete icons on hover
- Scrollable timeline (700px max-height)
- 5-minute minimum window duration

### ✅ **Flexible Prompts**
- Customize up to 5 prompts
- Drag-and-drop reordering
- Inline text editing (Google Docs style)
- Active/inactive toggle
- Default prompts for new users (4 prompts)
- Visual distinction for inactive prompts

### ✅ **Optional Rating**
- Toggle rating on/off in preferences
- Preference persists across sessions
- Sessions adapt automatically
- Clear scale explanation (-2 to +2)
- Entries support optional ratings (default to 0)

### ✅ **Immutable Records**
- Past entries preserve original prompts
- Responses cannot be edited
- Prompt changes only affect future sessions
- Historical accuracy maintained

### ✅ **Smart UI**
- Call completed overlay prevents duplicate entries
- Active prompts only in reflection sessions
- Visual distinction for inactive prompts
- Responsive and intuitive design
- Consistent teal accent (#20808d) across all pages

### ✅ **Seamless Experience**
- Fresh prompts loaded every session
- No caching issues
- Immediate reflection of changes
- Smooth navigation and transitions
- Optimized queries (entries with responses in single call)

---

## User Benefits

1. **Clarity**: Structured reflection helps organize thoughts
2. **Consistency**: Daily habit building with flexible customization
3. **Growth**: Review past entries to see personal development
4. **Focus**: Maintain awareness of what truly matters
5. **Flexibility**: Adapt prompts and preferences to personal needs

---

## Technical Highlights

- **Authentication**: Phone-based with SMS verification
- **Real-time Updates**: Prompt changes immediately affect new sessions
- **Optimized Queries**: Single API call loads entries with responses
- **User Isolation**: Proper authentication and data separation
- **Immutable History**: Past entries preserve original context

For detailed technical architecture and design decisions, see [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md).

---

## Demo Resources

**Check-in Demo Video**: [Watch Demo](https://drive.google.com/drive/folders/1wCEFdIfzZFHb8dUq44cAn1EL8Gytx3iP?usp=sharing)

**Final Demo Video**: [Watch Demo](https://drive.google.com/file/d/1Ug-P3ffEOWVyustdMUfCCTaJjm2Urpv2/view?usp=drive_link)

**Visual Study**: [View Presentation](https://docs.google.com/presentation/d/1cQrGP7oN5plS4rN582qL5Sk_6K4fy6X4fv93hbpv4oQ/edit?usp=sharing)
