# Tóm tắt API Hệ thống Quản lý Mượn/Trả Vật phẩm (Borrow & Return) Độc Lập

Module này hoạt động hoàn toàn độc lập với `Material`, có hệ thống quản lý vật phẩm (`BorrowItem`) và Dashboard riêng biệt.

---

## I. Quản Lý Vật Phẩm Cho Mượn (`BorrowItem`)

### 1. Thêm vật phẩm mới (Nhập kho)
- **Endpoint:** `POST /api/borrow-items`
- **Mô tả:** Thêm một vật phẩm mới vào kho mượn. Số lượng khả dụng sẽ tự động bằng với tổng số lượng ban đầu.
- **Request Body:**
  ```json
  {
    "name": "Laptop Dell",
    "category": "Thiết bị IT",
    "description": "Core i7, 16GB RAM",
    "unit": "Cái",
    "totalQuantity": 10,
    "createdBy": "admin"
  }
  ```
- **Response:** Thông tin `BorrowItem` vừa tạo.

### 2. Cập nhật vật phẩm
- **Endpoint:** `PUT /api/borrow-items/{id}`
- **Mô tả:** Cập nhật thông tin. Nếu đổi `totalQuantity`, hệ thống tự động bù trừ vào `availableQuantity`.

### 3. Lấy danh sách vật phẩm (Có phân trang & lọc)
- **Endpoint:** `GET /api/borrow-items`
- **Query Params:** `page`, `size`, `keyword` (Tên), `category` (Danh mục).

### 4. Xóa vật phẩm
- **Endpoint:** `DELETE /api/borrow-items/{id}`

---

## II. Quy Trình Mượn/Trả Vật Phẩm (`BorrowTicket`)

### 1. Người dùng Tạo phiếu mượn (Gửi yêu cầu)
- **Endpoint:** `POST /api/borrow-return/create`
- **Mô tả:** Người dùng gửi yêu cầu. Trạng thái phiếu là `PENDING`. Hệ thống gửi email xác nhận.
- **Request Body (`BorrowRequestDTO`):**
  ```json
  {
    "items": [
      {
        "itemId": 1,
        "itemName": "Laptop Dell",
        "quantity": 1
      }
    ],
    "borrowerName": "Nguyễn Văn A",
    "department": "IT",
    "email": "nguyenvana@example.com",
    "borrowDate": "2026-05-10",
    "expectedReturnDate": "2026-05-15"
  }
  ```

### 2. Admin Duyệt đơn
- **Endpoint:** `PUT /api/borrow-return/{id}/approve`
- **Mô tả:** Duyệt đơn -> Trừ `availableQuantity` của vật phẩm -> Đổi trạng thái thành `BORROWED` -> Gửi email kèm QR Code.

### 3. Admin Từ chối đơn
- **Endpoint:** `PUT /api/borrow-return/{id}/reject?reason={reason}`
- **Mô tả:** Đổi trạng thái thành `REJECTED` -> Gửi email báo lỗi.

### 4. Quét mã QR trả đồ
- **Endpoint:** `GET /api/borrow-return/scan-return/{returnCode}`
- **Mô tả:** Thủ kho quét QR lấy thông tin phiếu.

### 5. Thủ kho Xác nhận trả đồ (Qua QR)
- **Endpoint:** `POST /api/borrow-return/confirm-return`
- **Mô tả:** Nhận danh sách tình trạng trả của từng vật phẩm.
- **Request Body:**
  ```json
  {
    "returnCode": "T-ABCDEFGH",
    "generalNote": "Người mượn làm rơi balo",
    "items": [
      {
        "itemId": 1,
        "returnedQuantity": 1,
        "brokenQuantity": 0,
        "conditionNote": "Bình thường"
      }
    ]
  }
  ```

### 5.1. Thủ kho Xác nhận trả đồ (Thủ công không cần QR)
- **Endpoint:** `POST /api/borrow-return/{id}/return-manual`
- **Mô tả:** Dùng ID của phiếu mượn thay vì QR code.
- **Request Body:** (Giống hệt ở trên nhưng không cần trường `returnCode`)

### 6. Xử lý đồ trả thiếu/hỏng (`resolve-incomplete`)
- **Endpoint:** `PUT /api/borrow-return/resolve-incomplete/{id}`
- **Mô tả:** Khi người dùng đền bù đủ, admin gọi API này để chuyển phiếu thành `RETURNED` và cộng lại `availableQuantity`.

### 7. Xem lịch sử phiếu & Xóa phiếu
- **GET /api/borrow-return/all**: Lọc phiếu mượn.
- **PUT /api/borrow-return/{id}**: Sửa phiếu thủ công.
- **DELETE /api/borrow-return/{id}**: Xóa phiếu.

---

## III. Chức Năng Dành Cho Người Dùng (`UserBorrowController`)

### 1. Xem Dashboard cá nhân
- **Endpoint:** `GET /api/borrow-return/user/dashboard?email={email}`
- **Mô tả:** Xem nhanh số lần mượn, số đồ đang cầm, số lần quá hạn.
- **Response:**
  ```json
  {
    "totalBorrows": 5,
    "holdingItems": 2,
    "overdueCount": 0
  }
  ```

### 2. Xem lịch sử mượn trả
- **Endpoint:** `GET /api/borrow-return/user/history`
- **Query Params:** `email` (Bắt buộc), `status` (Tùy chọn), `page`, `size`
- **Mô tả:** Lấy danh sách phiếu mượn trả của chính người dùng đó.

---

## IV. Dashboard Thống Kê & Quản Trị (`BorrowDashboard`)

### 1. Lấy chỉ số KPIs nhanh
- **Endpoint:** `GET /api/borrow-dashboard/kpis`
- **Mô tả:** Lấy thông số tổng quan cho trang quản trị.
- **Response:**
  ```json
  {
    "totalItems": 100,
    "availableItems": 85,
    "borrowedItems": 15,
    "pendingTickets": 5,
    "overdueTickets": 2
  }
  ```

### 2. Danh sách xử lý nhanh
- **Endpoint:** `GET /api/borrow-dashboard/quick-lists`
- **Mô tả:** Trả về Top 5 đơn chờ duyệt, Top các đơn quá hạn, và các vật phẩm sắp hết hàng (`availableQuantity` < 3).

---

## V. Tính Năng Email (Tự động & Thủ công)

### 1. Hệ thống tự động
- Tự động gửi Email khi tạo đơn (PENDING), được duyệt (kèm QR), bị từ chối, và trả đồ.
- **Tự động nhắc nhở quá hạn:** Hệ thống chạy ngầm mỗi ngày lúc 8:00 sáng để gửi email nhắc nhở những người giữ đồ mượn quá 7 ngày.

### 2. Gửi Email thủ công (Dành cho Admin)
- **Endpoint:** `POST /api/borrow-return/send-email`
- **Mô tả:** Gửi một thông báo tùy chỉnh đến nhiều người dùng.
- **Request Body:**
  ```json
  {
    "toEmails": ["user1@gmail.com", "user2@gmail.com"],
    "subject": "Nhắc nhở thu hồi thiết bị",
    "content": "Vui lòng hoàn trả các thiết bị đã mượn trước ngày 30/05."
  }
  ```
