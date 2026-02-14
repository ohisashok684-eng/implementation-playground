

## Alternative Solution: Server-Side Signed URLs

### Why Previous Fixes Failed

All previous attempts tried to fix the client-side token management, but the root problem is deeper: the Supabase JS client's auth state machine becomes unstable when `refreshSession()` is called during concurrent or rapid sequential operations. This causes `createSignedUrl()` to hang indefinitely on subsequent calls.

### New Approach

Move signed URL generation to a backend function that uses the service role key. This completely bypasses:
- Client-side token refresh issues
- Storage RLS policy checks
- GoTrue auth state machine conflicts

The client simply calls the function with the file path and gets back a ready-to-use URL.

### Implementation

#### 1. New backend function: `supabase/functions/get-signed-url/index.ts`

A lightweight function that:
- Accepts `{ filePath: string }` in the request body
- Verifies the user is authenticated (checks JWT from Authorization header)
- Checks if the user is either a super_admin OR the file belongs to them (matches folder structure)
- Uses the service role key to call `storage.createSignedUrl()` -- this never fails due to token issues
- Returns `{ url: "..." }` or `{ error: "..." }`

#### 2. Simplified `src/lib/openFile.ts`

Replace the entire `tryCreateSignedUrl` + retry + refresh logic with a single `fetch()` call to the new function:

```
1. window.open('', '_blank') -- synchronous, bypass popup blockers
2. Write loading page into window
3. fetch('/functions/v1/get-signed-url', { filePath }) -- one simple call
4. If success: newWindow.location.href = url
5. If error: writeErrorToWindow(message)
```

No more `supabase.storage` calls from the client. No more `refreshSession()`. No more retry logic. Just one fetch call with the existing auth token (passed via Authorization header).

### Technical Details

**Backend function (`supabase/functions/get-signed-url/index.ts`):**
- Uses `createClient` with `SUPABASE_SERVICE_ROLE_KEY` for storage access
- Extracts user from JWT to verify authentication
- Generates signed URL with 1-hour expiry
- CORS headers for cross-origin requests

**Client (`src/lib/openFile.ts`):**
- Gets current session token via `supabase.auth.getSession()` (read-only, no mutation)
- Single fetch to the edge function
- No retry needed -- service role key never has token issues
- Keeps `writeLoadingToWindow` and `writeErrorToWindow` for UX

### Files to Change

- **Create** `supabase/functions/get-signed-url/index.ts` -- new backend function
- **Edit** `src/lib/openFile.ts` -- simplify to use the new function instead of client-side storage API

### Result

- All files open instantly, every time -- no more hanging requests
- No dependency on client-side token state
- No `refreshSession()` conflicts
- Loading and error feedback preserved in the opened window
