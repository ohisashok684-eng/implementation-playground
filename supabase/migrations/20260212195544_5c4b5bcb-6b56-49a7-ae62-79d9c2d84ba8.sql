-- Fix protocols that store full public URLs instead of relative paths
UPDATE protocols
SET file_url = regexp_replace(
  file_url,
  '^https://[^/]+/storage/v1/object/public/mentoring-files/',
  ''
)
WHERE file_url LIKE 'https://%/storage/v1/object/public/mentoring-files/%';