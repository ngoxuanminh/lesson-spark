import { createClient } from "@supabase/supabase-js";

// Lấy giá trị từ biến môi trường (Vite injects VITE_* env vars under import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
