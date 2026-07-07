-- Tạo bảng lưu trữ tiến trình học tập của người dùng (XP, Streak, Badges, Quests)
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_active date,
  badges text[] NOT NULL DEFAULT '{}',
  quests jsonb NOT NULL DEFAULT '[{"id": "learn5", "done": false}, {"id": "quiz3", "done": false}, {"id": "match", "done": false}]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Bật tính năng Bảo mật Cấp độ Hàng (Row Level Security - RLS)
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Người dùng chỉ có thể xem tiến trình của CHÍNH MÌNH
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Người dùng chỉ có thể tạo tiến trình cho CHÍNH MÌNH
CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Người dùng chỉ có thể cập nhật tiến trình của CHÍNH MÌNH
CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Tùy chọn: Function tự động tạo bản ghi user_progress khi có user mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_progress (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger kích hoạt function trên mỗi khi có user mới vào bảng auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
