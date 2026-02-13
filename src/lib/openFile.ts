import { supabase } from '@/integrations/supabase/client';

export const openSignedFile = async (filePath: string): Promise<boolean> => {
  // Step 1: Synchronously open a new tab from the user gesture context.
  // This is critical for mobile Safari which blocks async window.open / link.click().
  const newTab = window.open('', '_blank');

  // Step 2: Fetch signed URL
  const { data, error } = await supabase.storage
    .from('mentoring-files')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    console.error('Failed to get signed URL:', error);
    // Close the blank tab if URL fetch failed
    if (newTab) newTab.close();
    return false;
  }

  // Step 3: Navigate the already-opened tab to the signed URL
  if (newTab) {
    newTab.location.href = data.signedUrl;
  } else {
    // Fallback for popup blockers: use programmatic <a> click
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return true;
};
