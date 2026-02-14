import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Attempts to create a signed URL for a storage file.
 * Returns the signed URL or null on failure.
 */
const tryCreateSignedUrl = async (
  filePath: string
): Promise<{ url: string | null; error: string | null }> => {
  const { data, error } = await supabase.storage
    .from('mentoring-files')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    return { url: null, error: error?.message || 'Signed URL not received' };
  }

  return { url: data.signedUrl, error: null };
};

/**
 * Writes an error message directly into the opened window
 * so the user sees feedback instead of about:blank.
 */
const writeErrorToWindow = (win: Window, message: string) => {
  try {
    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Ошибка</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
               display: flex; align-items: center; justify-content: center;
               min-height: 100vh; margin: 0; background: #111; color: #eee; }
        .card { text-align: center; padding: 2rem; max-width: 400px; }
        h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        p { color: #999; font-size: 0.875rem; line-height: 1.5; }
      </style></head>
      <body><div class="card">
        <h1>Не удалось открыть файл</h1>
        <p>${message}</p>
        <p style="margin-top:1rem;color:#666">Закройте эту вкладку и попробуйте ещё раз.</p>
      </div></body></html>
    `);
    win.document.close();
  } catch {
    // Cross-origin or closed — nothing we can do
  }
};

/**
 * Opens a file from storage in a new tab.
 * - Window opened synchronously to avoid popup blockers
 * - Retry with session refresh on first failure
 * - Error message written directly into the window on failure
 */
export const openStorageFile = async (filePath: string): Promise<void> => {
  const newWindow = window.open('', '_blank');

  // Attempt 1: try with current token
  let result = await tryCreateSignedUrl(filePath);

  // Attempt 2: if failed, refresh session and retry
  if (result.error) {
    console.warn('[openFile] First attempt failed:', result.error, '— refreshing session and retrying');

    try {
      await supabase.auth.refreshSession();
    } catch (refreshErr) {
      console.warn('[openFile] Session refresh failed:', refreshErr);
    }

    result = await tryCreateSignedUrl(filePath);
  }

  // Success — redirect the window
  if (result.url) {
    if (newWindow) {
      newWindow.location.href = result.url;
    }
    return;
  }

  // Final failure — show error IN the window + toast on original tab
  console.error('[openFile] Failed after retry:', result.error);

  if (newWindow) {
    writeErrorToWindow(newWindow, result.error || 'Неизвестная ошибка');
  }

  toast({
    title: 'Ошибка открытия файла',
    description: 'Не удалось получить ссылку на файл. Попробуйте ещё раз.',
    variant: 'destructive',
  });
};
