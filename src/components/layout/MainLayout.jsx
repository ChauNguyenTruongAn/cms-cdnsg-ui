import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  QrCode,
  FileText,
  Bell,
  ArrowRightLeft,
  FileSpreadsheet,
  Video,
  Shirt,
  Flame,
  User,
  Menu,
  X,
} from "lucide-react";
import UserDropdown from "./UserDropdown";
import { userService } from "../../services/userService";
import { parseJwt } from "../../services/authService";

export default function MainLayout() {
  const [currentDate, setCurrentDate] = useState("");
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigate();
  const [navItems, setNavItems] = useState([
    { path: "/", label: "Tổng quan", icon: LayoutDashboard },
    { path: "/inventory", label: "Vật tư kho", icon: Package },
    { path: "/transactions", label: "Nhập / Xuất", icon: ArrowRightLeft },
    { path: "/report", label: "Báo cáo thống kê", icon: FileSpreadsheet },
    { path: "/docs", label: "Văn bản & Hình ảnh", icon: FileText },
    {
      path: "/fire-extinguishers",
      label: "Phòng cháy chữa cháy",
      icon: Flame,
    },
    { path: "/projectors", label: "Quản lý Máy chiếu", icon: Video },
    { path: "/uniforms", label: "Quản lý Đồng phục", icon: Shirt },
    { path: "/borrow", label: "Mượn / Trả vật tư", icon: QrCode },
    { path: "/users", label: "Người dùng", icon: User },
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const decodedPayload = parseJwt(token);
        if (decodedPayload && decodedPayload.sub) {
          const email = decodedPayload.sub;
          const response = await userService.getUserByEmail(email);
          const user = response.data || response;
          setUserData(user);

          if (user.role.name === "MANAGER") {
            setNavItems([
              { path: "/docs", label: "Văn bản & Hình ảnh", icon: FileText },
              { path: "/borrow-user", label: "Mượn / Trả vật tư", icon: QrCode },
            ]);
            navigation("/docs");
          }

          if (user.role.name === "USER") {
            navigation("/user/borrow");
          }
        }
      } catch (error) {
        console.error("Lỗi tải thông tin Header:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(new Date().toLocaleDateString("vi-VN", options));
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm flex-shrink-0 transition-transform hover:scale-105">
            <img
              src="/Logo-Truong-Cao-dang-Bach-khoa-Nam-Sai-Gon.webp"
              alt="Logo Kho BKNSG"
              className="h-9 w-9 object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[14px] font-extrabold text-[#1a237e] leading-tight tracking-tight">
              PHÒNG QUẢN TRỊ THIẾT BỊ VÀ CƠ SỞ VẬT CHẤT
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `w-full flex items-center p-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#1a237e] text-white shadow-md shadow-indigo-100/50"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <Icon size={20} />
              <span className="ml-3 font-medium text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Desktop (always visible) + Mobile (drawer) */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-slate-200 flex flex-col shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 lg:hidden"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-[#1c72bd] truncate">
              PHẦN MỀM QUẢN LÝ KHO
            </h2>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <Bell
                size={20}
                className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <p className="text-sm text-slate-500 font-medium hidden md:block">
              {currentDate}
            </p>
            <UserDropdown
              userData={userData}
              setUserData={setUserData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        </header>

        {/* Dynamic Content Area */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
