# ULIS Home - Production Deployment Guide

## 🚀 Chuẩn bị Deploy

### 1. Xóa Test Data

```bash
# Chạy script xóa database
cd backend
node scripts/clear-database.js
```

**⚠️ Cảnh báo:** Script này sẽ xóa TẤT CẢ dữ liệu trong database. Đảm bảo bạn đã backup nếu cần!

---

## 📦 Cấu hình Production

### Backend (Node.js + Express)

#### Option 1: Deploy lên Render.com (FREE)

1. **Tạo tài khoản tại [render.com](https://render.com)**

2. **Tạo Web Service mới:**
   - Click "New +" → "Web Service"
   - Connect GitHub repository của bạn
   - Chọn branch: `main`
   - Root directory: `backend`
   - Environment: `Node`
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Instance type: `Free`

3. **Thêm Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ulis-home
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=production
   PORT=5001
   ```

4. **Deploy** - Render sẽ tự động deploy khi bạn push code

#### Option 2: Deploy lên Railway.app (FREE)

1. **Tạo tài khoản tại [railway.app](https://railway.app)**

2. **Tạo Project mới:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Chọn repository
   - Chọn service: `backend`

3. **Thêm Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   NODE_ENV=production
   ```

4. **Deploy** - Railway tự động deploy

---

### Frontend (React)

#### Option 1: Deploy lên Vercel (RECOMMENDED - FREE)

1. **Cài đặt Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /Users/nguyennguyensy/Desktop/ulis-home
   vercel
   ```

3. **Cấu hình:**
   - Framework: Create React App
   - Build command: `npm run build`
   - Output directory: `build`
   - Install command: `npm install`

4. **Environment Variables trong Vercel:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

5. **Deploy Production:**
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy lên Netlify (FREE)

1. **Cài đặt Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build project:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=build
   ```

---

### Database (MongoDB)

#### MongoDB Atlas (FREE - RECOMMENDED)

1. **Tạo cluster tại [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)**

2. **Tạo Database:**
   - Cluster → Collections → Create Database
   - Database name: `ulis-home`

3. **Tạo User:**
   - Database Access → Add New Database User
   - Username: `ulis-admin`
   - Password: (tạo password mạnh)
   - Role: `Read and write to any database`

4. **Whitelist IP:**
   - Network Access → Add IP Address
   - Chọn: `Allow access from anywhere` (0.0.0.0/0)
   - Hoặc chỉ định IP của Render/Railway

5. **Get Connection String:**
   - Cluster → Connect → Connect your application
   - Copy connection string:
   ```
   mongodb+srv://ulis-admin:<password>@cluster0.xxxxx.mongodb.net/ulis-home?retryWrites=true&w=majority
   ```

---

### Firebase (Authentication + Storage)

#### Cấu hình Production

1. **Firebase Console:**
   - Vào [console.firebase.google.com](https://console.firebase.google.com)
   - Chọn project của bạn

2. **Authentication → Settings:**
   - Authorized domains → Add domain:
     - `your-app.vercel.app`
     - `your-custom-domain.com`

3. **Storage Rules (Production):**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /avatars/{userId}/{fileName} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /houses/{houseId}/{fileName} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

4. **Firestore Rules (nếu dùng):**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

---

## 🔧 Checklist Trước Khi Deploy

### Backend
- [ ] Đã xóa test data: `node scripts/clear-database.js`
- [ ] Environment variables đã được set
- [ ] MongoDB Atlas đã được cấu hình
- [ ] CORS đã được cấu hình cho frontend domain
- [ ] JWT secret đã được thay đổi
- [ ] Logs không chứa thông tin nhạy cảm

### Frontend
- [ ] API URL đã được cập nhật (production backend)
- [ ] Firebase config đã được cập nhật
- [ ] Console.log debug đã được xóa (optional)
- [ ] Build thành công: `npm run build`
- [ ] Environment variables đã được set

### Firebase
- [ ] Authorized domains đã thêm production domain
- [ ] Storage rules đã được cấu hình đúng
- [ ] Email verification đang hoạt động
- [ ] Đã upgrade lên Blaze plan nếu cần realtime features

---

## 📝 Post-Deployment

### 1. Test Production

- [ ] Đăng ký tài khoản mới
- [ ] Email verification hoạt động
- [ ] Upload ảnh hoạt động
- [ ] Tạo house mới
- [ ] Chat system hoạt động
- [ ] Reservation system hoạt động

### 2. Monitoring

**Backend Logs:**
- Render: Dashboard → Logs
- Railway: Dashboard → Deployments → View Logs

**Frontend:**
- Vercel: Dashboard → Deployments → Function Logs
- Browser Console (F12)

### 3. Database Backup

```bash
# Backup MongoDB Atlas
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## 🌐 Custom Domain (Optional)

### Vercel
1. Settings → Domains → Add Domain
2. Cập nhật DNS records theo hướng dẫn

### Render
1. Settings → Custom Domains → Add Custom Domain
2. Cập nhật DNS records

---

## 🔒 Security Checklist

- [ ] Tất cả secrets đã được thay đổi (JWT_SECRET, etc.)
- [ ] MongoDB Atlas có IP whitelist hoặc VPC peering
- [ ] Firebase rules đã được review
- [ ] HTTPS đã được bật (tự động với Vercel/Render)
- [ ] CORS chỉ cho phép production domains
- [ ] Rate limiting đã được cấu hình (nếu cần)

---

## 🆘 Troubleshooting

### Backend không kết nối được MongoDB
```bash
# Check connection string
# Đảm bảo password không có ký tự đặc biệt (hoặc encode chúng)
# Whitelist IP: 0.0.0.0/0
```

### Frontend không gọi được API
```bash
# Check CORS trong backend
# Check REACT_APP_API_URL đúng chưa
# Check browser console for errors
```

### Firebase Auth không hoạt động
```bash
# Check authorized domains trong Firebase Console
# Check Firebase config trong frontend
```

---

## 📞 Support

- GitHub Issues: [your-repo]/issues
- Email: your-email@example.com

---

**🎉 Chúc bạn deploy thành công!**
