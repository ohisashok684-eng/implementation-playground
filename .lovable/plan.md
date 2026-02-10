

## Problem

The page is stuck on a loading spinner because `useAuth.tsx` makes database queries (`profiles`, `user_roles`) inside `onAuthStateChange` **without try/catch**. If any query fails, `setLoading(false)` is never called, and `ProtectedRoute` shows the spinner indefinitely.

## Fix

**File: `src/hooks/useAuth.tsx`**

1. Wrap the `onAuthStateChange` callback body in `try/catch/finally`, ensuring `setLoading(false)` always runs
2. Wrap the `getSession().then()` logic in `try/catch/finally` as well
3. Add `try/catch` inside `fetchRole` so a failing query doesn't throw

This is a small, targeted fix -- about 10-15 lines of changes to add proper error handling.

## Technical Details

```text
Before (simplified):
  onAuthStateChange -> query profiles -> query user_roles -> setLoading(false)
                       ^^ if this fails, setLoading never called

After:
  onAuthStateChange -> try { query profiles -> query user_roles } 
                       catch { log error }
                       finally { setLoading(false) }  <-- always runs
```

