# 🚀 Course Management System - Deployment Guide

## 📋 Overview

This guide will help you deploy the Course Management System to:
- **Backend**: Render (Free tier)
- **Frontend**: Vercel (Free tier)
- **Database**: MongoDB Atlas (Free tier)

## 🗂️ Project Structure

```
course-management-system/
├── backend/          # Node.js + Express + TypeScript
├── frontend/         # Next.js + React + TypeScript
├── vercel.json       # Vercel configuration
├── render.yaml       # Render configuration
└── .env.production   # Production environment variables
```

## 🔧 Prerequisites

1. **GitHub Account** - Repository is already set up
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Render Account** - Sign up at [render.com](https://render.com)
4. **MongoDB Atlas** - Database is already configured

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `NTVuong23/course-management-system`
   - Configure service:
     - **Name**: `course-management-backend-ntvuong23`
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install && npm run build`
     - **Start Command**: `cd backend && npm start`

3. **Environment Variables** (Auto-configured from render.yaml):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://vuong20032604:***@quan-ly-khoa-hoc.vrjhyzv.mongodb.net/quan-ly-khoa-hoc
   JWT_SECRET=your-super-secret-jwt-key-production-256-bit
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-production-256-bit
   JWT_REFRESH_EXPIRES_IN=30d
   FRONTEND_URL=https://course-management-system-ntvuong23.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=hoctap435@gmail.com
   EMAIL_PASS=txfj zhdj hurf lqes
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note the URL: `https://course-management-backend-ntvuong23.onrender.com`

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "New Project"
   - Import `NTVuong23/course-management-system`
   - Configure project:
     - **Project Name**: `course-management-system-ntvuong23`
     - **Framework**: Next.js (auto-detected)
     - **Root Directory**: `frontend`

3. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://course-management-backend-ntvuong23.onrender.com/api
   NEXT_PUBLIC_APP_NAME=Course Management System
   NEXT_PUBLIC_APP_URL=https://course-management-system-ntvuong23.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (3-5 minutes)
   - Note the URL: `https://course-management-system-ntvuong23.vercel.app`

## 🔗 URLs

After successful deployment:

- **Frontend**: https://course-management-system-ntvuong23.vercel.app
- **Backend API**: https://course-management-backend-ntvuong23.onrender.com/api
- **API Documentation**: https://course-management-backend-ntvuong23.onrender.com/api-docs

## 🧪 Test Accounts

```
Admin:
Email: admin@coursemanagement.com
Password: 123456

Instructor:
Email: nguyenvanan@gmail.com
Password: 123456

Student:
Email: student1@gmail.com
Password: 123456
```

## 🔍 Verification Steps

1. **Backend Health Check**:
   ```bash
   curl https://course-management-backend-ntvuong23.onrender.com/api/health
   ```

2. **Frontend Access**:
   - Visit: https://course-management-system-ntvuong23.vercel.app
   - Try login with test accounts

3. **Database Connection**:
   - Login to admin account
   - Check dashboard for data

## 🐛 Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify environment variables
- Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0

### Frontend Issues
- Check Vercel function logs
- Verify API URL in environment variables
- Check browser console for errors

### Database Issues
- Verify MongoDB Atlas connection string
- Check network access settings
- Ensure database user has proper permissions

## 📊 Monitoring

- **Render**: Monitor backend performance and logs
- **Vercel**: Monitor frontend performance and function logs
- **MongoDB Atlas**: Monitor database performance and connections

## 🔄 Updates

To update the deployment:

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```

2. **Auto-deployment**:
   - Vercel: Auto-deploys on push to main
   - Render: Auto-deploys on push to main

## 💰 Cost

All services used are **FREE**:
- **Render**: Free tier (750 hours/month)
- **Vercel**: Free tier (100GB bandwidth/month)
- **MongoDB Atlas**: Free tier (512MB storage)

## 🎉 Success!

Your Course Management System is now live and accessible worldwide!

Visit: https://course-management-system-ntvuong23.vercel.app
