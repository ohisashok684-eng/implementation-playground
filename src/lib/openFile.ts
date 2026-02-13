import { supabase } from '@/integrations/supabase/client';

export const openSignedFile = async (filePath: string): Promise<boolean> => {
  const { data, error } = await supabase.storage
    .from('mentoring-files')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    console.error('Failed to get signed URL:', error);
    return false;
  }

  // Use window.location for reliable navigation on all devices
  // Each call creates a fresh <a>, clicks it, and removes it
  const link = document.createElement('a');
  link.href = data.signedUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  // Setting as download=false hint so browser opens inline
  link.setAttribute('data-open', 'true');
  document.body.appendChild(link);
  link.click();
  // Small delay before cleanup so browser registers the navigation
  setTimeout(() => document.body.removeChild(link), 100);
  return true;
};
