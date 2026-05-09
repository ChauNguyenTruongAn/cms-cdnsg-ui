import React, { useState, useEffect } from "react";
import { Plus, Trash2, Send, Loader2, Clock, CheckCircle, XCircle, LayoutDashboard, FileText, AlertTriangle, Package } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { borrowReturnService } from "../services/borrowReturnService";
import { parseJwt } from "../services/authService";
import { userService } from "../services/userService";
import TicketDetailModal from "../components/modals/TicketDetailModal";

export default function UserBorrow() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [userData, setUserData] = useState(null);
  
  const [dashboardData, setDashboardData] = useState({ totalBorrows: 0, holdingItems: 0, overdueCount: 0 });
  const [historyTickets, setHistoryTickets] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters for History
  const [filterStatus, setFilterStatus] = useState("");
  const [searchHistory, setSearchHistory] = useState("");

  const [formData, setFormData] = useState({
    items: [{ itemId: null, itemName: "", quantity: 1 }],
    borrowerName: "",
    department: "",
    email: "",
    borrowDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  });

  const fetchDashboardAndHistory = async (email, status = "") => {
    try {
      const dashRes = await borrowReturnService.getUserDashboard(email);
      if (dashRes.data) setDashboardData(dashRes.data);
      
      const histRes = await borrowReturnService.getUserHistory(email, status, 0, 100);
      if (histRes.data && histRes.data.content) setHistoryTickets(histRes.data.content);
    } catch (error) {
      console.error("Error fetching user dashboard/history", error);
    }
  };

  useEffect(() => {
    if (userData && activeTab === "history") {
      fetchDashboardAndHistory(userData.email, filterStatus);
    }
  }, [filterStatus]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const decoded = parseJwt(token);
        if (decoded?.sub) {
          const email = decoded.sub;
          const res = await userService.getUserByEmail(email);
          const user = res.data || res;
          setUserData(user);
          setFormData(prev => ({
            ...prev,
            borrowerName: user.fullName || "",
            email: user.email || "",
            department: user.department || ""
          }));
          fetchDashboardAndHistory(user.email || email);
        }
      } catch (e) {
        console.error("Error fetching user", e);
      }
    };
    
    const fetchItemsList = async () => {
      try {
        const res = await borrowReturnService.getBorrowItems(0, 1000);
        setAvailableItems(res.data?.content || []);
      } catch(e) {
        console.error("Lỗi lấy danh sách vật phẩm", e);
      }
    };

    fetchUserData();
    fetchItemsList();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: null, itemName: "", quantity: 1 }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleItemSelect = (index, selectedId) => {
    const selected = availableItems.find(i => i.id === parseInt(selectedId));
    if (selected) {
      const newItems = [...formData.items];
      newItems[index].itemId = selected.id;
      newItems[index].itemName = selected.name;
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isItemsValid = formData.items.every(
      (item) => item.itemId !== null && item.itemName.trim() !== "" && item.quantity > 0
    );
    
    if (!isItemsValid || !formData.borrowerName || !formData.email) {
      return showToast("Vui lòng điền đầy đủ thông tin", "error");
    }

    setIsLoading(true);
    try {
      await borrowReturnService.createTicket(formData);
      showToast("Gửi yêu cầu mượn thành công. Vui lòng chờ duyệt!", "success");
      setFormData(prev => ({
        ...prev,
        items: [{ itemId: null, itemName: "", quantity: 1 }]
      }));
      setActiveTab("history");
      fetchDashboardAndHistory(formData.email);
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi khi gửi yêu cầu", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatus = (status) => {
    const styles = {
      PENDING: "bg-blue-100 text-blue-600",
      BORROWED: "bg-amber-100 text-amber-600",
      RETURNED: "bg-green-100 text-green-600",
      REJECTED: "bg-slate-100 text-slate-600",
      INCOMPLETE: "bg-red-100 text-red-600",
    };
    const labels = {
      PENDING: "Chờ duyệt",
      BORROWED: "Đang mượn",
      RETURNED: "Đã trả đủ",
      REJECTED: "Đã từ chối",
      INCOMPLETE: "Trả thiếu",
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredHistory = historyTickets.filter(t => {
    if (!searchHistory) return true;
    const kw = searchHistory.toLowerCase();
    const matchCode = t.borrowCode?.toLowerCase().includes(kw);
    const matchItems = t.items?.some(i => i.itemName.toLowerCase().includes(kw));
    return matchCode || matchItems;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("form")}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${
            activeTab === "form" ? "border-[#1a237e] text-[#1a237e]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Đăng ký mượn thiết bị
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 flex items-center ${
            activeTab === "history" ? "border-[#1a237e] text-[#1a237e]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Thống kê & Lịch sử cá nhân
          {dashboardData.overdueCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
              !
            </span>
          )}
        </button>
      </div>

      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Dashboard KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-bold text-xs uppercase mb-1">Tổng lượt mượn</p>
                <h3 className="text-3xl font-black text-[#1a237e]">{dashboardData.totalBorrows}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <FileText size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-bold text-xs uppercase mb-1">Thiết bị đang cầm</p>
                <h3 className="text-3xl font-black text-amber-500">{dashboardData.holdingItems}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <Package size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-red-500 font-bold text-xs uppercase mb-1">Lượt quá hạn</p>
                <h3 className="text-3xl font-black text-red-600">{dashboardData.overdueCount}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-slate-800 text-lg">Lịch sử phiếu mượn</h3>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Tìm theo mã hoặc tên đồ..."
                  className="px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                />
                <select
                  className="px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="BORROWED">Đang mượn</option>
                  <option value="RETURNED">Đã trả đủ</option>
                  <option value="INCOMPLETE">Trả thiếu</option>
                  <option value="REJECTED">Bị từ chối</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="p-5">Mã Phiếu</th>
                    <th className="p-5">Danh sách đồ</th>
                    <th className="p-5">Thời gian</th>
                    <th className="p-5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-slate-500">
                        Không tìm thấy phiếu mượn nào.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((t) => (
                      <tr 
                        key={t.id} 
                        className="hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedTicket(t)}
                        title="Bấm để xem chi tiết"
                      >
                        <td className="p-5 font-bold text-[#1a237e]">{t.borrowCode}</td>
                        <td className="p-5">
                          <div className="flex flex-col gap-1">
                            {t.items?.map((item, idx) => (
                              <div key={idx} className="text-xs text-slate-600">
                                • {item.itemName} <span className="font-bold text-indigo-600">(x{item.quantity})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="text-[11px] text-slate-500">Mượn: <span className="font-semibold text-slate-700">{new Date(t.borrowDate || t.createdAt).toLocaleDateString("vi-VN")}</span></div>
                          <div className="text-[11px] text-slate-500 mt-1">Hạn trả: <span className="font-semibold text-slate-700">{new Date(t.expectedReturnDate).toLocaleDateString("vi-VN")}</span></div>
                        </td>
                        <td className="p-5">{renderStatus(t.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "form" && (
        <>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a237e] to-[#3949ab] p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Đăng ký mượn thiết bị</h2>
              <p className="text-indigo-100">Điền thông tin các thiết bị bạn cần mượn, yêu cầu sẽ được gửi tới admin phê duyệt.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e] transition-all"
                      value={formData.borrowerName}
                      onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                      placeholder="Nhập tên người mượn..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e] transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Nhập email liên hệ..."
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phòng ban</label>
                      <input
                        type="text"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e] transition-all"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="IT, HR, Sales..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ngày mượn *</label>
                        <input
                          type="date"
                          required
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e] transition-all text-sm"
                          value={formData.borrowDate}
                          onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Dự kiến trả *</label>
                        <input
                          type="date"
                          required
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e] transition-all text-sm"
                          value={formData.expectedReturnDate}
                          onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-700">Danh sách vật phẩm *</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <Plus size={16} className="mr-1" /> Thêm món
                    </button>
                  </div>

                  <div className="space-y-7">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center group">
                        <select
                          required
                          className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 transition-all shadow-sm text-sm"
                          value={item.itemId || ""}
                          onChange={(e) => handleItemSelect(index, e.target.value)}
                        >
                          <option value="" disabled>-- Chọn vật phẩm --</option>
                          {availableItems.map(ai => (
                            <option key={ai.id} value={ai.id} disabled={ai.availableQuantity <= 0}>
                              {ai.name} (Còn {ai.availableQuantity})
                            </option>
                          ))}
                        </select>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            required
                            className="w-24 p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a237e]/30 text-center shadow-sm"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                          <span className="absolute w-24 -top-3.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[8px] font-bold text-slate-400 uppercase tracking-wider">Số lượng</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={formData.items.length === 1}
                          className="p-3.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl disabled:opacity-30 transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto ml-auto flex items-center justify-center px-8 py-4 bg-[#1a237e] text-white font-bold rounded-2xl hover:bg-[#0d145e] transition-colors shadow-lg hover:shadow-xl disabled:opacity-70 group"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                      <Send className="mr-2 group-hover:translate-x-1 transition-transform" size={20} />
                    )}
                    GỬI YÊU CẦU MƯỢN
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Clock className="mr-2 text-indigo-500" size={24} />
              Hướng dẫn mượn đồ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-[#1a237e] mb-2 flex items-center">1. Gửi yêu cầu</h4>
                <p className="text-slate-600">Điền đầy đủ thông tin vào form trên. Đảm bảo email chính xác để nhận mã QR.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-amber-600 mb-2 flex items-center">2. Chờ phê duyệt</h4>
                <p className="text-slate-600">Admin sẽ kiểm tra kho và phê duyệt yêu cầu. Bạn sẽ nhận được email thông báo.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-green-600 mb-2 flex items-center">3. Quét mã nhận đồ</h4>
                <p className="text-slate-600">Sử dụng mã QR được gửi qua email để quét tại kho và nhận thiết bị.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
