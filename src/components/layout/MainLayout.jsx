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
  User,
} from "lucide-react";
import UserDropdown from "./UserDropdown";

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
    { path: "/transactions", label: "Nhập / Xuất", icon: ArrowRightLeft },
    { path: "/report", label: "Báo cáo thống kê", icon: FileSpreadsheet },
    { path: "/docs", label: "Văn bản & Hình ảnh", icon: FileText },
    { path: "/fire-extinguishers", label: "Phòng cháy chữa cháy", icon: Flame },
    { path: "/projectors", label: "Quản lý Máy chiếu", icon: Video },
    { path: "/uniforms", label: "Quản lý Đồng phục", icon: Shirt },
    { path: "/borrow", label: "Mượn / Trả QR", icon: QrCode },
    { path: "/users", label: "Người dùng", icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            {/* Khung chứa Logo */}
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm flex-shrink-0 transition-transform hover:scale-105">
              <img
                src="/Logo-Truong-Cao-dang-Bach-khoa-Nam-Sai-Gon.webp"
                alt="Logo Kho BKNSG"
                className="h-9 w-9 object-contain drop-shadow-sm"
              />
            </div>

            {/* Khung chứa Text */}
            <div className="flex flex-col justify-center">
              <h1 className="text-[15px] font-extrabold text-[#1a237e] leading-none tracking-tight">
                PHÒNG QUẢN TRỊ THIẾT BỊ VÀ CƠ SỞ VẬT CHẤT
              </h1>
              {/* <p className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-widest font-bold">
              </p> */}
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
            PHẦN MỀM QUẢN LÝ KHO
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
            <UserDropdown />
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
