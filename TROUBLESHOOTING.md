# Troubleshooting Login Issues

## Common Issues & Solutions

### 1. "Can't send verification code"

**Check:**
- Is the backend running? (`deno task concepts` in concept_backend folder)
- Is it listening on http://localhost:8000?
- Check backend terminal for errors

**Test the backend directly:**
```bash
curl -X POST http://localhost:8000/api/UserAuthentication/requestVerificationCode \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+12025551234"}'
```

Should return: `{}`

Then check backend console for:
```
[SMS] Verification code for +12025551234: 123456
```

---

### 2. "Invalid verification code"

**Common causes:**
- Code expired (10 minute timeout)
- Typo in the code
- Wrong phone number

**Solution:**
1. Request a new code
2. Copy the EXACT code from backend console
3. Paste it immediately (don't wait)

---

### 3. "Phone number already registered"

**This means you're trying to register with a phone that's already in the database.**

**Solution A - Use a different number:**
```
+12025551235
+13105559999
+14155551234
```

**Solution B - Clear the database:**
```bash
# In concept_backend folder
# Connect to MongoDB and drop the database
mongosh
use test_db  # or whatever your DB name is
db.dropDatabase()
exit
```

Then restart the backend.

---

### 4. "No verification code found"

**This means the code wasn't created or was already used.**

**Solution:**
1. Click "Change Number" to go back
2. Re-enter phone number
3. Click "Send Code" again
4. Use the NEW code from console

---

### 5. Browser console shows CORS errors

**Add CORS headers to the backend.**

Edit `/concept_backend/src/concept_server.ts`:

```typescript
// After line 25 where app is created:
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
});
```

Then restart the backend.

---

### 6. "Cannot read properties of undefined"

**Check browser console for the full error.**

Common causes:
- API response format doesn't match expected format
- Backend returned an error but frontend didn't handle it

**Debug steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Click on the failed request
5. Check the Response tab

---

## Step-by-Step Debug Process

### Test 1: Backend is running
```bash
curl http://localhost:8000
```
Should return: `Concept Server is running.`

### Test 2: Can request code
```bash
curl -X POST http://localhost:8000/api/UserAuthentication/requestVerificationCode \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+12025551234"}'
```

Check backend console for the code.

### Test 3: Can create user
```bash
curl -X POST http://localhost:8000/api/User/createUser \
  -H "Content-Type: application/json" \
  -d '{}'
```

Should return: `{"user": "some-uuid"}`

### Test 4: Can login
```bash
# Use the code from Test 2
curl -X POST http://localhost:8000/api/UserAuthentication/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+12025551234", "code": "123456"}'
```

Should return: `{"token": "some-uuid"}`

---

## Quick Fix Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running (npm run dev)
- [ ] Browser at http://localhost:5173
- [ ] Phone number in E.164 format (+1...)
- [ ] Code copied from backend console
- [ ] Code used within 10 minutes
- [ ] No CORS errors in browser console
- [ ] Network tab shows successful API calls

---

## Still Not Working?

### Check browser console:
1. Open DevTools (F12)
2. Console tab - look for errors
3. Network tab - check API calls
4. Look for red/failed requests

### Check backend console:
1. Look for error messages
2. Verify SMS code is printed
3. Check for database connection errors

### Common error messages:

**"Phone number already registered"**
→ Use different number or clear database

**"Invalid verification code"**
→ Check you copied the right code

**"No verification code found"**
→ Request a new code

**"Session has expired"**
→ Login again

---

## Emergency Reset

If nothing works, do a full reset:

```bash
# 1. Stop both servers (Ctrl+C)

# 2. Clear database
mongosh
use test_db
db.dropDatabase()
exit

# 3. Clear browser storage
# In browser: DevTools → Application → Storage → Clear site data

# 4. Restart backend
cd concept_backend
deno task concepts

# 5. Restart frontend
cd 6.1040-P1-Frontend
npm run dev

# 6. Try again with fresh phone number
```
