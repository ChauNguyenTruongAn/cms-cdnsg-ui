import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  BarChart3,
  Clock,
  Projector as ProjectorIcon,
  Calendar,
  User,
} from "lucide-react";
import { projectorService } from "../../services/projectorService";
import { useToast } from "../../context/ToastContext";
import * as XLSX from "xlsx";

export default function ProjectorReportTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Hàm chuyển đổi giây sang định dạng dễ đọc (Giờ Phút Giây)
  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return "0 phút";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (hours === 0 && minutes === 0 && seconds > 0) result += `${seconds}s`;
    return result.trim();
  };

  // Tính chênh lệch giây giữa 2 mốc thời gian
  const calculateSeconds = (start, end) => {
    if (!start || !end) return 0;
    return Math.floor((new Date(end) - new Date(start)) / 1000);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // 1. Lấy thống kê tổng hợp (tổng giây theo ID máy)
      // 2. Lấy toàn bộ lịch sử lượt mượn (đã trả) để hiển thị chi tiết
      const [statsRes, loansRes] = await Promise.all([
        projectorService.getTotalTimeUsage(),
        projectorService.getAllLoans(0, 2000, "id", "desc", "", "RETURNED"),
      ]);

      const stats = statsRes.data || [];
      const allLoans = loansRes.data.content || [];

      // 3. Gộp dữ liệu: Với mỗi máy trong stats, tìm các lượt mượn tương ứng
      const processed = stats.map((stat) => {
        const history = allLoans.filter(
          (l) => l.projector.id === stat.projectorId,
        );
        return {
          ...stat,
          history: history,
          maxRows: Math.max(1, history.length), // Số dòng cần chiếm trong table
        };
      });

      setReportData(processed);
      showToast("Đã cập nhật dữ liệu báo cáo chi tiết!");
    } catch (error) {
      showToast("Lỗi khi tạo báo cáo!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const exportToExcel = () => {
    if (reportData.length === 0) return;

    const excelData = [];
    reportData.forEach((row, idx) => {
      if (row.history.length === 0) {
        excelData.push({
          STT: idx + 1,
          "TÊN MÁY CHIẾU": row.projectorName,
          "SỐ SERIAL": row.serialNumber,
          "NGƯỜI MƯỢN": "Chưa có dữ liệu",
          "BẮT ĐẦU": "",
          "KẾT THÚC": "",
          "THỜI LƯỢNG LƯỢT": "",
          "TỔNG THỜI GIAN DÙNG": formatDuration(row.totalUsageSeconds),
        });
      } else {
        row.history.forEach((h, hIdx) => {
          const duration = calculateSeconds(h.borrowDate, h.returnDate);
          excelData.push({
            STT: hIdx === 0 ? idx + 1 : "",
            "TÊN MÁY CHIẾU": hIdx === 0 ? row.projectorName : "",
            "SỐ SERIAL": hIdx === 0 ? row.serialNumber : "",
            "NGƯỜI MƯỢN": h.borrower,
            "BẮT ĐẦU": new Date(h.borrowDate).toLocaleString("vi-VN"),
            "KẾT THÚC": new Date(h.returnDate).toLocaleString("vi-VN"),
            "THỜI LƯỢNG LƯỢT": formatDuration(duration),
            "TỔNG THỜI GIAN DÙNG":
              hIdx === 0 ? formatDuration(row.totalUsageSeconds) : "",
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoMayChieu");
    XLSX.writeFile(
      workbook,
      `Bao_Cao_Su_Dung_May_Chieu_${new Date().getTime()}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#1a237e]">
            Báo cáo chi tiết sử dụng
          </h3>
          <p className="text-sm text-slate-500">
            Thống kê chi tiết từng lượt mượn của tất cả máy chiếu
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <RefreshCw size={18} className="mr-2" />
            )}
            LÀM MỚI
          </button>
          <button
            onClick={exportToExcel}
            disabled={reportData.length === 0 || loading}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md"
          >
            <FileSpreadsheet size={18} className="mr-2" /> XUẤT EXCEL
          </button>
        </div>
      </div>

      {/* Main Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
            <p className="font-medium">Đang xử lý dữ liệu báo cáo...</p>
          </div>
        ) : reportData.length > 0 ? (
          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="border border-slate-200 p-3">STT</th>
                  <th className="border border-slate-200 p-3 text-left">
                    Thông tin máy chiếu
                  </th>
                  <th className="border border-slate-200 p-3 text-left">
                    Người mượn
                  </th>
                  <th className="border border-slate-200 p-3">
                    Thời gian mượn
                  </th>
                  <th className="border border-slate-200 p-3">Thời gian trả</th>
                  <th className="border border-slate-200 p-3">Thời lượng</th>
                  <th className="border border-slate-200 p-3 bg-blue-50 text-[#1a237e]">
                    Tổng thời gian máy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <React.Fragment key={row.projectorId}>
                    {row.history.length === 0 ? (
                      // Trường hợp máy chưa bao giờ được mượn
                      <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-3 text-center text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-200 p-3">
                          <div className="font-bold text-slate-800">
                            {row.projectorName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono uppercase">
                            {row.serialNumber}
                          </div>
                        </td>
                        <td
                          colSpan="4"
                          className="border border-slate-200 p-3 text-center text-slate-400 italic"
                        >
                          Chưa có lượt mượn nào hoàn tất
                        </td>
                        <td className="border border-slate-200 p-3 text-center font-black text-blue-600 bg-blue-50/30">
                          0 phút
                        </td>
                      </tr>
                    ) : (
                      // Trường hợp có lịch sử
                      row.history.map((loan, i) => {
                        const durationSec = calculateSeconds(
                          loan.borrowDate,
                          loan.returnDate,
                        );
                        return (
                          <tr
                            key={loan.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            {i === 0 && (
                              <>
                                <td
                                  rowSpan={row.maxRows}
                                  className="border border-slate-200 p-3 text-center text-slate-400 font-medium align-top"
                                >
                                  {idx + 1}
                                </td>
                                <td
                                  rowSpan={row.maxRows}
                                  className="border border-slate-200 p-3 align-top"
                                >
                                  <div className="font-bold text-[#1a237e] text-sm">
                                    {row.projectorName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-1 px-1.5 py-0.5 bg-slate-100 rounded inline-block">
                                    {row.serialNumber}
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="border border-slate-200 p-3">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <span className="font-semibold text-slate-700">
                                  {loan.borrower}
                                </span>
                              </div>
                            </td>
                            <td className="border border-slate-200 p-3 text-center text-slate-500 text-xs">
                              {new Date(loan.borrowDate).toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="border border-slate-200 p-3 text-center text-slate-500 text-xs">
                              {new Date(loan.returnDate).toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="border border-slate-200 p-3 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                {formatDuration(durationSec)}
                              </span>
                            </td>
                            {i === 0 && (
                              <td
                                rowSpan={row.maxRows}
                                className="border border-slate-200 p-3 text-center align-top bg-blue-50/30"
                              >
                                <div className="flex flex-col items-center py-2">
                                  <Clock
                                    size={16}
                                    className="text-blue-600 mb-1"
                                  />
                                  <span className="font-black text-blue-700 text-base">
                                    {formatDuration(row.totalUsageSeconds)}
                                  </span>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <BarChart3 size={48} className="mb-4 opacity-10" />
            <p className="font-medium text-slate-400">
              Không tìm thấy dữ liệu mượn trả nào
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
