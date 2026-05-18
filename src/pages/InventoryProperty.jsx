import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import * as XLSX from "xlsx";
import axios from "axios";
import debounce from "lodash/debounce";
import {
  Upload,
  Save,
  Trash2,
  Edit2,
  X,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  History,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { inventoryService } from "../services/inventoryService";
import {
  transformExcelToLucky,
  transformLuckyToExcel,
  toCellAddress,
} from "../utils/sheetConverter";

const ROLES_EDIT = ["ADMIN", "MANAGER"];

export default function InventoryProperty() {
  const { userRole } = useOutletContext() || {};
  const canEdit = ROLES_EDIT.includes(userRole);

  // ── State ─────────────────────────────────────────────────────
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [filterDept, setFilterDept] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [openFile, setOpenFile] = useState(null); // metadata
  const [luckyData, setLuckyData] = useState(null); // FortuneSheet data
  const [sheetLoading, setSheetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [logTotal, setLogTotal] = useState(0);

  const [showUpload, setShowUpload] = useState(false);
  const [showEditMeta, setShowEditMeta] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [toast, setToast] = useState(null);

  const luckyDataRef = useRef(null);
  const pendingChangesRef = useRef([]);
  const prevCellsRef = useRef({});

  // ── Toast helper ──────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch file list ───────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getFiles({
        department: filterDept || undefined,
        keyword: keyword || undefined,
        page,
        size: 12,
      });
      const d = res.data;
      setFiles(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      showToast("Không tải được danh sách file", "error");
    } finally {
      setLoading(false);
    }
  }, [filterDept, keyword, page]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    inventoryService
      .getDepartments()
      .then((r) => setDepartments(r.data || []))
      .catch(() => {});
  }, []);

  // ── Open file in spreadsheet ──────────────────────────────────
  const openSheet = async (fileMeta) => {
    console.log(
      `[openSheet] Opening file: ${fileMeta.fileName} (${fileMeta.id})`,
    );
    setSheetLoading(true);
    setOpenFile(fileMeta);
    setDirty(false);
    pendingChangesRef.current = [];
    prevCellsRef.current = {};
    try {
      const resp = await axios.get(fileMeta.cloudinaryUrl, {
        responseType: "arraybuffer",
      });
      const wb = XLSX.read(resp.data, { type: "array" });
      const lucky = transformExcelToLucky(wb);
      console.log(
        `[openSheet] Loaded ${lucky.length} sheets, initializing change detection...`,
      );
      // snapshot for change detection
      lucky.forEach((sheet) => {
        (sheet.celldata || []).forEach((cell) => {
          const key = `${sheet.name}::${toCellAddress(cell.r, cell.c)}`;
          prevCellsRef.current[key] = cell.v?.v ?? null;
        });
      });
      setLuckyData(lucky);
      luckyDataRef.current = lucky;
      console.log(`✓ File opened successfully`);
    } catch (err) {
      console.error("❌ Failed to open file:", err.message);
      showToast("Không mở được file", "error");
      setOpenFile(null);
    } finally {
      setSheetLoading(false);
    }
  };

  // ── Debounced log sender (persist instance) ──────────────────
  // Tạo debounce instance 1 lần duy nhất (không recreate mỗi render)
  const debouncedLogRef = useRef(null);

  useEffect(() => {
    if (!debouncedLogRef.current) {
      console.log(
        `[useEffect] Initializing debounced log sender (500ms delay)...`,
      );
      debouncedLogRef.current = debounce(async (fileId) => {
        console.log(`[Debounce] Processing logs for file ${fileId}...`);
        if (!pendingChangesRef.current.length) {
          console.log(`[Debounce] ⚠️ No pending changes to save`);
          return;
        }
        const batch = [...pendingChangesRef.current];
        pendingChangesRef.current = [];
        console.log(
          `[Debounce] Sending ${batch.length} changes to API:`,
          batch,
        );
        try {
          const res = await inventoryService.saveLogs({
            fileId,
            changes: batch,
          });
          console.log(
            `✓ [Debounce] Successfully saved ${batch.length} changes to logs`,
            res.data,
          );
        } catch (err) {
          console.error(
            `❌ [Debounce] Failed to save logs:`,
            err.response?.data || err.message,
          );
          // Re-add changes to queue on failure
          pendingChangesRef.current.unshift(...batch);
        }
      }, 500);
      console.log(`✓ Debounced log sender initialized`);
    } else {
      console.log(
        `[useEffect] Debounced log sender already exists, skipping init`,
      );
    }
  }, []);

  const handleSheetChange = (newData) => {
    console.log(`[handleSheetChange] Called with newData:`, newData);

    if (!canEdit || !openFile) {
      console.log(
        `[handleSheetChange] ⚠️ Skipped - canEdit: ${canEdit}, openFile: ${openFile?.id}`,
      );
      return;
    }

    luckyDataRef.current = newData;
    setDirty(true);

    let changeCount = 0;
    let totalCells = 0;

    newData.forEach((sheet) => {
      const cellCount = (sheet.celldata || []).length;
      totalCells += cellCount;
      console.log(
        `[handleSheetChange] Sheet "${sheet.name}" has ${cellCount} cells`,
      );

      (sheet.celldata || []).forEach((cell) => {
        const addr = toCellAddress(cell.r, cell.c);
        const key = `${sheet.name}::${addr}`;
        const newVal = cell.v?.v ?? null;
        const oldVal = prevCellsRef.current[key] ?? null;

        // DEBUG: Log cell structure
        if (!newVal && oldVal && cell.v) {
          console.log(`[DEBUG] Cell ${key} structure:`, {
            cellObj: cell.v,
            extractedValue: cell.v?.v,
            fallback: newVal,
          });
        }

        if (newVal !== oldVal) {
          changeCount++;
          prevCellsRef.current[key] = newVal;
          const changeLog = {
            sheetName: sheet.name,
            cellAddress: addr,
            oldValue: oldVal == null ? null : String(oldVal),
            newValue: newVal == null ? null : String(newVal),
          };
          pendingChangesRef.current.push(changeLog);
          console.log(
            `[✓ Change detected] ${sheet.name}!${addr}: "${oldVal}" → "${newVal}"`,
          );
        }
      });
    });

    console.log(
      `[handleSheetChange] Summary: ${changeCount} changes from ${totalCells} total cells`,
    );

    // Trigger debounced log sender
    if (changeCount > 0) {
      console.log(
        `[handleSheetChange] Triggering debounced log for file ${openFile.id}...`,
      );
      debouncedLogRef.current?.(openFile.id);
    } else {
      console.log(`[handleSheetChange] No changes detected, skipping log send`);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Xóa file này?")) return;
    try {
      await inventoryService.deleteFile(id);
      showToast("Đã xóa file");
      fetchFiles();
    } catch {
      showToast("Xóa thất bại", "error");
    }
  };

  // ── Logs ──────────────────────────────────────────────────────
  const openLogs = async (fileId) => {
    console.log(`[openLogs] Loading logs for file ${fileId}...`);
    setShowLogs(true);
    setLogPage(0);
    try {
      const res = await inventoryService.getFileLogs(fileId, {
        page: 0,
        size: 20,
      });
      console.log(
        `[openLogs] Got ${res.data.content?.length || 0} logs:`,
        res.data.content,
      );
      setLogs(res.data.content || []);
      setLogTotal(res.data.totalPages || 0);
    } catch (err) {
      console.error(
        "❌ Failed to load logs:",
        err.response?.data || err.message,
      );
      showToast("Không tải được logs", "error");
    }
  };

  const loadMoreLogs = async (p) => {
    setLogPage(p);
    try {
      const res = await inventoryService.getFileLogs(openFile.id, {
        page: p,
        size: 20,
      });
      setLogs(res.data.content || []);
    } catch {}
  };

  const formatBytes = (b) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  const fmt = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

  // --- LƯU FILE (OVERWRITE) ---
  const handleSave = async () => {
    if (!luckyDataRef.current || !openFile) return;
    setSaving(true);
    console.log(`[handleSave] Starting save for file ${openFile.id}...`);

    try {
      // 1. Flush pending logs: Cancel debounce & send immediately
      console.log(
        `[handleSave] Pending changes before flush: ${pendingChangesRef.current.length}`,
      );
      if (debouncedLogRef.current) {
        debouncedLogRef.current.cancel?.();
        console.log(`[handleSave] Cancelled debounce timer`);
      }
      if (pendingChangesRef.current.length > 0) {
        const batch = [...pendingChangesRef.current];
        pendingChangesRef.current = [];
        console.log(
          `[handleSave] Flushing ${batch.length} pending logs:`,
          batch,
        );
        const logRes = await inventoryService.saveLogs({
          fileId: openFile.id,
          changes: batch,
        });
        console.log(`✓ Flushed ${batch.length} logs response:`, logRes);
      } else {
        console.log(`[handleSave] No pending logs to flush`);
      }

      // 2. Chuyển đổi dữ liệu từ FortuneSheet sang Excel
      console.log(`[handleSave] Converting FortuneSheet to Excel...`);
      const wb = transformLuckyToExcel(luckyDataRef.current);
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fd = new FormData();
      fd.append("file", blob, `${openFile.fileName}.xlsx`);

      // 3. Gọi API overwrite lên Cloudinary qua BE
      console.log(`[handleSave] Uploading file to server...`);
      const res = await inventoryService.overwriteFile(openFile.id, fd);
      console.log(`✓ File saved successfully:`, res);

      setOpenFile(res.data);
      setDirty(false);
      showToast("Đã lưu dữ liệu và lịch sử!");
      fetchFiles();
    } catch (error) {
      console.error("❌ Save failed:", error.response?.data || error.message);
      showToast("Lưu thất bại!", "error");
    } finally {
      setSaving(false);
    }
  };

  const closeSheet = () => {
    console.log(`[closeSheet] Closing file, flushing remaining logs...`);
    // Flush any pending logs before closing
    if (pendingChangesRef.current.length > 0) {
      const batch = [...pendingChangesRef.current];
      pendingChangesRef.current = [];
      inventoryService
        .saveLogs({ fileId: openFile.id, changes: batch })
        .then(() => {
          console.log(`✓ Auto-flushed ${batch.length} logs on close`);
        })
        .catch((err) => {
          console.error(
            `❌ Failed to flush logs on close:`,
            err.response?.data || err.message,
          );
        });
    }
    setOpenFile(null);
    setLuckyData(null);
    setDirty(false);
  };

  // Auto-flush logs on component unmount
  useEffect(() => {
    return () => {
      console.log(`[unmount] Component unmounting, flushing remaining logs...`);
      if (pendingChangesRef.current.length > 0 && openFile?.id) {
        const batch = [...pendingChangesRef.current];
        pendingChangesRef.current = [];
        inventoryService
          .saveLogs({ fileId: openFile.id, changes: batch })
          .catch((err) => {
            console.error(`❌ Failed to flush logs on unmount:`, err);
          });
      }
    };
  }, [openFile?.id]);

  // ── Upload modal ──────────────────────────────────────────────
  const UploadModal = () => {
    const [file, setFile] = useState(null);
    const [dept, setDept] = useState("");
    const [name, setName] = useState("");
    const [uploading, setUploading] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      if (!file || !dept) return;
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("departmentName", dept);
      if (name) fd.append("fileName", name);
      try {
        await inventoryService.uploadFile(fd);
        showToast("Upload thành công!");
        setShowUpload(false);
        fetchFiles();
      } catch {
        showToast("Upload thất bại", "error");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-slate-800">
              Upload File Excel/CSV
            </h3>
            <button
              onClick={() => setShowUpload(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                File (.xlsx / .csv) *
              </label>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phòng ban *
              </label>
              <input
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="VD: Phòng TC-HC"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên hiển thị
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Để trống → dùng tên file gốc"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {uploading ? "Đang upload…" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ── Edit metadata modal ───────────────────────────────────────
  const EditMetaModal = () => {
    const [name, setName] = useState(editTarget?.fileName || "");
    const [dept, setDept] = useState(editTarget?.departmentName || "");
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        await inventoryService.updateFileMeta(editTarget.id, {
          fileName: name,
          departmentName: dept,
        });
        showToast("Đã cập nhật!");
        setShowEditMeta(false);
        fetchFiles();
      } catch {
        showToast("Cập nhật thất bại", "error");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-slate-800">
              Chỉnh sửa thông tin
            </h3>
            <button
              onClick={() => setShowEditMeta(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên file
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phòng ban
              </label>
              <input
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditMeta(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ── Logs panel ────────────────────────────────────────────────
  const LogsPanel = () => (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History size={18} className="text-indigo-500" /> Lịch sử thay đổi —{" "}
            {openFile?.fileName}
          </h3>
          <button
            onClick={() => setShowLogs(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {logs.length === 0 && (
            <p className="text-center text-slate-400 py-8 text-sm">
              Chưa có lịch sử thay đổi
            </p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="bg-slate-50 rounded-xl p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">
                  {log.changedByFullName || log.changedBy}
                </span>
                <span className="text-slate-400 text-xs">
                  {fmt(log.createdAt)}
                </span>
              </div>
              <div className="text-slate-500 text-xs mb-1">
                {log.sheetName} · {log.cellAddress}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">
                  {log.oldValue ?? "trống"}
                </span>
                <span className="text-slate-400">→</span>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  {log.newValue ?? "trống"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-slate-100">
          <button
            onClick={() => loadMoreLogs(logPage - 1)}
            disabled={logPage === 0}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-500">
            Trang {logPage + 1} / {Math.max(logTotal, 1)}
          </span>
          <button
            onClick={() => loadMoreLogs(logPage + 1)}
            disabled={logPage >= logTotal - 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Sheet viewer ──────────────────────────────────────────────
  if (openFile) {
    return (
      <div className="flex flex-col h-full">
        {/* Sheet toolbar */}
        <div className="flex items-center gap-3 pb-4 flex-wrap">
          <button
            onClick={closeSheet}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={16} /> Quay lại
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 truncate">
              {openFile.fileName}
            </h2>
            <p className="text-xs text-slate-400">
              {openFile.departmentName} · Cập nhật: {fmt(openFile.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openLogs(openFile.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              <History size={15} /> Lịch sử
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save size={15} /> {saving ? "Đang lưu…" : "Lưu thay đổi"}
                {dirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {sheetLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Đang tải file…</p>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-white"
            style={{ minHeight: 0 }}
          >
            {luckyData && (
              <Workbook
                data={luckyData}
                onChange={canEdit ? handleSheetChange : undefined}
                showToolbar={canEdit}
                showFormulaBar={canEdit}
                showSheetTabs
                allowEdit={canEdit}
                style={{ width: "100%", height: "100%" }}
              />
            )}
          </div>
        )}

        {showLogs && <LogsPanel />}
      </div>
    );
  }

  // ── File list view ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-500" size={26} />
            Quản lý Tài sản Phòng ban
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            File Excel / CSV theo từng phòng ban
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
          >
            <Plus size={16} /> Upload file
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo tên file…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
        <div className="relative">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              setPage(0);
            }}
            className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none min-w-[180px]"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse"
            >
              <div className="h-4 bg-slate-100 rounded mb-3 w-3/4" />
              <div className="h-3 bg-slate-100 rounded mb-2 w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có file nào</p>
          <p className="text-sm mt-1">Upload file Excel/CSV để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all cursor-pointer group"
              onClick={() => openSheet(file)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  <FileSpreadsheet size={22} className="text-indigo-500" />
                </div>
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openLogs(file.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    title="Lịch sử"
                  >
                    <History size={15} />
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTarget(file);
                          setShowEditMeta(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        title="Sửa tên"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(file.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-1">
                {file.fileName}
              </h3>
              <p className="text-xs text-indigo-600 font-medium mb-2">
                {file.departmentName}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-semibold">{file.fileType}</span>
                <span>{formatBytes(file.fileSize)}</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                {fmt(file.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-600 font-medium">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showUpload && <UploadModal />}
      {showEditMeta && editTarget && <EditMetaModal />}
      {showLogs && openFile && <LogsPanel />}
    </div>
  );
}
