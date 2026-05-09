import React, { useState, useEffect, useRef } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

export default function UserDropdown({
  userData,
  setUserData,
  isLoading,
  setIsLoading,
}) {
  // Không cần nhận prop currentUser nữa
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 2. Logic xử lý click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // Xác định hiển thị (hiện "Đang tải..." nếu gọi API chưa xong)
  const userName = isLoading
    ? "Đang tải..."
    : userData?.fullName || "Người dùng";
  const userRole = isLoading ? "..." : userData?.role?.name || "Nhân viên";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-lg transition-colors"
      >
        <div className="bg-[#1c72bd] text-white p-1.5 rounded-full">
          <User size={18} />
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-700 leading-none">
            {userName}
          </span>
          <span className="text-xs text-slate-500 mt-1">{userRole}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/profile");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Thông tin cá nhân
            </button>
            <hr className="my-1 border-slate-200" />
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
