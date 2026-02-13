import { supabase } from '@/integrations/supabase/client';

export const getSignedUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('mentoring-files')
    .createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) {
    console.error('Failed to get signed URL:', error);
    return null;
  }
  return data.signedUrl;
};

export const openSignedFile = async (filePath: string): Promise<boolean> => {
  const url = await getSignedUrl(filePath);
  if (!url) return false;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};
