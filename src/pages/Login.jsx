import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  HelpCircle,
  Globe,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";
import { authService } from "../services/authService";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let token = localStorage.getItem("access_token");
    if (token) {
      navigate("/");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await authService.login({
        request: identity,
        password: password,
      });
      if (res.data?.access_token) {
        localStorage.setItem("access_token", res.data.access_token);
        navigate("/");
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError(
        "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!",
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Main Content */}
      <main className="grow flex h-full">
        <div className="flex w-full min-h-[calc(100vh-64px)]">
          {/* Left Side: Branding */}
          <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-blue-900 relative overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDd4P_j_h_T86ZvUGgrMX3bAq7GwmTq_yCw-OpUTK4HiOClyvKwmo-0NiOb6UpbACLhgRM1227gOOI_caYAAL2s3rz3S05LcJYMPMSpvfYY0NfOatiYxndBXaGO5li2xIXYZLgQfCNpds9sN-FEX6lnrkaH9Dgc52IUC2qd_zLGkM91Q9qnMCVeZV71tpFx4upek7V9jfFwcYWuUFCaVUqYhjAnIjO2RxMxQkap1csiRuhjnxlRD9YXSR54XSx1ex0nE42rC-QodA"
              alt="Warehouse Hub"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 flex flex-col justify-end p-12 text-white h-full bg-linear-to-t from-gray-900/90 via-gray-900/40 to-transparent">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl lg:text-5xl font-bold mb-6 max-w-xl leading-tight"
              >
                Phần mềm quản lý kho
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg lg:text-xl text-white/90 max-w-lg leading-relaxed"
              >
                Trường Cao đẳng Bách Khoa Nam Sài Gòn.
              </motion.p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md bg-white border border-gray-200 p-8 shadow-sm rounded-xl"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  CHÀO MỪNG QUAY TRỞ LẠI
                </h1>
                <p className="text-gray-500"></p>
              </div>

              {/* Hiển thị thông báo lỗi nếu có */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                {/* Username */}
                <div className="space-y-2">
                  <label
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    htmlFor="identity"
                  >
                    TÊN ĐĂNG NHẬP HOẶC EMAIL
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="identity"
                      type="text"
                      required
                      value={identity} // 3. Gắn state vào value
                      onChange={(e) => setIdentity(e.target.value)} // Cập nhật state khi gõ
                      placeholder="Nhập thông tin đăng nhập"
                      className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    htmlFor="password"
                  >
                    MẬT KHẨU
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password} // 3. Gắn state vào value
                      onChange={(e) => setPassword(e.target.value)} // Cập nhật state khi gõ
                      placeholder="••••••••"
                      className="w-full h-12 pl-10 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      Ghi nhớ đăng nhập
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full h-12 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Đăng nhập</span>
                  <LogIn className="w-5 h-5" />
                </button>

                {/* Separator */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-gray-500">
                      Hoặc tiếp tục với
                    </span>
                  </div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  className="w-full h-12 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Đăng nhập bằng Google</span>
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-500">
                Cần quyền truy cập?{" "}
                <a href="#" className="text-blue-600 font-bold hover:underline">
                  Liên hệ quản trị viên
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
