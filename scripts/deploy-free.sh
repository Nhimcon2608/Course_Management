#!/bin/bash

# 🚀 Script tự động deploy Course Management System miễn phí
# Chạy script này để chuẩn bị deploy

echo "🚀 Chuẩn bị deploy Course Management System miễn phí..."

# Kiểm tra Git
if ! command -v git &> /dev/null; then
    echo "❌ Git chưa được cài đặt. Vui lòng cài đặt Git trước."
    exit 1
fi

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js >= 18."
    exit 1
fi

# Kiểm tra npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm chưa được cài đặt."
    exit 1
fi

echo "✅ Môi trường phát triển OK"

# Build và test dự án
echo "🔨 Building dự án..."

# Install dependencies
echo "📦 Cài đặt dependencies..."
npm install

# Build backend
echo "🔧 Building backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo "✅ Build thành công!"

# Tạo .gitignore nếu chưa có
if [ ! -f .gitignore ]; then
    echo "📝 Tạo .gitignore..."
    cat > .gitignore << EOL
# Dependencies
node_modules/
*/node_modules/

# Production builds
backend/dist/
frontend/.next/
frontend/out/

# Environment variables
.env
.env.local
.env.production
.env.development
backend/.env
frontend/.env.local

# Logs
logs/
*.log
npm-debug.log*
backend/logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Uploads
backend/uploads/
uploads/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
EOL
fi

# Kiểm tra Git repository
if [ ! -d .git ]; then
    echo "🔧 Khởi tạo Git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git repository đã được khởi tạo"
    echo "📝 Tiếp theo:"
    echo "   1. Tạo repository trên GitHub"
    echo "   2. Chạy: git remote add origin https://github.com/yourusername/course-management-system.git"
    echo "   3. Chạy: git push -u origin main"
else
    echo "✅ Git repository đã tồn tại"
    echo "📝 Đừng quên push code lên GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    echo "   git push"
fi

echo ""
echo "🎉 Dự án đã sẵn sàng deploy!"
echo ""
echo "📋 Các bước tiếp theo:"
echo "1. 📚 Đọc hướng dẫn chi tiết trong deployment-guide.md"
echo "2. 🗄️  Tạo MongoDB Atlas database (miễn phí)"
echo "3. 🖼️  Tạo Cloudinary account (miễn phí)"
echo "4. 🔧 Deploy backend lên Render (miễn phí)"
echo "5. 🌐 Deploy frontend lên Vercel (miễn phí)"
echo ""
echo "💡 Tổng chi phí: 0đ (hoàn toàn miễn phí!)"
