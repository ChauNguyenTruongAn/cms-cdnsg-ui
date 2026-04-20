import React, { useState } from "react";
import { Projector, ArrowRightLeft, Wrench, BarChart2 } from "lucide-react";
import ProjectorTab from "../components/projectors/ProjectorTab";
import BorrowTab from "../components/projectors/BorrowTab";
import MaintenanceTab from "../components/projectors/MaintenanceTab";
import ProjectorReportTab from "../components/projectors/ProjectorReportTab";

export default function Projectors() {
  const [activeTab, setActiveTab] = useState("catalog");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Tabs Header */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-flex w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "catalog"
              ? "bg-[#1a237e] text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Projector size={18} className="mr-2" /> DANH MỤC
        </button>
        <button
          onClick={() => setActiveTab("borrow")}
          className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "borrow"
              ? "bg-indigo-500 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ArrowRightLeft size={18} className="mr-2" /> MƯỢN / TRẢ
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "maintenance"
              ? "bg-amber-500 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Wrench size={18} className="mr-2" /> BẢO TRÌ
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "report"
              ? "bg-green-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <BarChart2 size={18} className="mr-2" /> THỐNG KÊ
        </button>
      </div>

      {/* Render Tab Content */}
      <div className="mt-4">
        {activeTab === "catalog" && <ProjectorTab />}
        {activeTab === "borrow" && <BorrowTab />}
        {activeTab === "maintenance" && <MaintenanceTab />}
        {activeTab === "report" && <ProjectorReportTab />}
      </div>
    </div>
  );
}
