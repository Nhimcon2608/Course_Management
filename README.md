# 🎓 Hệ thống Quản lý và Thị trường Khóa học

Một hệ thống thị trường khóa học trực tuyến hoàn chỉnh được xây dựng với Next.js, Node.js, và MongoDB.

## 🏗️ Kiến trúc hệ thống

```
quan-ly-khoa-hoc/
├── frontend/          # Next.js + React + TypeScript
├── backend/           # Node.js + Express + MongoDB
├── docs/             # Tài liệu API và hướng dẫn
└── shared/           # Code và types dùng chung
```

## 🚀 Công nghệ sử dụng

### Frontend
- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **Zustand** - State management
- **React Query** - Server state management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Joi** - Data validation

### DevOps & Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Swagger** - API documentation
- **Docker** - Containerization

## 📋 Tính năng chính

### 👨‍🎓 Dành cho học viên
- ✅ Đăng ký/Đăng nhập
- ✅ Duyệt catalog khóa học
- ✅ Tìm kiếm và lọc khóa học
- ✅ Giỏ hàng và thanh toán
- ✅ Dashboard cá nhân
- ✅ Theo dõi tiến độ học tập

### 👨‍💼 Dành cho quản trị viên
- ✅ Quản lý khóa học (CRUD)
- ✅ Quản lý danh mục
- ✅ Quản lý người dùng
- ✅ Thống kê và báo cáo
- ✅ Quản lý đơn hàng

## 🛠️ Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0

### IDE và công cụ phát triển đề xuất

#### IDE và Extensions
- **Visual Studio Code** - IDE đề xuất với các extensions:
  - ESLint - Kiểm tra lỗi code
  - Prettier - Format code
  - Tailwind CSS IntelliSense - Gợi ý class Tailwind
  - MongoDB for VS Code - Quản lý MongoDB
  - Thunder Client/Postman - Test API
  - GitLens - Tích hợp Git nâng cao

#### Công cụ phát triển
- **MongoDB Compass** - GUI cho MongoDB
- **Docker Desktop** - Nếu sử dụng Docker
- **Git** - Quản lý phiên bản

#### Cài đặt TypeScript và các công cụ toàn cục
```bash
# Cài đặt TypeScript toàn cục
npm install -g typescript

# Cài đặt ts-node để chạy TypeScript trực tiếp
npm install -g ts-node

# Cài đặt nodemon để tự động khởi động lại server khi có thay đổi
npm install -g nodemon
```

### 1. Cài đặt và cấu hình môi trường

#### Cài đặt MongoDB
```bash
# Windows: Tải và cài đặt MongoDB Community Server từ trang chủ
# https://www.mongodb.com/try/download/community

# Hoặc sử dụng Docker
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

#### Cấu hình môi trường
```bash
# Tạo file .env từ file mẫu
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Chỉnh sửa các biến môi trường theo cấu hình của bạn
```

### 2. Cài đặt dependencies
```bash
# Cài đặt dependencies cho cả project
npm install

# Hoặc cài đặt riêng cho từng phần
cd frontend && npm install
cd backend && npm install
```

### 3. Chạy dự án
```bash
# Chạy cả frontend và backend từ thư mục gốc
npm run dev

# Hoặc chạy riêng lẻ
npm run dev:backend
npm run dev:frontend
```

### 4. Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 🌱 Seed dữ liệu

Cấu hình `MONGODB_URI` trong file `.env` (mặc định: `mongodb://localhost:27017/quan-ly-khoa-hoc`)

### Các lệnh seed dữ liệu

```bash
# Di chuyển vào thư mục backend
cd backend

# Seed dữ liệu cơ bản (users, categories, courses)
npm run seed

# Seed dữ liệu mở rộng (reviews, orders, progress)
npm run seed:extended

# Seed mã giảm giá
npm run seed:coupons

# Seed tất cả dữ liệu cùng lúc
npm run seed:all

# Seed dữ liệu trong môi trường development
npm run seed:dev
```

### Dữ liệu được tạo

- **Users**: Admin, giảng viên và học viên với mật khẩu mặc định `123456`
- **Categories**: Các danh mục khóa học
- **Courses**: Các khóa học mẫu với nội dung, giá cả và thông tin chi tiết
- **Reviews**: Đánh giá mẫu cho các khóa học
- **Orders**: Đơn hàng mẫu
- **Progress**: Tiến độ học tập mẫu
- **Coupons**: Mã giảm giá mẫu

### Migrate dữ liệu

Nếu cần migrate dữ liệu wishlist từ cấu trúc cũ sang cấu trúc mới:

```bash
npm run migrate:wishlist
```

## 📚 Tài liệu và tham khảo

### Tài liệu API

API documentation được tạo tự động bằng Swagger và có thể truy cập tại:
- Development: http://localhost:5000/api-docs
- Production: [URL production]/api-docs

### Tài liệu framework và thư viện

#### Frontend
- [Next.js Documentation](https://nextjs.org/docs) - Framework React
- [React Documentation](https://reactjs.org/docs/getting-started.html) - Thư viện UI
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - JavaScript với kiểu dữ liệu
- [Tailwind CSS](https://tailwindcss.com/docs) - Framework CSS
- [React Query](https://tanstack.com/query/latest/docs/react/overview) - Quản lý state từ server
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) - Quản lý state
- [React Hook Form](https://react-hook-form.com/get-started) - Quản lý form

#### Backend
- [Node.js Documentation](https://nodejs.org/en/docs/) - Runtime JavaScript
- [Express.js Documentation](https://expressjs.com/) - Web framework
- [MongoDB Documentation](https://docs.mongodb.com/) - Cơ sở dữ liệu NoSQL
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html) - ODM cho MongoDB
- [JWT](https://jwt.io/introduction/) - JSON Web Token
- [Swagger](https://swagger.io/docs/) - API Documentation

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up -d
```

## 📁 Cấu trúc dự án chi tiết

```
quan-ly-khoa-hoc/
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities và configurations
│   │   ├── store/         # State management
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   └── config/        # Configuration files
│   ├── tests/             # Test files
│   └── package.json
└── docs/                  # Documentation
```

