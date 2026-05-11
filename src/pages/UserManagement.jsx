import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { userService } from "../services/userService";

// Hàm giải mã JWT để lấy email người dùng hiện tại
const getCurrentUserEmail = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload).sub;
  } catch (error) {
    return null;
  }
};

export default function UserManagement() {
  // States cho danh sách
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const size = 10;

  // States cho Phân quyền và Vai trò (Form)
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // States cho Modal Thêm/Sửa
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'

  const initialFormState = {
    fullName: "",
    username: "",
    email: "",
    password: "",
    schoolID: "",
    roleID: "",
    permissionIDs: [],
  };
  const [formData, setFormData] = useState(initialFormState);

  const role = (v) => {
    switch (v){
      case "ADMIN":
        return "Quản trị viên";
      case "MANAGER":
        return "Quản lý phòng thực hành";
      case "USER":
        return "Sinh viên"
    }
  }

  // Khởi tạo
  useEffect(() => {
    setCurrentUserEmail(getCurrentUserEmail());
    fetchUsers();
    fetchRolesAndPermissions();
  }, [page]);

  // Lấy danh sách users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers(page, size, keyword);
      const data = response.data || response;
      setUsers(data.content || []);
      setTotalPages(data.page.totalPages || 0);
      setTotalElements(data.page.totalElements || 0);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy dữ liệu Roles và Permissions cho Form
  const fetchRolesAndPermissions = async () => {
    try {
      const [resRoles, resPerms] = await Promise.all([
        userService.getRoles(),
        userService.getPermissions(),
      ]);
      setRoles(resRoles.data || resRoles || []);
      setPermissions(resPerms.data || resPerms || []);
    } catch (error) {
      console.error("Không thể tải danh sách Role/Permission", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  // --- LOGIC XỬ LÝ KHÓA / XÓA ---
  const toggleUserStatus = async (email, active) => {
    if (email === currentUserEmail) {
      return toast.error("Bạn không thể tự khóa tài khoản của chính mình!");
    }

    try {
      if (active) {
        await userService.disableUser(email);
        toast.success(`Đã vô hiệu hóa tài khoản ${email}`);
      } else {
        await userService.activateUser(email);
        toast.success(`Đã kích hoạt tài khoản ${email}`);
      }
      fetchUsers();
    } catch (error) {
      toast.error("Thao tác thất bại!");
    }
  };

  const handleDelete = async (email) => {
    if (email === currentUserEmail) {
      return toast.error("Bạn không thể xóa tài khoản đang đăng nhập!");
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${email}?`)) {
      try {
        await userService.deleteUser(email);
        toast.success("Xóa thành công!");
        fetchUsers();
      } catch (error) {
        toast.error("Lỗi khi xóa người dùng!");
      }
    }
  };

  // --- LOGIC MODAL THÊM / SỬA ---
  const openCreateModal = () => {
    setModalMode("create");
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setFormData({
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      password: "", // Bỏ trống, chỉ điền nếu muốn đổi pass
      schoolID: user.schoolID || "",
      roleID: user.role?.id || "",
      permissionIDs: user.permissions?.map((p) => p.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (permId) => {
    setFormData((prev) => {
      const isChecked = prev.permissionIDs.includes(permId);
      if (isChecked) {
        return {
          ...prev,
          permissionIDs: prev.permissionIDs.filter((id) => id !== permId),
        };
      } else {
        return { ...prev, permissionIDs: [...prev.permissionIDs, permId] };
      }
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Đang xử lý...");
    try {
      if (modalMode === "create") {
        await userService.createUser(formData);
        toast.success("Tạo tài khoản thành công!", { id: loadingToast });
      } else {
        // Edit không cho sửa username theo BE hiện tại
        await userService.updateUser({
          ...formData,
          // Nếu không nhập pass mới thì xóa trường pass khỏi payload
          password: formData.password ? formData.password : undefined,
        });
        toast.success("Cập nhật thành công!", { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi!", {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      <Toaster position="top-right" />

      {/* Header và Thanh tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý Người dùng
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tổng số: {totalElements} tài khoản
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="Tìm theo tên, email, mã NV..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1c72bd] focus:border-transparent outline-none text-sm"
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
          </form>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#1c72bd] hover:bg-[#155a96] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 font-medium">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Thông tin</th>
                <th className="py-3 px-4">Mã NV/Trường</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center w-28">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-500">
                      {page * size + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {user.fullName}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.schoolID}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                        <Shield size={12} />
                        {role(user.role?.name).toUpperCase() || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.active ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            toggleUserStatus(user.email, user.active)
                          }
                          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
                            user.email === currentUserEmail
                              ? "opacity-30 cursor-not-allowed"
                              : user.active
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}
                          title={
                            user.email === currentUserEmail
                              ? "Không thể khóa chính mình"
                              : user.active
                                ? "Khóa"
                                : "Mở khóa"
                          }
                          disabled={user.email === currentUserEmail}
                        >
                          {user.active ? (
                            <PowerOff size={16} />
                          ) : (
                            <Power size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded hover:bg-slate-200 transition-colors text-blue-600"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(user.email)}
                          className={`p-1.5 rounded hover:bg-red-100 transition-colors ${
                            user.email === currentUserEmail
                              ? "text-slate-400 opacity-30 cursor-not-allowed"
                              : "text-red-600"
                          }`}
                          title={
                            user.email === currentUserEmail
                              ? "Không thể xóa chính mình"
                              : "Xóa"
                          }
                          disabled={user.email === currentUserEmail}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL THÊM / SỬA USER --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === "create"
                  ? "Thêm người dùng mới"
                  : "Chỉnh sửa người dùng"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    readOnly={modalMode === "edit"}
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm ${modalMode === "edit" ? "bg-slate-100 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500"}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Tên đăng nhập {modalMode === "create" && "*"}
                  </label>
                  <input
                    type="text"
                    required={modalMode === "create"}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    readOnly={modalMode === "edit"}
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm ${modalMode === "edit" ? "bg-slate-100 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500"}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Mật khẩu{" "}
                    {modalMode === "edit" && (
                      <span className="text-xs text-slate-400 font-normal">
                        (Bỏ trống nếu không đổi)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    required={modalMode === "create"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Mã NV / Trường *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolID}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolID: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Vai trò (Role) *
                  </label>
                  <select
                    required
                    value={formData.roleID}
                    onChange={(e) =>
                      setFormData({ ...formData, roleID: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {role(r.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Quyền hạn (Permissions)
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50">
                    {permissions.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissionIDs.includes(p.id)}
                          onChange={() => handleCheckboxChange(p.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1c72bd] text-white rounded-lg hover:bg-[#155a96] transition-colors font-medium text-sm"
                >
                  {modalMode === "create" ? "Xác nhận Thêm" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
