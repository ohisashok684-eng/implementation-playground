
-- Create tracking_questions table
CREATE TABLE public.tracking_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'daily',
  question_text TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.tracking_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tq_select" ON public.tracking_questions FOR SELECT
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));
CREATE POLICY "tq_insert" ON public.tracking_questions FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR is_super_admin(auth.uid()));
CREATE POLICY "tq_update" ON public.tracking_questions FOR UPDATE
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));
CREATE POLICY "tq_delete" ON public.tracking_questions FOR DELETE
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

-- Add file_url to roadmaps
ALTER TABLE public.roadmaps ADD COLUMN file_url TEXT;
