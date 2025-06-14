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

### 1. Clone repository
```bash
git clone <repository-url>
cd quan-ly-khoa-hoc
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
```bash
# Copy file cấu hình mẫu
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Chỉnh sửa các biến môi trường theo môi trường của bạn
```

### 4. Chạy dự án
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng lẻ
npm run dev:backend
npm run dev:frontend
```

### 5. Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests ở watch mode
npm run test:watch
```

## 📚 Tài liệu API

API documentation được tạo tự động bằng Swagger và có thể truy cập tại:
- Development: http://localhost:5000/api-docs
- Production: [URL production]/api-docs

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

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Liên hệ

- Email: [your-email@example.com]
- GitHub: [your-github-username]

---

⭐ Nếu dự án này hữu ích, hãy cho chúng tôi một star!
