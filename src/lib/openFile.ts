import { supabase } from '@/integrations/supabase/client';

/**
 * Opens a file from storage in a new tab.
 * The window is opened synchronously (in click context) to avoid popup blockers,
 * then the signed URL is loaded into it.
 */
export const openStorageFile = async (filePath: string): Promise<void> => {
  // Open window SYNCHRONOUSLY in click handler context — no browser will block this
  const newWindow = window.open('', '_blank');

  const { data, error } = await supabase.storage
    .from('mentoring-files')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    console.error('Failed to get signed URL:', error);
    if (newWindow) newWindow.close();
    return;
  }

  if (newWindow) {
    newWindow.location.href = data.signedUrl;
  }
};
