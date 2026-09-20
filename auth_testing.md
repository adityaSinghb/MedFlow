# MedFlow Auth Testing Playbook (Emergent Managed Google Auth)

## Test User & Session (Mongo)
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Backend Tests
```bash
BASE=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
# Cookie preferred, Authorization Bearer fallback
curl -s -X GET "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN"
curl -s -X GET "$BASE/api/state" -H "Authorization: Bearer $TOKEN"
curl -s -X POST "$BASE/api/auth/logout" -H "Authorization: Bearer $TOKEN"
```

## Playwright browser tests
- Set `session_token` cookie on the app domain (path=/, secure, samesite=None, httpOnly=True).
- Go to `/dashboard` — should render MedFlow (no redirect).
- Delete cookie → refresh → should redirect to `/login`.
- Sign-in button on `/login` MUST redirect to `https://auth.emergentagent.com/?redirect=<origin>/dashboard` — do not hardcode the redirect.

## Checklist
- [ ] `user_id` (custom UUID) present on every user; `{"_id": 0}` used in all reads
- [ ] Session lookup uses `session_token`, expiry timezone-aware
- [ ] `/api/auth/me` returns user data for valid session, 401 otherwise
- [ ] Cookie-first, Authorization Bearer fallback
- [ ] AuthCallback reads `useLocation().hash` (not window.location.hash) and uses `useRef` guard
- [ ] Global auth check skipped when URL fragment contains `session_id=`
- [ ] Logout deletes session and clears cookie
