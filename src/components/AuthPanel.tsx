import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export function AuthPanel() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpen = useCallback(() => {
    setEmail("");
    setPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsLogin(true);
    setOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setErrorMsg("Bạn chưa cấu hình Supabase URL và Anon Key trong file .env!");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setOpen(false); // Thành công thì đóng modal
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản (nếu bạn bật email confirmation), hoặc đăng nhập nếu tài khoản đã được tạo.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Nút hiển thị trên thanh công cụ khi ĐÃ ĐĂNG NHẬP
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold truncate max-w-[150px]">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="rounded-2xl bg-secondary/80 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-destructive hover:text-destructive-foreground"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  // Nút hiển thị trên thanh công cụ khi CHƯA ĐĂNG NHẬP
  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pop)] transition hover:-translate-y-0.5"
      >
        Đăng nhập
      </button>

      {/* Modal */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-md animate-pop-in overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">
                  {isLogin ? "Chào mừng trở lại! 👋" : "Tạo tài khoản mới ✨"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLogin ? "Đăng nhập để lưu tiến độ học tập của bạn." : "Đăng ký để nhận badges, tính XP và lưu quá trình."}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-sm transition hover:bg-secondary/80 self-start"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full rounded-xl border border-border bg-card/70 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold" htmlFor="password">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-card/70 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  ❌ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl bg-success/15 p-3 text-sm text-success-foreground">
                  ✅ {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-[var(--shadow-pop)] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-primary hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
