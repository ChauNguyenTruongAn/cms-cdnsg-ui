

## 1. Mục tiêu triển khai
* **Giao diện:** Xây dựng màn hình tương tác file Excel/CSV ngay trên trình duyệt, không cần tải về máy.
* **Phân quyền:** ADMIN/MANAGER upload và chỉnh sửa file, USER chỉ xem. File được quản lý theo phòng ban (Department-based).
* **Tính năng:** Chỉnh sửa ô, thêm/xóa hàng cột, lọc dữ liệu (Filter) và định dạng cơ bản.
* **Tính minh bạch (Logs):** Ghi lại chi tiết mọi thay đổi: ai sửa, sửa lúc nào, giá trị cũ và giá trị mới, thuộc sheet nào.
* **Lưu trữ:** Tích hợp Cloudinary để quản lý file vật lý và Database để quản lý Metadata/Logs.

---

## 2. Công nghệ sử dụng (Miễn phí)
* **Frontend:** ReactJS, [FortuneSheet](https://github.com/ruilisi/fortunesheet) (Excel UI), [SheetJS](https://sheetjs.com/) (Xử lý file).
* **Backend:** Spring Boot (Java), Spring Data JPA.
* **Database:** MySQL (Lưu Metadata và Logs).
* **Storage:** Cloudinary (Lưu trữ file `.xlsx` hoặc `.csv` với `resource_type: raw`).

---

## 3. Cấu trúc Database (ERD)

### 3.1. Bảng `inventory_files` (Quản lý Metadata)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | ID định danh file |
| `file_name` | String | Tên file hiển thị (VD: 1 - Phong TC-HC-01-2026) |
| `department_name` | String | Tên phòng ban sở hữu file |
| `cloudinary_url` | String | Public URL để fetch file (frontend dùng URL này) |
| `public_id` | String | ID nội bộ Cloudinary — **dùng để ghi đè / xóa** (không expose ra ngoài) |
| `file_size` | Long | Kích thước bytes |
| `file_type` | String | `xlsx` hoặc `csv` |
| `created_by` | String | Email người tạo (từ JWT) |
| `created_at` | Timestamp | Thời điểm upload lần đầu |
| `updated_at` | Timestamp | Lần cuối cập nhật nội dung |
| `deleted` | Boolean | Xóa mềm — file bị xóa vẫn còn trong DB |

### 3.2. Bảng `inventory_logs` (Lưu lịch sử thay đổi)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | ID định danh log |
| `file_id` | Long (FK) | Liên kết với bảng `inventory_files` |
| `sheet_name` | String | **Tên sheet** trong file Excel (VD: Sheet1, Tháng 5) |
| `cell_address` | String | Vị trí ô chuẩn Excel (VD: A5, B10) |
| `old_value` | Text | Giá trị trước khi sửa (null nếu nhập lần đầu) |
| `new_value` | Text | Giá trị sau khi sửa |
| `changed_by` | String | Email người thực hiện (từ JWT) |
| `changed_by_full_name` | String | Tên đầy đủ để hiển thị nhanh |
| `created_at` | Timestamp | Thời điểm thay đổi (ghi phía server) |

---

## 4. API Backend (Base URL: `/api/inventory`)

> **Auth:** Tất cả API đều yêu cầu Bearer Token trong header `Authorization`.

### 4.1. File APIs

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/files` | USER/MANAGER/ADMIN | Danh sách file (phân trang, lọc) |
| `GET` | `/files/{id}` | USER/MANAGER/ADMIN | Chi tiết metadata 1 file |
| `POST` | `/files` | MANAGER/ADMIN | Upload file mới |
| `POST` | `/files/{id}/overwrite` | MANAGER/ADMIN | Ghi đè file sau khi chỉnh sửa |
| `PATCH` | `/files/{id}` | MANAGER/ADMIN | Sửa tên / phòng ban (metadata only) |
| `DELETE` | `/files/{id}` | ADMIN | Xóa file |
| `GET` | `/departments` | USER/MANAGER/ADMIN | Danh sách phòng ban phân biệt |

### 4.2. Log APIs

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/logs` | MANAGER/ADMIN | Lưu batch thay đổi ô |
| `GET` | `/files/{fileId}/logs` | USER/MANAGER/ADMIN | Xem lịch sử thay đổi của file |

---

## 5. Chi tiết từng API

### `GET /api/inventory/files`
**Query params:**
| Param | Type | Default | Mô tả |
| :--- | :--- | :--- | :--- |
| `department` | string | — | Lọc theo tên phòng ban (exact match, không phân biệt hoa thường) |
| `keyword` | string | — | Tìm kiếm trong `fileName` (LIKE) |
| `page` | int | `0` | Số trang (0-indexed) |
| `size` | int | `20` | Số item mỗi trang |

**Response (200):** `Page<InventoryFileResponse>` — xem cấu trúc ở mục 6.1

---

### `POST /api/inventory/files`
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Mô tả |
| :--- | :--- | :--- | :--- |
| `file` | File | ✅ | File `.xlsx` hoặc `.csv` |
| `departmentName` | string | ✅ | Tên phòng ban |
| `fileName` | string | ❌ | Tên hiển thị; nếu bỏ qua, dùng tên file gốc |

**Response (200):** `InventoryFileResponse`

---

### `POST /api/inventory/files/{id}/overwrite`
**Content-Type:** `multipart/form-data`

Gọi sau khi người dùng nhấn **"Lưu thay đổi"**: Frontend export file từ FortuneSheet → SheetJS → gửi Blob lên endpoint này.

| Field | Type | Required | Mô tả |
| :--- | :--- | :--- | :--- |
| `file` | File | ✅ | Blob Excel (`.xlsx`) xuất từ SheetJS |

**Response (200):** `InventoryFileResponse` với `updatedAt` mới nhất

---

### `POST /api/inventory/logs`
**Content-Type:** `application/json`

Lưu nhiều thay đổi ô cùng lúc (batch). **Frontend nên debounce 500ms** và gom nhiều thay đổi thành 1 request.

```json
{
  "fileId": 1,
  "changes": [
    {
      "sheetName": "Sheet1",
      "cellAddress": "A5",
      "oldValue": "Bàn cũ",
      "newValue": "Bàn mới"
    },
    {
      "sheetName": "Sheet1",
      "cellAddress": "B5",
      "oldValue": "10",
      "newValue": "12"
    }
  ]
}
```

**Response (200):** Không có body.

---

### `GET /api/inventory/files/{fileId}/logs`
**Query params:**
| Param | Type | Default | Mô tả |
| :--- | :--- | :--- | :--- |
| `changedBy` | string | — | Lọc theo email người sửa |
| `page` | int | `0` | Số trang |
| `size` | int | `50` | Số item mỗi trang |

**Response (200):** `Page<InventoryLog>`

---

## 6. Cấu trúc Response

### 6.1. `InventoryFileResponse`
```json
{
  "id": 1,
  "fileName": "1 - Phong TC-HC-01-2026",
  "departmentName": "Phòng TC-HC",
  "cloudinaryUrl": "https://res.cloudinary.com/.../inventory_files/abc.xlsx",
  "fileSize": 204800,
  "fileType": "xlsx",
  "createdBy": "manager@cdnsg.edu.vn",
  "createdAt": "2026-05-11T10:00:00",
  "updatedAt": "2026-05-11T14:30:00"
}
```

### 6.2. `InventoryLog`
```json
{
  "id": 42,
  "file": { "id": 1 },
  "sheetName": "Sheet1",
  "cellAddress": "A5",
  "oldValue": "Bàn cũ",
  "newValue": "Bàn mới",
  "changedBy": "manager@cdnsg.edu.vn",
  "changedByFullName": "Nguyễn Văn A",
  "createdAt": "2026-05-11T14:35:00"
}
```

---

## 7. Quy trình Frontend thực hiện

### Bước 1: Hiển thị danh sách file
```javascript
// Lấy danh sách phòng ban cho dropdown filter
const { data: departments } = await api.get('/api/inventory/departments');

// Lấy danh sách file theo filter
const { data } = await api.get('/api/inventory/files', {
  params: { department, keyword, page, size }
});
// Kết quả: data.content[], data.totalPages, data.totalElements
```

### Bước 2: Mở và hiển thị file
```javascript
// 1. Lấy metadata để có cloudinaryUrl
const { data: fileMeta } = await api.get(`/api/inventory/files/${fileId}`);

// 2. Fetch file Excel từ Cloudinary
//    QUAN TRỌNG: Dùng axios với responseType: 'arraybuffer', không dùng fetch thông thường
const response = await axios.get(fileMeta.cloudinaryUrl, {
  responseType: 'arraybuffer'
});

// 3. Parse bằng SheetJS
import * as XLSX from 'xlsx';
const workbook = XLSX.read(response.data, { type: 'array' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 4. Convert sang định dạng FortuneSheet hiểu
import { transformExcelToLucky } from './utils/sheetConverter'; // utility tự viết
const luckyData = transformExcelToLucky(workbook);

// 5. Render FortuneSheet
<Workbook data={luckyData} onChange={(data) => handleChange(data)} />
```

### Bước 3: Xử lý thay đổi ô (Log + Debounce)
```javascript
import { debounce } from 'lodash';

// Lưu tham chiếu dữ liệu cũ để so sánh
const prevDataRef = useRef(null);
const pendingChangesRef = useRef([]);

// Gửi batch log - debounce 500ms
const sendLogs = debounce(async () => {
  if (pendingChangesRef.current.length === 0) return;

  await api.post('/api/inventory/logs', {
    fileId: currentFileId,
    changes: pendingChangesRef.current
  });

  pendingChangesRef.current = []; // Reset sau khi gửi
}, 500);

// Handler khi FortuneSheet báo thay đổi
const handleChange = (newData) => {
  if (!prevDataRef.current) {
    prevDataRef.current = newData;
    return;
  }

  // So sánh để tìm ô bị thay đổi
  // newData[0].celldata[] chứa danh sách ô có giá trị
  // Tham khảo FortuneSheet docs để lấy chính xác event onCellUpdated

  // Tạm thời: push change vào pending
  pendingChangesRef.current.push({
    sheetName: newData[0].name || 'Sheet1',
    cellAddress: toCellAddress(row, col), // A1, B5...
    oldValue: oldVal,
    newValue: newVal
  });

  sendLogs(); // Debounced
  prevDataRef.current = newData;
};

// Helper: convert (row, col) → "A1" format
const toCellAddress = (row, col) => {
  const colLetter = String.fromCharCode(65 + col); // 0→A, 1→B...
  return `${colLetter}${row + 1}`;
};
```

### Bước 4: Lưu file (ghi đè)
```javascript
const handleSave = async () => {
  // 1. Export từ FortuneSheet ra JSON
  // Dùng luckyexcel hoặc tự convert luckyData → workbook XLSX

  // 2. Convert sang Blob
  const workbook = XLSX.utils.book_new();
  // ... thêm sheets từ lucky data
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  // 3. Gửi lên backend
  const formData = new FormData();
  formData.append('file', blob, 'file.xlsx');

  await api.post(`/api/inventory/files/${currentFileId}/overwrite`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  toast.success('Đã lưu thay đổi!');
};
```

---

## 8. Các mốc kiểm soát (Checklist đạt yêu cầu)

- [ ] **Mức độ 1:** Hiển thị được danh sách file theo từng phòng ban (gọi `GET /files?department=...`).
- [ ] **Mức độ 2:** Mở file trong ứng dụng và hiển thị đúng định dạng các cột.
- [ ] **Mức độ 3:** Sửa 1 ô → kiểm tra DB bảng `inventory_logs` có bản ghi mới với đúng `cell_address`, `old_value`, `new_value`.
- [ ] **Mức độ 4:** Thêm 1 cột mới → nhấn "Lưu" → `GET /files/{id}` thấy `updated_at` mới → mở lại file thấy cột vẫn còn.
- [ ] **Mức độ 5:** Tốc độ load file từ Cloudinary < 3 giây.
- [ ] **Mức độ 6:** Lọc log theo người sửa (`GET /files/{id}/logs?changedBy=email@...`).

---

## 9. Lưu ý kỹ thuật

* **Cloudinary & Excel:** File Excel phải upload với `resource_type: raw`. Dùng `image` hay `auto` sẽ bị lỗi.
* **CORS khi fetch Cloudinary URL:** URL Cloudinary là public, nhưng nếu fetch từ browser cần đảm bảo không bị block. Dùng `axios` với `responseType: 'arraybuffer'`.
* **Hiệu năng:** Nếu file > 5000 dòng, dùng Web Worker để parse file tránh treo UI.
* **Bảo mật:** Backend kiểm tra JWT ở mọi request. `publicId` Cloudinary không được expose ra response.
* **Debounce Log:** Dùng `debounce` 500ms trước khi gửi log, tránh spam khi user gõ từng phím.
* **Overwrite & Cache:** Backend dùng `invalidate: true` khi ghi đè — Cloudinary CDN sẽ làm mới cache ngay. Frontend không cần thêm cache-busting query string.
* **Xóa mềm:** File bị xóa vẫn còn trong DB (deleted=true), chỉ list API ẩn đi. Log vẫn được giữ.
