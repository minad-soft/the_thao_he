-- Thêm cột capacity vào bảng shifts
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 30;

-- Tạo bảng student_preferred_shifts
CREATE TABLE IF NOT EXISTS public.student_preferred_shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.student_preferred_shifts ENABLE ROW LEVEL SECURITY;

-- Policy cho bảng student_preferred_shifts
CREATE POLICY "Cho phép admin truy cập tất cả preferred_shifts"
  ON public.student_preferred_shifts
  FOR ALL
  TO authenticated
  USING (true);
