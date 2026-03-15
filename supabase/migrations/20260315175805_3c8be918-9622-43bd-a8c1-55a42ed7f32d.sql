DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_volcanoes_user_name') THEN
    ALTER TABLE public.volcanoes ADD CONSTRAINT uq_volcanoes_user_name UNIQUE (user_id, name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_metrics_user_key') THEN
    ALTER TABLE public.progress_metrics ADD CONSTRAINT uq_metrics_user_key UNIQUE (user_id, metric_key);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_route_user') THEN
    ALTER TABLE public.route_info ADD CONSTRAINT uq_route_user UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pb_answers_user_q') THEN
    ALTER TABLE public.point_b_answers ADD CONSTRAINT uq_pb_answers_user_q UNIQUE (user_id, question_id);
  END IF;
END $$;