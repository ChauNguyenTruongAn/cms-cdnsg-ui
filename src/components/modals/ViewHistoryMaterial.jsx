import React, { useState, useEffect } from "react";
import {
  X,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Package,
  Calendar,
  Hash,
  ExternalLink, // Thêm icon để gợi ý bấm vào phiếu
} from "lucide-react";
import { materialService } from "../../services/materialService";
import { receiptService } from "../../services/receiptService";

// 1. Import Modal xem chi tiết phiếu của bạn vào đây
import ViewReceiptModal from "./ViewReceiptModal";
// import { receiptService } from "../../services/receiptService"; // Import service lấy chi tiết phiếu của bạn

export default function ViewHistoryMaterialModal({
  isOpen,
  onClose,
  materialId,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("IMPORT");

  // 2. States để quản lý Modal Phiếu
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    if (!isOpen || !materialId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response =
          await materialService.getHistoryMaterialById(materialId);
        const responseData = response.data?.data || response.data || response;
        setData(responseData);
      } catch (err) {
        setError("Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, materialId]);

  // 3. Hàm xử lý khi bấm vào 1 dòng phiếu
  const handleViewReceiptDetail = async (item) => {
    setLoadingReceipt(true);
    try {
      let response;

      // Tùy thuộc vào Tab đang mở để gọi API Nhập hay Xuất
      if (activeTab === "IMPORT") {
        // Giả sử backend đã trả về receiptId trong item
        response = await receiptService.getImportById(item.receiptId);
      } else {
        response = await receiptService.getExportById(item.receiptId);
      }

      // Tuỳ vào cấu trúc trả về của Backend, lấy ra object data chứa chi tiết phiếu
      const fullReceiptData = response.data?.data || response.data;

      // Đẩy data vào State và mở Modal Phiếu
      setSelectedReceiptData(fullReceiptData);
      setIsReceiptModalOpen(true);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết phiếu:", err);
      alert("Không thể tải chi tiết phiếu lúc này!"); // Nếu có dùng Toast context, bạn có thể thay bằng showToast()
    } finally {
      setLoadingReceipt(false);
    }
  };

  if (!isOpen) return null;

  const displayList =
    activeTab === "IMPORT"
      ? data?.importHistory || []
      : data?.exportHistory || [];

  return (
    // Set z-[50] cho Lịch sử
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[50] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <History className="mr-2 text-[#1a237e]" size={24} />
            Lịch sử Giao dịch:{" "}
            <span className="ml-2 text-indigo-600">{data?.name || "..."}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 size={40} className="animate-spin text-[#1a237e] mb-4" />
              <p className="font-medium animate-pulse">Đang tải lịch sử...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 font-medium">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Thông tin chung */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex flex-wrap gap-6 items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Đơn vị tính
                  </h4>
                  <p className="text-base font-semibold text-slate-700">
                    {data.unitName || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tồn kho hiện tại
                  </h4>
                  <p
                    className={`text-base font-bold ${data.inventory < 5 ? "text-red-600" : "text-green-600"}`}
                  >
                    {data.inventory}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("IMPORT")}
                  className={`flex items-center px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
                    activeTab === "IMPORT"
                      ? "border-green-500 text-green-600 bg-green-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <ArrowDownLeft size={18} className="mr-2" />
                  NHẬP KHO ({data.importHistory?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("EXPORT")}
                  className={`flex items-center px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
                    activeTab === "EXPORT"
                      ? "border-amber-500 text-amber-600 bg-amber-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpRight size={18} className="mr-2" />
                  XUẤT KHO ({data.exportHistory?.length || 0})
                </button>
              </div>

              {/* Bảng Dữ liệu */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                {/* Lớp phủ loading mờ khi đang fetch chi tiết phiếu */}
                {loadingReceipt && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2
                      className="animate-spin text-indigo-600"
                      size={32}
                    />
                  </div>
                )}

                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold">STT</th>
                      <th className="px-6 py-4 font-semibold flex items-center">
                        <Calendar size={14} className="mr-2" /> Ngày Giao Dịch
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        <div className="flex items-center">
                          <Hash size={14} className="mr-2" /> Mã Phiếu
                        </div>
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Số Lượng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayList.length > 0 ? (
                      displayList.map((item, idx) => (
                        <tr
                          key={idx}
                          onClick={() => handleViewReceiptDetail(item)}
                          className="hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                          title="Bấm để xem chi tiết toàn bộ phiếu"
                        >
                          <td className="px-6 py-4 text-slate-400 font-medium">
                            {(idx + 1).toString().padStart(2, "0")}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {item.transactionDate}
                          </td>
                          <td className="px-6 py-4 font-bold text-indigo-600 flex items-center">
                            <span className="group-hover:underline">
                              {item.receiptCode}
                            </span>
                            <ExternalLink
                              size={14}
                              className="ml-2 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity"
                            />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700">
                            <span
                              className={
                                activeTab === "IMPORT"
                                  ? "text-green-600"
                                  : "text-amber-600"
                              }
                            >
                              {activeTab === "IMPORT" ? "+" : "-"}
                              {item.quantity}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          Chưa có lịch sử{" "}
                          {activeTab === "IMPORT" ? "nhập" : "xuất"} kho cho vật
                          tư này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* 4. Render Modal Phiếu đè lên trên (Nhớ set z-index của ViewReceiptModal cao hơn z-50) */}
      <ViewReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptData(null);
        }}
        type={activeTab === "IMPORT" ? "import" : "export"}
        receiptData={selectedReceiptData}
      />
    </div>
  );
}
