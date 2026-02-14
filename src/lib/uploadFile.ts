import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to the mentoring-files storage bucket.
 * Returns the relative path on success, or null on error.
 */
export const uploadFile = async (
  bucketPath: string,
  file: File,
): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const path = `${bucketPath}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('mentoring-files')
    .upload(path, file);
  if (error) {
    console.error('Upload failed:', error.message);
    return null;
  }
  return path;
};
