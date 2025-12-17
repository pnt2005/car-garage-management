# 🚗 Car Garage Management  
**Hệ thống quản lý gara ô tô – Next.js Fullstack**

---

## 📖 Giới thiệu  

**Car Garage Management** là hệ thống quản lý gara ô tô giúp hỗ trợ các nghiệp vụ cơ bản trong quá trình tiếp nhận, sửa chữa và thanh toán cho khách hàng.  
Hệ thống được xây dựng theo mô hình **Fullstack với Next.js**, tích hợp cả **frontend và backend API** trong cùng một dự án, giúp triển khai và bảo trì dễ dàng.

Hệ thống hỗ trợ các chức năng chính:
- Tiếp nhận xe bảo trì, sửa chữa
- Lập phiếu sửa chữa
- Tra cứu thông tin xe
- Lập phiếu thu tiền
- Lập báo cáo doanh số
- Lập báo cáo tồn kho

---

## 🛠️ Công nghệ sử dụng  

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS

### Backend
- Next.js API Routes
- Prisma ORM
- MySQL

---

## ⚙️ Hướng dẫn cài đặt  

### 1️⃣ Clone project
```bash
git clone https://github.com/your-username/car-garage-management.git
cd car-garage-management
```

---

### 2️⃣ Cài đặt thư viện
```bash
npm install
```

---

### 3️⃣ Cấu hình môi trường
Tạo file `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/garage_db"
```

---

### 4️⃣ Khởi tạo database
```bash
npx prisma migrate dev
```

---

### 5️⃣ Chạy ứng dụng
```bash
npm run dev
```

📍 Ứng dụng chạy tại:  
```
http://localhost:3000
```
