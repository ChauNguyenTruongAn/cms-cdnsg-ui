import React, { createContext, useContext, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

// Tạo Context
const ToastContext = createContext();

// Tạo Provider để bọc ứng dụng
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* UI của Toast nằm sẵn ở đây, luôn chực chờ hiển thị */}
      <div
        className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 transition-all duration-300 z-50 ${
          toast.show
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0 pointer-events-none"
        } ${toast.type === "error" ? "bg-red-900 text-white" : "bg-slate-900 text-white"}`}
      >
        {toast.type === "error" ? (
          <AlertCircle className="text-red-400" size={20} />
        ) : (
          <CheckCircle className="text-green-400" size={20} />
        )}
        <span className="font-medium text-sm">{toast.msg}</span>
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook để sử dụng nhanh
export const useToast = () => useContext(ToastContext);
