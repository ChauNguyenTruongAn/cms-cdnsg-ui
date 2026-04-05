import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Chọn --",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Đóng dropdown khi người dùng click ra ngoài khu vực của nó
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(""); // Reset từ khóa tìm kiếm khi đóng
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lấy ra option hiện tại đang được chọn
  const selectedOption = options.find((opt) => opt.value == value); // Dùng == để khớp cả chuỗi lẫn số

  // Lọc danh sách dựa trên từ khóa tìm kiếm
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Ô hiển thị kết quả đã chọn */}
      <div
        className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer flex justify-between items-center focus-within:ring-2 focus-within:ring-[#1a237e] transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`truncate pr-4 ${selectedOption ? "text-slate-800 font-medium" : "text-slate-400"}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Danh sách Dropdown xổ xuống */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Ô nhập từ khóa tìm kiếm */}
          <div className="p-3 border-b border-slate-100 flex items-center sticky top-0 bg-slate-50 rounded-t-xl">
            <Search size={16} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
              placeholder="Gõ tên vật tư để tìm nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Ngăn không cho sự kiện click đóng dropdown
              autoFocus // Tự động focus vào ô này khi mở lên
            />
          </div>

          {/* Danh sách kết quả */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`p-3 text-sm rounded-lg cursor-pointer transition-colors ${
                    value == opt.value
                      ? "bg-indigo-50 text-[#1a237e] font-bold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate-400 flex flex-col items-center">
                <Search size={24} className="mb-2 opacity-20" />
                Không tìm thấy vật tư nào khớp với "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
