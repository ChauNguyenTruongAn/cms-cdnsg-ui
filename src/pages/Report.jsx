import React, { useState } from "react";
import { Calendar, FileSpreadsheet, Search, Loader2 } from "lucide-react";
import { materialService } from "../services/materialService";
import { receiptService } from "../services/receiptService";
import { useToast } from "../context/ToastContext";
import * as XLSX from "xlsx";

export default function Report() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Bộ lọc thời gian
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0], // Ngày đầu tháng
    toDate: new Date().toISOString().split("T")[0], // Hôm nay
  });

  const generateReport = async () => {
    if (!dateRange.fromDate || !dateRange.toDate) {
      return showToast("Vui lòng chọn đầy đủ từ ngày đến ngày!", "error");
    }

    setLoading(true);
    try {
      // 1. Tải toàn bộ dữ liệu (Để size lớn 10000 để lấy hết làm báo cáo)
      const [matsRes, importsRes, exportsRes] = await Promise.all([
        materialService.getAllMaterials(0, 10000),
        receiptService.getAllImports({
          page: 0,
          size: 10000,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        }),
        receiptService.getAllExports({
          page: 0,
          size: 10000,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        }),
      ]);

      const materials = matsRes.data.content || [];
      const imports = importsRes.data.content || [];
      const exports = exportsRes.data.content || [];

      // 2. Xử lý nhào nặn dữ liệu (Data Transformation)
      const processedData = materials
        .map((mat) => {
          const matImports = [];
          const matExports = [];

          // Lọc các lần nhập của vật tư này (chỉ lấy phiếu đã hoàn thành)
          imports
            .filter((imp) => imp.status !== "CANCELLED")
            .forEach((imp) => {
              const item = imp.importItems?.find(
                (i) => i.material?.id === mat.id,
              );
              if (item) {
                matImports.push({ date: imp.importDate, qty: item.quantity });
              }
            });

          // Lọc các lần xuất của vật tư này
          exports
            .filter((exp) => exp.status !== "CANCELLED")
            .forEach((exp) => {
              const item = exp.exportItems?.find(
                (i) => i.material?.id === mat.id,
              );
              if (item) {
                matExports.push({
                  date: exp.exportDate,
                  qty: item.quantity,
                  note: exp.note || "",
                });
              }
            });

          // Tìm số dòng lớn nhất cần gộp (Rowspan)
          const maxRows = Math.max(1, matImports.length, matExports.length);

          return {
            ...mat,
            imports: matImports,
            exports: matExports,
            maxRows,
          };
        })
        .filter((mat) => mat.imports.length > 0 || mat.exports.length > 0);
      // Chỉ giữ lại những vật tư có phát sinh giao dịch trong kỳ

      setReportData(processedData);
      showToast("Tạo báo cáo thành công!");
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi tải dữ liệu làm báo cáo!", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0)
      return showToast("Không có dữ liệu để xuất!", "error");

    // Tạo cấu trúc dữ liệu phẳng cho Excel
    const excelData = [];

    reportData.forEach((row, index) => {
      for (let i = 0; i < row.maxRows; i++) {
        excelData.push({
          STT: i === 0 ? index + 1 : "",
          "TÊN VẬT TƯ": i === 0 ? row.name : "",
          "NGÀY NHẬP": row.imports[i]?.date || "",
          "SỐ LƯỢNG NHẬP": row.imports[i]?.qty || "",
          "NGÀY XUẤT": row.exports[i]?.date || "",
          "SỐ LƯỢNG XUẤT": row.exports[i]?.qty || "",
          "TỒN KHO HIỆN TẠI": i === 0 ? row.inventory : "",
          "GHI CHÚ": row.exports[i]?.note || "",
        });
      }
    });

    // Khởi tạo Workbook và Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoXuatNhapTon");

    // Thiết lập độ rộng cột cho Excel đẹp hơn
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
    ];

    // Tải file xuống
    XLSX.writeFile(
      workbook,
      `Bao_Cao_Xuat_Nhap_Ton_${dateRange.fromDate}_den_${dateRange.toDate}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Thanh công cụ */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1a237e]"
              value={dateRange.fromDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, fromDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1a237e]"
              value={dateRange.toDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, toDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex space-x-3 w-full md:w-auto">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex-1 md:flex-none bg-[#1a237e] text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-[#0d145e] transition-colors shadow-md disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Search size={18} className="mr-2" />
            )}
            XEM BÁO CÁO
          </button>

          <button
            onClick={exportToExcel}
            disabled={reportData.length === 0}
            className="flex-1 md:flex-none bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={18} className="mr-2" />
            XUẤT EXCEL
          </button>
        </div>
      </div>

      {/* Bảng Preview HTML (Giống hình mẫu) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-slate-400">
            <Loader2 size={40} className="animate-spin text-[#1a237e] mb-4" />
            <p className="font-medium animate-pulse">
              Đang tính toán số liệu báo cáo...
            </p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>Vui lòng chọn mốc thời gian và ấn "Xem báo cáo".</p>
            <p className="text-sm mt-2">
              Hệ thống chỉ hiển thị vật tư có phát sinh Nhập/Xuất trong mốc thời
              gian đã chọn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <div className="text-center mb-6 mt-4">
              <h2 className="text-xl font-bold uppercase text-slate-800">
                BÁO CÁO NHẬP – XUẤT – TỒN
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Từ ngày {dateRange.fromDate} đến {dateRange.toDate}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border border-slate-300 px-4 py-3 text-center w-12">
                    STT
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-left">
                    TÊN VẬT TƯ
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    NGÀY NHẬP
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    SỐ LƯỢNG
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    NGÀY XUẤT
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    SỐ LƯỢNG
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center bg-slate-200">
                    TỒN
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-left">
                    GHI CHÚ
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => {
                  const trs = [];
                  for (let i = 0; i < row.maxRows; i++) {
                    trs.push(
                      <tr key={`${row.id}-${i}`} className="hover:bg-slate-50">
                        {/* STT & Tên Vật Tư chỉ render ở dòng đầu tiên của vật tư đó (rowspan) */}
                        {i === 0 && (
                          <>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 px-4 py-2 text-center text-slate-500 align-top bg-white"
                            >
                              {index + 1}
                            </td>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 px-4 py-2 font-bold text-[#1a237e] align-top bg-white"
                            >
                              {row.name}
                            </td>
                          </>
                        )}

                        {/* Các cột chi tiết Nhập / Xuất */}
                        <td className="border border-slate-300 px-4 py-2 text-center text-slate-600">
                          {row.imports[i]?.date || ""}
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-center font-medium text-green-700">
                          {row.imports[i]?.qty || ""}
                        </td>

                        <td className="border border-slate-300 px-4 py-2 text-center text-slate-600">
                          {row.exports[i]?.date || ""}
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-center font-medium text-amber-600">
                          {row.exports[i]?.qty || ""}
                        </td>

                        {/* Tồn Kho chỉ hiển thị ở dòng đầu */}
                        {i === 0 && (
                          <td
                            rowSpan={row.maxRows}
                            className="border border-slate-300 px-4 py-2 text-center font-bold text-slate-800 text-base align-top bg-slate-50"
                          >
                            {row.inventory}
                          </td>
                        )}

                        <td className="border border-slate-300 px-4 py-2 text-slate-500 text-xs">
                          {row.exports[i]?.note || ""}
                        </td>
                      </tr>,
                    );
                  }
                  return trs;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
