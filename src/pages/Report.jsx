import React, { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Layers } from "lucide-react"; // Import thêm Layers
import SummaryReportTab from "../components/reports/SummaryReportTab";
import ImportReportTab from "../components/reports/ImportReportTab";
import ExportReportTab from "../components/reports/ExportReportTab";

export default function Report() {
  const [activeTab, setActiveTab] = useState("SUMMARY"); // Mặc định mở tab Tổng hợp

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
        {/* Nút Tab Báo cáo Tổng Hợp (Gốc của bạn) */}
        <button
          onClick={() => setActiveTab("SUMMARY")}
          className={`flex-1 py-3.5 flex justify-center items-center font-bold text-sm rounded-lg transition-all ${
            activeTab === "SUMMARY"
              ? "bg-teal-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Layers size={18} className="mr-2" />
          NHẬP - XUẤT - TỒN
        </button>

        {/* Nút Tab Báo Cáo Nhập */}
        <button
          onClick={() => setActiveTab("IMPORT")}
          className={`flex-1 py-3.5 flex justify-center items-center font-bold text-sm rounded-lg transition-all ${
            activeTab === "IMPORT"
              ? "bg-[#1a237e] text-white shadow-md"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <ArrowDownToLine size={18} className="mr-2" />
          BÁO CÁO NHẬP KHO
        </button>

        {/* Nút Tab Báo Cáo Xuất */}
        <button
          onClick={() => setActiveTab("EXPORT")}
          className={`flex-1 py-3.5 flex justify-center items-center font-bold text-sm rounded-lg transition-all ${
            activeTab === "EXPORT"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <ArrowUpFromLine size={18} className="mr-2" />
          BÁO CÁO XUẤT KHO
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "SUMMARY" && <SummaryReportTab />}
        {activeTab === "IMPORT" && <ImportReportTab />}
        {activeTab === "EXPORT" && <ExportReportTab />}
      </div>
    </div>
  );
}
