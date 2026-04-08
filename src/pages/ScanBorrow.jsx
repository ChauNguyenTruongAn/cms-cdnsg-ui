import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, Mail, QrCode } from "lucide-react";
import { borrowReturnService } from "../services/borrowReturnService";
import { useToast } from "../context/ToastContext";

export default function ScanBorrow() {
  const [searchParams] = useSearchParams();
  const borrowCode = searchParams.get("code"); // Lấy mã từ URL: ?code=M-XXXX
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return showToast("Vui lòng nhập Email", "error");

    setIsLoading(true);
    try {
      await borrowReturnService.confirmBorrow({ borrowCode, email });
      setIsSuccess(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi xác nhận", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!borrowCode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-500">Mã quét không hợp lệ.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#1a237e] p-6 text-center text-white">
          <QrCode size={40} className="mx-auto mb-3 opacity-80" />
          <h2 className="text-xl font-bold">Xác nhận mượn vật tư</h2>
          <p className="text-indigo-200 text-sm mt-1">Mã phiếu: {borrowCode}</p>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 size={60} className="mx-auto text-green-500" />
              <h3 className="text-xl font-bold text-slate-800">Thành công!</h3>
              <p className="text-slate-500 text-sm">
                Đã xác nhận mượn đồ. Vui lòng kiểm tra email <b>{email}</b> để
                nhận Mã Trả Đồ nhé!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-slate-600 text-sm">
                  Vui lòng nhập Email liên hệ của bạn để hoàn tất thủ tục và
                  nhận thông tin phiếu trả.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email cá nhân *
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-slate-400"
                    size={20}
                  />
                  <input
                    type="email"
                    required
                    placeholder="vidu@gmail.com"
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1a237e] hover:bg-[#0d145e] text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex justify-center items-center disabled:opacity-70 transition-all"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  "XÁC NHẬN MƯỢN"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
