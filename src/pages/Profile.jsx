import React, { useState, useEffect } from "react";
import { User, Mail, Building, Key, Save, ShieldCheck } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { userService } from "../services/userService";

// Hàm hỗ trợ giải mã JWT Token an toàn
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Lỗi giải mã token:", error);
    return null;
  }
};

export default function UserProfile() {
  const [originalUser, setOriginalUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    schoolID: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1. Lấy token từ localStorage
        const token = localStorage.getItem("access_token");

        if (!token) {
          toast.error(
            "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!",
          );
          setIsLoading(false);
          return;
        }

        // 2. Giải mã token để lấy payload (chứa sub là email)
        const decodedPayload = parseJwt(token);

        if (!decodedPayload || !decodedPayload.sub) {
          toast.error("Token không hợp lệ!");
          setIsLoading(false);
          return;
        }

        const email = decodedPayload.sub; // Trích xuất 'admin@warehouse-cdnsg.local'

        // 3. Gọi API lấy thông tin người dùng dựa trên email
        const response = await userService.getUserByEmail(email);
        const user = response.data || response;

        setOriginalUser(user);
        setProfileData({
          fullName: user.fullName || "",
          email: user.email || "",
          schoolID: user.schoolID || "",
        });
      } catch (error) {
        console.error("Lỗi tải thông tin:", error);
        toast.error("Không thể kết nối đến máy chủ để tải thông tin!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!originalUser) return;

    // Hiển thị trạng thái đang xử lý
    const loadingToast = toast.loading("Đang lưu thông tin...");

    try {
      const payload = {
        email: profileData.email,
        fullName: profileData.fullName,
        schoolID: profileData.schoolID,
        roleID: originalUser.role?.id,
        permissionIDs: originalUser.permissions?.map((p) => p.id) || [],
      };

      await userService.updateUser(payload);

      // Thành công thì tắt loading và hiện checkmark xanh
      toast.success("Cập nhật thông tin thành công!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại sau!", {
        id: loadingToast,
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!originalUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    const loadingToast = toast.loading("Đang cập nhật mật khẩu...");

    try {
      const payload = {
        email: originalUser.email,
        fullName: originalUser.fullName,
        schoolID: originalUser.schoolID,
        roleID: originalUser.role?.id,
        permissionIDs: originalUser.permissions?.map((p) => p.id) || [],
        password: passwordData.newPassword,
      };

      await userService.updateUser(payload);

      toast.success("Đổi mật khẩu thành công!", { id: loadingToast });
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi đổi mật khẩu!", { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1c72bd]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10 relative">
      {/* Container chứa các Toast thông báo */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Xin chào, {profileData.fullName}
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý thông tin hồ sơ và bảo mật tài khoản
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          <ShieldCheck size={20} className="text-[#1c72bd]" />
          <span className="text-[#1c72bd] font-medium text-sm">
            Vai trò: {originalUser?.role?.name || "Người dùng"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User size={20} className="text-[#1c72bd]" />
            Thông tin cơ bản
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail size={16} className="text-slate-400" /> Địa chỉ Email
              </label>
              <input
                type="email"
                value={profileData.email}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 outline-none text-sm cursor-not-allowed"
                readOnly
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Họ và tên
              </label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullName: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1c72bd]/20 focus:border-[#1c72bd] outline-none transition-all text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Building size={16} className="text-slate-400" /> Mã Trường / Mã
                NV
              </label>
              <input
                type="text"
                disabled={true}
                value={profileData.schoolID}
                onChange={(e) =>
                  setProfileData({ ...profileData, schoolID: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 outline-none text-sm cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1c72bd] hover:bg-[#155a96] text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              <Save size={18} />
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Key size={20} className="text-slate-700" />
            Đổi mật khẩu
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Để trống nếu bạn không muốn thay đổi mật khẩu.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1c72bd]/20 focus:border-[#1c72bd] outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1c72bd]/20 focus:border-[#1c72bd] outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
