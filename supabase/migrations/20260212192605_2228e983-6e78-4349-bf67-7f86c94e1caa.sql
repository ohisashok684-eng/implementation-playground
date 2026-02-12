-- Add unique constraints for upsert operations
ALTER TABLE public.volcanoes ADD CONSTRAINT volcanoes_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE public.progress_metrics ADD CONSTRAINT progress_metrics_user_id_metric_key_key UNIQUE (user_id, metric_key);
