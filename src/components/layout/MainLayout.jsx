import React, { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
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
} from "lucide-react";

export default function MainLayout() {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(new Date().toLocaleDateString("vi-VN", options));
  }, []);

  const navItems = [
    { path: "/", label: "Tổng quan", icon: LayoutDashboard },
    { path: "/inventory", label: "Vật tư kho", icon: Package },
    // { path: "/borrow", label: "Mượn / Trả QR", icon: QrCode },
    { path: "/transactions", label: "Nhập / Xuất", icon: ArrowRightLeft },
    { path: "/docs", label: "Văn bản & Hình ảnh", icon: FileText },
    { path: "/report", label: "Báo cáo thống kê", icon: FileSpreadsheet },
    { path: "/projectors", label: "Quản lý Máy chiếu", icon: Video },
    { path: "/uniforms", label: "Quản lý Đồng phục", icon: Shirt },
    { path: "/fire-extinguishers", label: "Phòng cháy chữa cháy", icon: Flame },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            {" "}
            <img
              src="/logo-cms.png" // ĐƯỜNG DẪN TỚI LOGO TRONG THƯ MỤC PUBLIC
              alt="Logo Kho BKNSG" // Tên thay thế cho logo
              className="h-12 w-auto rounded-b-sm object-contain shadow-sm p-1" // Class styling
            />
            <div>
              <h1 className="text-xl font-bold text-[#1a237e]">Phần mềm</h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                Quản lý kho
              </p>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0">
          <h2 className="text-lg font-bold text-[#1c72bd]">
            Trường Cao đẳng Bách Khoa Nam Sài Gòn
          </h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell
                size={20}
                className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <p className="text-sm text-slate-500 font-medium hidden sm:block">
              {currentDate}
            </p>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet /> {/* Nơi các Component con (Pages) sẽ được render */}
        </section>
      </main>
    </div>
  );
}
