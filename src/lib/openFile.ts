import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Ensures the Supabase session token is fresh before making storage requests.
 */
const ensureFreshToken = async (): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const expiresAt = session.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);

  if (expiresAt - nowSec < 60) {
    await supabase.auth.refreshSession();
  }
};

/**
 * Opens a file from storage in a new tab.
 * The window is opened synchronously (in click context) to avoid popup blockers,
 * then the signed URL is loaded into it.
 */
export const openStorageFile = async (filePath: string): Promise<void> => {
  // Open window SYNCHRONOUSLY in click handler context — no browser will block this
  const newWindow = window.open('', '_blank');

  try {
    // Refresh token if near expiry
    await ensureFreshToken();

    const { data, error } = await supabase.storage
      .from('mentoring-files')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Signed URL not received');
    }

    if (newWindow) {
      newWindow.location.href = data.signedUrl;
    }
  } catch (err) {
    console.error('Failed to open file:', err);
    if (newWindow) newWindow.close();
    toast({
      title: 'Ошибка открытия файла',
      description: 'Не удалось получить ссылку на файл. Попробуйте ещё раз.',
      variant: 'destructive',
    });
  }
};
