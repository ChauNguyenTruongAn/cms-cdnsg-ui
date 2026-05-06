import React, { useState } from "react";
import { Shirt, Import, ClipboardList, BarChart3 } from "lucide-react";
import UniformCatalogTab from "../components/uniforms/UniformCatalogTab";
import UniformImportTab from "../components/uniforms/UniformImportTab";
import UniformReceiptTab from "../components/uniforms/UniformReceiptTab";
import UniformReportTab from "../components/uniforms/UniformReportTab";


export default function Uniforms() {
  const [activeTab, setActiveTab] = useState("catalog");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tab Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-flex w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "catalog"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Shirt size={18} className="mr-2" /> DANH MỤC ĐỒNG PHỤC
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "import"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Import size={18} className="mr-2" /> NHẬP KHO
        </button>
        <button
          onClick={() => setActiveTab("receipt")}
          className={`flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "receipt"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ClipboardList size={18} className="mr-2" /> CẤP PHÁT / XUẤT
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "stats"
              ? "bg-slate-700 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <BarChart3 size={18} className="mr-2" /> THỐNG KÊ TỒN
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "catalog" && <UniformCatalogTab />}
        {activeTab === "import" && <UniformImportTab />}
        {activeTab === "receipt" && <UniformReceiptTab />}
        {activeTab === "stats" && <UniformReportTab />} {/* Đổi dòng này */}
      </div>
    </div>
  );
}
