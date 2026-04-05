import React, { useState } from "react";
import {
  Calendar,
  FileSpreadsheet,
  Search,
  Loader2,
  BarChart3,
} from "lucide-react";
import { uniformService } from "../../services/uniformService";
import { useToast } from "../../context/ToastContext";
import * as XLSX from "xlsx";

export default function UniformReportTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Bộ lọc thời gian
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      // 1. Tải toàn bộ dữ liệu cần thiết trong khoảng thời gian
      const [uniRes, importsRes, receiptsRes] = await Promise.all([
        uniformService.getAllUniforms(0, 1000), // Lấy danh mục
        uniformService.getAllImports({
          page: 0,
          size: 1000,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        }),
        uniformService.getAllReceipts({
          page: 0,
          size: 1000,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        }),
      ]);

      const uniforms = uniRes.content || [];
      const imports = importsRes.content || [];
      const receipts = receiptsRes.content || [];

      // 2. Xử lý logic gộp dữ liệu theo từng loại đồng phục + size
      const processed = uniforms
        .map((uni) => {
          const uniImports = [];
          const uniReceipts = [];

          // Lọc lịch sử nhập
          imports.forEach((imp) => {
            const detail = imp.details?.find((d) => d.uniform?.id === uni.id);
            if (detail) {
              uniImports.push({
                date: imp.date,
                qty: detail.quantity,
                source: imp.nameResponse,
              });
            }
          });

          // Lọc lịch sử cấp phát
          receipts.forEach((rec) => {
            const detail = rec.details?.find((d) => d.uniform?.id === uni.id);
            if (detail) {
              uniReceipts.push({
                date: rec.date,
                qty: detail.quantity,
                receiver: rec.cusName,
              });
            }
          });

          const maxRows = Math.max(1, uniImports.length, uniReceipts.length);

          return {
            ...uni,
            imports: uniImports,
            receipts: uniReceipts,
            maxRows,
          };
        })
        .filter((u) => u.imports.length > 0 || u.receipts.length > 0); // Chỉ hiện những loại có biến động

      setReportData(processed);
      showToast("Đã tổng hợp dữ liệu báo cáo!");
    } catch (error) {
      showToast("Lỗi khi tạo báo cáo!", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) return;

    const excelData = [];
    reportData.forEach((row, idx) => {
      for (let i = 0; i < row.maxRows; i++) {
        excelData.push({
          STT: i === 0 ? idx + 1 : "",
          "LOẠI ĐỒNG PHỤC": i === 0 ? row.type : "",
          SIZE: i === 0 ? row.size : "",
          "NGÀY NHẬP": row.imports[i]?.date || "",
          "SL NHẬP": row.imports[i]?.qty || "",
          "NGÀY XUẤT": row.receipts[i]?.date || "",
          "SL XUẤT": row.receipts[i]?.qty || "",
          "TỒN KHO": i === 0 ? row.stock : "",
          "NGƯỜI NHẬN": row.receipts[i]?.receiver || "",
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoDongPhuc");
    XLSX.writeFile(
      workbook,
      `Bao_Cao_Dong_Phuc_${dateRange.fromDate}_${dateRange.toDate}.xlsx`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              Từ ngày
            </label>
            <input
              type="date"
              className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none"
              value={dateRange.fromDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, fromDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              Đến ngày
            </label>
            <input
              type="date"
              className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none"
              value={dateRange.toDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, toDate: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-slate-900 transition-all"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Search size={18} className="mr-2" />
            )}{" "}
            XEM BÁO CÁO
          </button>
          <button
            onClick={exportToExcel}
            disabled={reportData.length === 0}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet size={18} className="mr-2" /> XUẤT EXCEL
          </button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {!loading && reportData.length > 0 ? (
          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold">
                <tr>
                  <th className="border border-slate-300 p-2">STT</th>
                  <th className="border border-slate-300 p-2 text-left">
                    Loại đồng phục
                  </th>
                  <th className="border border-slate-300 p-2">Size</th>
                  <th className="border border-slate-300 p-2">Ngày Nhập</th>
                  <th className="border border-slate-300 p-2">SL Nhập</th>
                  <th className="border border-slate-300 p-2">Ngày Xuất</th>
                  <th className="border border-slate-300 p-2">SL Xuất</th>
                  <th className="border border-slate-300 p-2 bg-indigo-50">
                    Tồn
                  </th>
                  <th className="border border-slate-300 p-2 text-left">
                    Ghi chú/Người nhận
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    {[...Array(row.maxRows)].map((_, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {i === 0 && (
                          <>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 text-center text-slate-400 font-medium align-top p-2"
                            >
                              {idx + 1}
                            </td>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 font-bold text-slate-800 align-top p-2"
                            >
                              {row.type}
                            </td>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 text-center align-top p-2"
                            >
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">
                                {row.size}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="border border-slate-300 text-center p-2 text-slate-500">
                          {row.imports[i]?.date || ""}
                        </td>
                        <td className="border border-slate-300 text-center p-2 font-bold text-emerald-600">
                          {row.imports[i]?.qty || ""}
                        </td>
                        <td className="border border-slate-300 text-center p-2 text-slate-500">
                          {row.receipts[i]?.date || ""}
                        </td>
                        <td className="border border-slate-300 text-center p-2 font-bold text-amber-600">
                          {row.receipts[i]?.qty || ""}
                        </td>
                        {i === 0 && (
                          <td
                            rowSpan={row.maxRows}
                            className="border border-slate-300 text-center align-top p-2 font-black text-indigo-700 bg-indigo-50/30 text-base"
                          >
                            {row.stock}
                          </td>
                        )}
                        <td className="border border-slate-300 p-2 text-xs text-slate-600 italic">
                          {row.receipts[i]?.receiver
                            ? `Phát cho: ${row.receipts[i].receiver}`
                            : row.imports[i]?.source
                              ? `Từ: ${row.imports[i].source}`
                              : ""}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            {loading ? (
              <Loader2
                size={48}
                className="animate-spin mb-4 text-indigo-500"
              />
            ) : (
              <BarChart3 size={48} className="mb-4 opacity-20" />
            )}
            <p className="font-medium">
              {loading
                ? "Đang tính toán số liệu..."
                : "Chọn thời gian và ấn nút xem báo cáo"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
