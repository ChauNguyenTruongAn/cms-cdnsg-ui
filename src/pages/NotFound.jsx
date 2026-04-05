import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="text-center space-y-6">
        {/* Icon Illustration */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <FileQuestion
            size={120}
            className="relative text-indigo-600 mx-auto"
          />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black text-slate-200">404</h1>
          <h2 className="text-2xl font-bold text-slate-800">
            Trang không tồn tại
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            Đường dẫn bạn truy cập có thể đã bị xóa hoặc không còn tồn tại trên
            hệ thống.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all w-full sm:w-auto"
          >
            <ArrowLeft size={18} className="mr-2" /> QUAY LẠI
          </button>

          <Link
            to="/"
            className="flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all w-full sm:w-auto"
          >
            <Home size={18} className="mr-2" /> VỀ TRANG CHỦ
          </Link>
        </div>
      </div>
    </div>
  );
}
