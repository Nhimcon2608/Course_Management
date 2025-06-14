# 🚀 Hướng dẫn Deploy Course Management System MIỄN PHÍ

## 📋 Tổng quan
- **Frontend**: Vercel (miễn phí)
- **Backend**: Render (miễn phí)
- **Database**: MongoDB Atlas (miễn phí 512MB)
- **File Storage**: Cloudinary (miễn phí)

## 🎯 Bước 1: Chuẩn bị GitHub Repository

### 1.1 Push code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/course-management-system.git
git push -u origin main
```

## 🗄️ Bước 2: Setup MongoDB Atlas (Database miễn phí)

### 2.1 Tạo tài khoản MongoDB Atlas
1. Truy cập: https://www.mongodb.com/atlas
2. Đăng ký tài khoản miễn phí
3. Tạo cluster mới (chọn FREE tier)
4. Chọn region gần nhất (Singapore cho VN)

### 2.2 Cấu hình Database
1. **Database Access**: Tạo user với username/password
2. **Network Access**: Thêm IP `0.0.0.0/0` (allow all)
3. **Connect**: Copy connection string
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/quan-ly-khoa-hoc?retryWrites=true&w=majority
   ```

## 🖼️ Bước 3: Setup Cloudinary (File Storage miễn phí)

### 3.1 Tạo tài khoản Cloudinary
1. Truy cập: https://cloudinary.com
2. Đăng ký tài khoản miễn phí
3. Lấy thông tin:
   - Cloud Name
   - API Key
   - API Secret

## 🔧 Bước 4: Deploy Backend lên Render

### 4.1 Tạo tài khoản Render
1. Truy cập: https://render.com
2. Đăng ký bằng GitHub account

### 4.2 Deploy Backend
1. **New Web Service** → Connect GitHub repo
2. **Settings**:
   - Name: `course-management-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Plan: `Free`

### 4.3 Environment Variables
Thêm các biến môi trường sau:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/quan-ly-khoa-hoc?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-production-256-bit
JWT_REFRESH_SECRET=your-super-secret-refresh-key-production-256-bit
FRONTEND_URL=https://your-frontend-url.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=hoctap435@gmail.com
EMAIL_PASS=txfj zhdj hurf lqes
EMAIL_FROM_NAME=Course Management System
ZALOPAY_APP_ID=2553
ZALOPAY_KEY1=PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL
ZALOPAY_KEY2=kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn
ZALOPAY_CALLBACK_URL=http://localhost:5000/api/orders/zalopay/callback
ZALOPAY_RETURN_URL=http://localhost:3000/orders/payment-result
CLOUDINARY_CLOUD_NAME=dxxx7dbce
CLOUDINARY_API_KEY=844713346936173
CLOUDINARY_API_SECRET=5xizS20eZaP0U1Z5gwcjvx3INMY
```

## 🌐 Bước 5: Deploy Frontend lên Vercel

### 5.1 Tạo tài khoản Vercel
1. Truy cập: https://vercel.com
2. Đăng ký bằng GitHub account

### 5.2 Deploy Frontend
1. **New Project** → Import GitHub repo
2. **Framework Preset**: Next.js
3. **Root Directory**: `frontend`

### 5.3 Environment Variables
Thêm các biến môi trường sau:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
NEXT_PUBLIC_APP_NAME=Course Management System
NEXT_PUBLIC_APP_URL=https://your-frontend-url.vercel.app
```

## 🔄 Bước 6: Cập nhật URLs

### 6.1 Sau khi deploy xong
1. **Backend URL**: `https://course-management-backend.onrender.com`
2. **Frontend URL**: `https://course-management-frontend.vercel.app`

### 6.2 Cập nhật lại Environment Variables
- Cập nhật `FRONTEND_URL` trong Render
- Cập nhật `NEXT_PUBLIC_API_URL` trong Vercel
- Cập nhật `ZALOPAY_CALLBACK_URL` và `ZALOPAY_RETURN_URL`

## 🌱 Bước 7: Seed Database

### 7.1 Chạy seed script
Sau khi backend deploy thành công, truy cập:
```
https://your-backend-url.onrender.com/api/admin/seed-database
```

## ✅ Bước 8: Kiểm tra

### 8.1 Test các chức năng
1. **Frontend**: https://your-frontend-url.vercel.app
2. **API Docs**: https://your-backend-url.onrender.com/api-docs
3. **Health Check**: https://your-backend-url.onrender.com/health

### 8.2 Test tài khoản
- **Admin**: admin@example.com / 123456
- **Instructor**: instructor@example.com / 123456
- **Student**: student@example.com / 123456

## 🚨 Lưu ý quan trọng

### Free Tier Limitations:
1. **Render**: Service ngủ sau 15 phút không hoạt động
2. **Vercel**: 100GB bandwidth/tháng
3. **MongoDB Atlas**: 512MB storage
4. **Cloudinary**: 25 credits/tháng

### Tips tối ưu:
1. Sử dụng Cloudinary cho images thay vì local storage
2. Implement caching để giảm database calls
3. Optimize images và assets

## 🔧 Troubleshooting

### Lỗi thường gặp:
1. **CORS Error**: Kiểm tra FRONTEND_URL trong backend
2. **Database Connection**: Kiểm tra MongoDB URI và network access
3. **Build Failed**: Kiểm tra dependencies và build commands
4. **Environment Variables**: Đảm bảo tất cả variables được set đúng

## 📞 Hỗ trợ
Nếu gặp vấn đề, hãy kiểm tra logs trong:
- Render Dashboard → Service → Logs
- Vercel Dashboard → Project → Functions → Logs
