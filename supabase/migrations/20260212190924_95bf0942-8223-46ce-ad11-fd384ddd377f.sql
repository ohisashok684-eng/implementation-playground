
-- Table for custom Point B questions per user
CREATE TABLE public.point_b_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.point_b_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pb_select" ON public.point_b_questions FOR SELECT
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

CREATE POLICY "pb_insert" ON public.point_b_questions FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

CREATE POLICY "pb_update" ON public.point_b_questions FOR UPDATE
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

CREATE POLICY "pb_delete" ON public.point_b_questions FOR DELETE
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

-- Table for user answers to Point B questions
CREATE TABLE public.point_b_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.point_b_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL DEFAULT '',
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.point_b_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pba_select" ON public.point_b_answers FOR SELECT
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

CREATE POLICY "pba_insert" ON public.point_b_answers FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

CREATE POLICY "pba_update" ON public.point_b_answers FOR UPDATE
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));

CREATE POLICY "pba_delete" ON public.point_b_answers FOR DELETE
  USING ((auth.uid() = user_id) OR is_super_admin(auth.uid()));
