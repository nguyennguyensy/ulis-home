# 🏠 ULIS Home - Student Housing Platform

Platform kết nối sinh viên với nhà trọ và tìm kiếm bạn cùng phòng phù hợp.

## ✨ Tính năng

### Cho Sinh viên
- ✅ Tìm kiếm nhà trọ theo vị trí, giá, loại phòng
- ✅ Xem chi tiết nhà, hình ảnh, địa chỉ trên bản đồ
- ✅ Đặt phòng trực tiếp với chủ nhà
- ✅ Tìm bạn cùng phòng dựa trên tính cách, thói quen
- ✅ Chat trực tiếp với chủ nhà và sinh viên khác
- ✅ Quản lý đặt phòng của bạn
- ✅ Profile cá nhân với roommate preferences

### Cho Chủ nhà
- ✅ Đăng tin nhà trọ với hình ảnh, mô tả
- ✅ Quản lý danh sách nhà
- ✅ Duyệt/từ chối yêu cầu đặt phòng
- ✅ Chat với sinh viên quan tâm
- ✅ Cập nhật trạng thái phòng

### Bảo mật
- ✅ Email verification bắt buộc
- ✅ Xác thực sinh viên qua email .edu.vn
- ✅ Timeout cho việc hoàn thiện hồ sơ (10 phút)
- ✅ Upload ảnh CMND/CCCD để xác thực

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router v6
- Lucide Icons
- Firebase Authentication & Storage
- Google Maps API (optional)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Firebase Admin SDK
- JWT Authentication

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <your-repo-url>
cd ulis-home
```

### 2. Backend Setup

```bash
cd backend
npm install

# Tạo file .env
cp .env.example .env
# Cập nhật .env với thông tin của bạn
```

**.env configuration:**
```env
MONGODB_URI=mongodb://localhost:27017/ulis-home
JWT_SECRET=your-super-secret-jwt-key
PORT=5001
NODE_ENV=development
```

**Chạy backend:**
```bash
npm start
# hoặc
node src/server.js
```

### 3. Frontend Setup

```bash
cd ..  # về root directory
npm install

# Tạo file .env.local
```

**.env.local configuration:**
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Chạy frontend:**
```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### 4. MongoDB Setup

**Option 1: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongodb
```

**Option 2: MongoDB Atlas (Cloud)**
1. Tạo tài khoản tại [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Tạo cluster miễn phí
3. Copy connection string và cập nhật vào `.env`

### 5. Firebase Setup

1. Tạo project tại [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication → Email/Password
3. Enable Storage
4. Copy Firebase config vào `.env.local`

**Firebase Storage Rules:**
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

## 📱 Sử dụng

### Đăng ký
1. Chọn role: Sinh viên hoặc Chủ nhà
2. Nhập email (sinh viên cần email .edu.vn)
3. Xác thực email qua link gửi đến hộp thư
4. Hoàn thiện hồ sơ trong vòng 10 phút

### Tìm nhà (Sinh viên)
1. Xem danh sách nhà trên dashboard
2. Filter theo giá, loại phòng
3. Xem chi tiết nhà, vị trí trên bản đồ
4. Đặt phòng hoặc chat với chủ nhà

### Đăng nhà (Chủ nhà)
1. Vào tab "Nhà của tôi"
2. Click "Thêm nhà mới"
3. Điền thông tin: tiêu đề, địa chỉ, giá, loại phòng
4. Upload ảnh nhà
5. Chờ sinh viên đặt phòng

### Tìm Roommate
1. Hoàn thiện Roommate Profile
2. Xem gợi ý bạn cùng phòng phù hợp
3. Chat để tìm hiểu thêm

## 🚀 Deployment

Xem hướng dẫn chi tiết trong [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Quick Start:**
```bash
# Xóa test data trước khi deploy
cd backend
node scripts/clear-database.js

# Deploy frontend lên Vercel
npm install -g vercel
vercel

# Deploy backend lên Render/Railway
# (xem DEPLOYMENT_GUIDE.md)
```

## 📂 Cấu trúc Project

```
ulis-home/
├── backend/
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   ├── utils/         # Helper functions
│   │   └── server.js      # Entry point
│   ├── scripts/
│   │   └── clear-database.js
│   └── package.json
├── src/
│   ├── components/
│   │   ├── auth/          # Login, Register, Profile
│   │   ├── student/       # Student dashboard, chat
│   │   ├── landlord/      # Landlord dashboard
│   │   └── shared/        # Shared components
│   ├── services/          # API clients
│   ├── utils/             # Constants, validation
│   ├── firebase/          # Firebase config
│   └── App.jsx
├── public/
└── package.json
```

## 🔧 Scripts

```bash
# Backend
npm start              # Start backend server
node scripts/clear-database.js  # Clear all data

# Frontend
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
```

## 📝 Environment Variables

### Backend (.env)
```env
MONGODB_URI=           # MongoDB connection string
JWT_SECRET=            # JWT secret key
PORT=5001              # Server port
NODE_ENV=development   # development | production
```

### Frontend (.env.local)
```env
REACT_APP_API_URL=                          # Backend API URL
REACT_APP_FIREBASE_API_KEY=                 # Firebase API key
REACT_APP_FIREBASE_AUTH_DOMAIN=             # Firebase auth domain
REACT_APP_FIREBASE_PROJECT_ID=              # Firebase project ID
REACT_APP_FIREBASE_STORAGE_BUCKET=          # Firebase storage bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=     # Firebase sender ID
REACT_APP_FIREBASE_APP_ID=                  # Firebase app ID
```

## 🐛 Troubleshooting

### Backend không kết nối MongoDB
```bash
# Check MongoDB đang chạy
mongosh
# hoặc
brew services list | grep mongodb
```

### Frontend không gọi được API
- Check REACT_APP_API_URL đúng chưa
- Check CORS trong backend
- Xem browser console (F12)

### Email verification không gửi
- Check Firebase Authentication enabled
- Check email domain trong Firebase Console
- Check Firebase config đúng chưa

## 📄 License

MIT

## 👥 Contributors

- [Your Name] - Initial work

## 🙏 Acknowledgments

- Icons: [Lucide](https://lucide.dev/)
- Maps: Google Maps API
- Auth: Firebase
- Database: MongoDB

---

**Developed with ❤️ for ULIS students**
