

## Fix: Files Only Open Once, Then about:blank

### Root Cause

Two issues combine to break subsequent file opens:

1. **Unstable session reference in useAuth**: `setSession(sess)` is called on EVERY `onAuthStateChange` event (including TOKEN_REFRESHED). This creates a new context object, causing ALL consumers to re-render -- even though only `session` changed and most components don't use it. These cascading re-renders during async file-open operations can disrupt in-flight requests.

2. **No error protection in openStorageFile**: The async chain (`tryCreateSignedUrl`, `refreshSession`) has no top-level try/catch. If any call throws (network error, CORS, race condition from re-render), the promise rejects unhandled and the window stays at `about:blank` -- our `writeErrorToWindow` never runs.

3. **Window shows blank during async work**: Between `window.open('', '_blank')` and receiving the signed URL, the user sees a white `about:blank` page. If anything goes wrong, this is what remains.

### Fix Plan

#### 1. `src/hooks/useAuth.tsx` -- Stabilize session reference

Add the same pattern used for `user`: only call `setSession(sess)` if the access token actually changed. This prevents unnecessary context updates and re-renders on token refresh.

```text
Before: setSession(sess)  -- always, on every auth event
After:  if (sess.access_token !== sessionRef.current?.access_token) setSession(sess)
```

This stops cascading re-renders that interrupt file-opening operations.

#### 2. `src/lib/openFile.ts` -- Two critical fixes

**a) Write a loading page immediately** into the new window so the user never sees bare `about:blank`:

```text
window.open('', '_blank')
  -> immediately write "Loading file..." HTML into the window
  -> then do async work (createSignedUrl)
  -> on success: redirect window to signed URL
  -> on failure: replace loading page with error page
```

**b) Wrap everything in try/catch** so that ANY thrown exception (not just returned errors) is handled -- the error page is written to the window and a toast is shown.

### Files to Change

- **`src/hooks/useAuth.tsx`** -- add `sessionRef` to stabilize session updates (prevent re-renders on token refresh)
- **`src/lib/openFile.ts`** -- add loading page, wrap in try/catch for full error protection

### Expected Result

- First, second, and all subsequent files open correctly
- No more about:blank -- user sees either "Loading..." or a clear error message
- Token refresh no longer triggers cascading re-renders that disrupt file operations
- All existing file-opening behavior (signed URLs, popup blocker bypass) is preserved

