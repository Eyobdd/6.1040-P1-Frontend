# Zien Demo Instructions

## Quick Start

### 1. Start the Backend (Terminal 1)

```bash
cd concept_backend
deno task concepts
```

The server will start on `http://localhost:8000`

### 2. Start the Frontend (Terminal 2)

```bash
cd 6.1040-P1-Frontend
npm install  # if you haven't already
npm run dev
```

The frontend will start on `http://localhost:5173` (or similar)

## Demo Flow

### 1. Registration
1. Open `http://localhost:5173` in your browser
2. You'll be redirected to `/login`
3. Enter a phone number in E.164 format (e.g., `+12025551234`)
4. Click "Send Code"
5. **Check the backend terminal** for the 6-digit verification code
6. Enter the code and click "Create Account"

### 2. Dashboard
- After login, you'll see the "Today" dashboard
- If no reflection exists for today, you'll see "Start Reflection" button

### 3. Reflection Flow
1. Click "Start Reflection"
2. Answer each of the 5 prompts (default prompts):
   - What are you grateful for today?
   - What did you do today?
   - What are you proud of today?
   - What do you want to do tomorrow?
   - Any other thoughts or reflections?
3. Rate your day (-2 to +2)
4. Click "Complete"

### 4. View Entry
- You'll be redirected back to the dashboard
- Your completed reflection will now be displayed with all responses

## User Journey (for video)

**Jordan's First Reflection:**

Jordan opens Zien and registers with their phone number (+12025551234). After entering the verification code from the console, they're taken to the dashboard. Since it's their first time, they click "Start Reflection" and begin answering the prompts. They share what they're grateful for (their supportive friends), what they accomplished today (finished a project milestone), what they're proud of (staying focused despite distractions), their plans for tomorrow (start the next phase), and rate their day as a +1. Upon completing the reflection, Jordan sees their journal entry beautifully displayed on the dashboard, giving them a moment of clarity and satisfaction.

## Troubleshooting

### Backend Issues
- Make sure MongoDB is running
- Check that port 8000 is available
- Look for errors in the backend terminal

### Frontend Issues
- Make sure the backend is running first
- Check browser console for errors
- Verify API calls are going to `http://localhost:8000/api`

### Verification Code
- The code is printed in the **backend terminal** (not frontend)
- Look for lines like: `[SMS] Verification code for +12025551234: 123456`
- Codes expire after 10 minutes

## Features Demonstrated

✅ Phone-based authentication with SMS verification (mocked)
✅ User registration with automatic profile and prompt setup
✅ Reflection session with 5 customizable prompts
✅ Day rating system (-2 to +2)
✅ Immutable journal entries
✅ Clean, modern UI matching Zien's design
✅ Progress tracking during reflection
✅ Dashboard view of completed reflections

## Notes for Video

- Keep it under 2 minutes
- Show the full flow: register → reflect → view entry
- Mention that SMS is mocked (console logs) for demo
- Highlight the clean, focused UI
- Emphasize the immutability of journal entries
- Show the rating emojis and how they reflect mood
