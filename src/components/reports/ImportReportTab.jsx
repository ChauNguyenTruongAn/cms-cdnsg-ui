import React, { useState } from "react";
import { Search, FileSpreadsheet, Loader2, Calendar } from "lucide-react";
import { receiptService } from "../../services/receiptService";
import { useToast } from "../../context/ToastContext";
import * as XLSX from "xlsx";

export default function ImportReportTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    materialName: "",
    quantity: "",
    note: "",
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Gọi API Báo cáo Nhập đã viết ở Backend
      const res = await receiptService.getImportReport(filters);
      setReportData(res.data || []);
      if (res.data?.length === 0)
        showToast("Không có dữ liệu trong khoảng thời gian này", "info");
    } catch (error) {
      showToast("Lỗi khi tải báo cáo nhập kho!", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (reportData.length === 0) return;
    const excelData = [];

    // Trải phẳng dữ liệu từ API (đang group theo ngày) ra cho Excel
    reportData.forEach((day) => {
      day.details.forEach((item, idx) => {
        excelData.push({
          "NGÀY NHẬP": idx === 0 ? day.importDate : "",
          "MÃ PHIẾU": item.receiptCode,
          "TÊN VẬT TƯ": item.materialName,
          "ĐƠN VỊ": item.unitName,
          "SỐ LƯỢNG": item.quantity,
          "GHI CHÚ": item.note || "",
          "TỔNG TRONG NGÀY": idx === 0 ? day.totalQuantityOfDay : "",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoNhap");
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 25 },
      { wch: 20 },
    ];
    XLSX.writeFile(
      workbook,
      `Bao_Cao_Nhap_${filters.fromDate}_den_${filters.toDate}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Filters */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            TỪ NGÀY
          </label>
          <input
            type="date"
            className="w-full p-2.5 rounded-lg border outline-none focus:border-[#1a237e]"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            ĐẾN NGÀY
          </label>
          <input
            type="date"
            className="w-full p-2.5 rounded-lg border outline-none focus:border-[#1a237e]"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            TÊN VẬT TƯ
          </label>
          <input
            type="text"
            placeholder="Tìm tên..."
            className="w-full p-2.5 rounded-lg border outline-none focus:border-[#1a237e]"
            value={filters.materialName}
            onChange={(e) =>
              setFilters({ ...filters, materialName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            GHI CHÚ
          </label>
          <input
            type="text"
            placeholder="Tìm ghi chú..."
            className="w-full p-2.5 rounded-lg border outline-none focus:border-[#1a237e]"
            value={filters.note}
            onChange={(e) => setFilters({ ...filters, note: e.target.value })}
          />
        </div>
        <div className="flex items-end space-x-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex-1 bg-[#1a237e] text-white p-2.5 rounded-lg font-bold flex justify-center items-center hover:bg-[#0d145e]"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </button>
          <button
            onClick={exportExcel}
            disabled={reportData.length === 0}
            className="flex-1 bg-green-600 text-white p-2.5 rounded-lg font-bold flex justify-center items-center hover:bg-green-700 disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[400px]">
        {reportData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>Vui lòng chọn bộ lọc và ấn Tìm kiếm</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a237e] text-white uppercase">
              <tr>
                <th className="px-4 py-3 text-center border-r border-white/20">
                  Ngày Nhập
                </th>
                <th className="px-4 py-3">Mã Phiếu</th>
                <th className="px-4 py-3">Tên Vật Tư</th>
                <th className="px-4 py-3">Đơn Vị</th>
                <th className="px-4 py-3 text-right">Số Lượng</th>
                <th className="px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((day, dIndex) =>
                day.details.map((item, iIndex) => (
                  <tr
                    key={`${dIndex}-${iIndex}`}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    {iIndex === 0 && (
                      <td
                        rowSpan={day.details.length}
                        className="px-4 py-3 text-center border-r border-slate-200 align-top bg-slate-50/50"
                      >
                        <span className="font-bold text-slate-800 block">
                          {day.importDate}
                        </span>
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">
                          Tổng: +{day.totalQuantityOfDay}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {item.receiptCode}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1a237e]">
                      {item.materialName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.unitName || "-"}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600 text-right">
                      +{item.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {item.note}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
