import React, { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import ImportTab from "../components/transactions/ImportTab";
import ExportTab from "../components/transactions/ExportTab";

export default function Transactions() {
  const [activeTab, setActiveTab] = useState("import"); // 'import' | 'export'

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Tabs Header */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-flex w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab("import")}
          className={`flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "import"
              ? "bg-[#1a237e] text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ArrowDownToLine size={18} className="mr-2" />
          QUẢN LÝ NHẬP KHO
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "export"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ArrowUpFromLine size={18} className="mr-2" />
          QUẢN LÝ XUẤT KHO
        </button>
      </div>

      {/* Render Tab Content */}
      <div className="mt-4">
        {activeTab === "import" ? <ImportTab /> : <ExportTab />}
      </div>
    </div>
  );
}
