@echo off
REM 🚀 Script tự động deploy Course Management System miễn phí cho Windows

echo 🚀 Chuẩn bị deploy Course Management System miễn phí...

REM Kiểm tra Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js >= 18.
    pause
    exit /b 1
)

REM Kiểm tra npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm chưa được cài đặt.
    pause
    exit /b 1
)

echo ✅ Môi trường phát triển OK

REM Build và test dự án
echo 🔨 Building dự án...

REM Install dependencies
echo 📦 Cài đặt dependencies...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed
    pause
    exit /b 1
)

REM Build backend
echo 🔧 Building backend...
cd backend
call npm run build
if errorlevel 1 (
    echo ❌ Backend build failed
    cd ..
    pause
    exit /b 1
)
cd ..

REM Build frontend
echo 🎨 Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Build thành công!

REM Kiểm tra Git repository
if not exist .git (
    echo 🔧 Khởi tạo Git repository...
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo ✅ Git repository đã được khởi tạo
    echo 📝 Tiếp theo:
    echo    1. Tạo repository trên GitHub
    echo    2. Chạy: git remote add origin https://github.com/yourusername/course-management-system.git
    echo    3. Chạy: git push -u origin main
) else (
    echo ✅ Git repository đã tồn tại
    echo 📝 Đừng quên push code lên GitHub:
    echo    git add .
    echo    git commit -m "Prepare for deployment"
    echo    git push
)

echo.
echo 🎉 Dự án đã sẵn sàng deploy!
echo.
echo 📋 Các bước tiếp theo:
echo 1. 📚 Đọc hướng dẫn chi tiết trong deployment-guide.md
echo 2. 🗄️  Tạo MongoDB Atlas database (miễn phí)
echo 3. 🖼️  Tạo Cloudinary account (miễn phí)
echo 4. 🔧 Deploy backend lên Render (miễn phí)
echo 5. 🌐 Deploy frontend lên Vercel (miễn phí)
echo.
echo 💡 Tổng chi phí: 0đ (hoàn toàn miễn phí!)

pause
