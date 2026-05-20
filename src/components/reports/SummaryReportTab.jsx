import React, { useState } from "react";
import { Calendar, FileSpreadsheet, Search, Loader2 } from "lucide-react";
import { materialService } from "../../services/materialService"; // Đảm bảo đường dẫn đúng
import { receiptService } from "../../services/receiptService"; // Đảm bảo đường dẫn đúng
import { useToast } from "../../context/ToastContext";
import * as XLSX from "xlsx";

export default function SummaryReportTab() {
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
    if (!dateRange.fromDate || !dateRange.toDate) {
      return showToast("Vui lòng chọn đầy đủ từ ngày đến ngày!", "error");
    }

    setLoading(true);
    try {
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

      const processedData = materials
        .map((mat) => {
          const matImports = [];
          const matExports = [];

          imports
            .filter((imp) => imp.status !== "CANCELLED")
            .forEach((imp) => {
              const item = imp.importItems?.find(
                (i) => i.material?.id === mat.id,
              );
              if (item)
                matImports.push({ date: imp.importDate, qty: item.quantity });
            });

          exports
            .filter((exp) => exp.status !== "CANCELLED")
            .forEach((exp) => {
              const item = exp.exportItems?.find(
                (i) => i.material?.id === mat.id,
              );
              if (item)
                matExports.push({
                  date: exp.exportDate,
                  qty: item.quantity,
                  note: exp.note || "",
                });
            });

          const maxRows = Math.max(1, matImports.length, matExports.length);

          return { ...mat, imports: matImports, exports: matExports, maxRows };
        })
        .filter((mat) => mat.imports.length > 0 || mat.exports.length > 0);

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

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoXuatNhapTon");

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
    XLSX.writeFile(
      workbook,
      `Bao_Cao_Xuat_Nhap_Ton_${dateRange.fromDate}_den_${dateRange.toDate}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Bộ lọc */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            TỪ NGÀY
          </label>
          <input
            type="date"
            className="w-full p-2.5 rounded-lg border outline-none focus:border-teal-600"
            value={dateRange.fromDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, fromDate: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            ĐẾN NGÀY
          </label>
          <input
            type="date"
            className="w-full p-2.5 rounded-lg border outline-none focus:border-teal-600"
            value={dateRange.toDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, toDate: e.target.value })
            }
          />
        </div>
        <div className="md:col-span-2 flex space-x-2">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex-1 bg-teal-600 text-white p-2.5 rounded-lg font-bold flex justify-center items-center hover:bg-teal-700"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Search size={18} className="mr-2" />
            )}
            TÌM KIẾM
          </button>
          <button
            onClick={exportToExcel}
            disabled={reportData.length === 0}
            className="flex-1 bg-green-600 text-white p-2.5 rounded-lg font-bold flex justify-center items-center hover:bg-green-700 disabled:opacity-50"
          >
            <FileSpreadsheet size={18} className="mr-2" /> XUẤT EXCEL
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={40} className="animate-spin text-teal-600 mb-4" />
            <p>Đang tính toán số liệu...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>Vui lòng chọn mốc thời gian và ấn "Tìm kiếm".</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse border border-slate-300 text-sm text-left">
              <thead className="bg-teal-600 text-white">
                <tr>
                  <th className="border border-slate-300 px-4 py-3 text-center w-12">
                    STT
                  </th>
                  <th className="border border-slate-300 px-4 py-3">
                    TÊN VẬT TƯ
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    NGÀY NHẬP
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    SL NHẬP
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    NGÀY XUẤT
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    SL XUẤT
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center">
                    TỒN KHO
                  </th>
                  <th className="border border-slate-300 px-4 py-3">GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => {
                  const trs = [];
                  for (let i = 0; i < row.maxRows; i++) {
                    trs.push(
                      <tr key={`${row.id}-${i}`} className="hover:bg-slate-50">
                        {i === 0 && (
                          <>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 px-4 py-2 text-center text-slate-500 align-top"
                            >
                              {index + 1}
                            </td>
                            <td
                              rowSpan={row.maxRows}
                              className="border border-slate-300 px-4 py-2 font-bold text-teal-700 align-top"
                            >
                              {row.name}
                            </td>
                          </>
                        )}
                        <td className="border border-slate-300 px-4 py-2 text-center text-slate-600">
                          {row.imports[i]?.date || ""}
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-center font-bold text-green-600">
                          {row.imports[i]?.qty || ""}
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-center text-slate-600">
                          {row.exports[i]?.date || ""}
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-center font-bold text-amber-600">
                          {row.exports[i]?.qty || ""}
                        </td>
                        {i === 0 && (
                          <td
                            rowSpan={row.maxRows}
                            className="border border-slate-300 px-4 py-2 text-center font-bold text-slate-800 bg-slate-50 align-top"
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
