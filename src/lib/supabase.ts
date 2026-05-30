import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase browser client - dùng cho Client Components.
 * Chỉ dùng cho các tác vụ READ đơn giản (tuân thủ DESIGN.md).
 * RLS policies sẽ tự động áp dụng qua anon key.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
