# 📘 HƯỚNG DẪN SETUP CHI TIẾT - ULIS HOME

## 🎯 MỤC TIÊU
Chạy được ứng dụng ULIS HOME trên máy local và deploy lên production

---

## 📋 DANH SÁCH 35 FILES CẦN TẠO

### 📁 Root Directory (7 files)
```
ulis-home/
├── .env.example
├── .gitignore
├── firebase.json
├── package.json (1->2)
├── README.md
├── FIREBASE_SETUP.md
└── SETUP_GUIDE.md (file này)
```

### 📁 public/ (1 file)
```
public/
└── index.html
```

### 📁 src/ (3 files)
```
src/
├── index.js
├── index.css
└── App.jsx (1->2)
```

### 📁 src/utils/ (2 files)
```
src/utils/
├── constants.js
└── validation.js
```

### 📁 src/firebase/ (1 file)
```
src/firebase/
└── config.js (1->2)
```

### 📁 src/services/ (3 files)
```
src/services/
├── authService.js (1->2)
├── houseService.js (1->3)
└── chatService.js (1->2)
```

### 📁 src/components/shared/ (3 files)
```
src/components/shared/
├── Map.jsx
├── ImageUpload.jsx (1->2)
└── ReviewSection.jsx
```

### 📁 src/components/auth/ (4 files)
```
src/components/auth/
├── AuthContainer.jsx
├── Login.jsx
├── Register.jsx
└── PersonalInfo.jsx
```

### 📁 src/components/student/ (6 files)
```
src/components/student/
├── StudentDashboard.jsx
├── HouseDetail.jsx
├── StudentProfile.jsx
├── MyHouses.jsx
├── RoommateProfile.jsx
└── ChatBox.jsx
```

### 📁 src/components/landlord/ (5 files)
```
src/components/landlord/
├── LandlordDashboard.jsx
├── LandlordProfile.jsx
├── AddHouse.jsx
├── MyListings.jsx
└── LandlordChat.jsx
```

**TỔNG: 35 files**

---

## 🚀 BƯỚC 1: TẠO PROJECT VÀ CÀI ĐẶT

### 1.1. Tạo thư mục project
```bash
mkdir ulis-home
cd ulis-home
```

### 1.2. Tạo tất cả 35 files
Copy nội dung của từng file mà tôi đã tạo vào đúng vị trí theo cấu trúc trên.

**Lưu ý:**
- Tạo đúng cấu trúc thư mục
- Tên file phải chính xác (case-sensitive)
- Extension: `.js`, `.jsx`, `.json`, `.md`, `.html`, `.css`

### 1.3. Cài đặt dependencies
```bash
npm install
```

Dependencies sẽ được cài:
- react, react-dom, react-router-dom
- firebase (v10+)
- lucide-react (icons)
- leaflet, react-leaflet (maps)

---

## 🔥 BƯỚC 2: SETUP FIREBASE

### 2.1. Tạo Firebase Project
1. Truy cập: https://console.firebase.google.com/
2. Click **"Add project"**
3. Nhập tên: `ulis-home` (hoặc tên bạn muốn)
4. Tắt Google Analytics
5. Click **"Create project"**
6. Đợi 30-60 giây

### 2.2. Tạo Web App
1. Trong project, click icon **Web** (`</>`)
2. Nhập nickname: `ULIS HOME Web`
3. KHÔNG check "Firebase Hosting"
4. Click **"Register app"**
5. **QUAN TRỌNG:** Copy toàn bộ `firebaseConfig` object
6. Click **"Continue to console"**

Ví dụ config bạn sẽ nhận được:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ulis-home-xxxxx.firebaseapp.com",
  projectId: "ulis-home-xxxxx",
  storageBucket: "ulis-home-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

### 2.3. Enable Authentication
1. Sidebar: **Build** > **Authentication**
2. Click **"Get started"**
3. Tab **"Sign-in method"**
4. Click **"Email/Password"**
5. Enable switch **ON**
6. Click **"Save"**

### 2.4. Setup Firestore Database
1. Sidebar: **Build** > **Firestore Database**
2. Click **"Create database"**
3. Chọn **"Start in test mode"**
4. Location: **asia-southeast1 (Singapore)**
5. Click **"Enable"**
6. Đợi 1-2 phút

### 2.5. Cập nhật Firestore Rules
1. Tab **"Rules"**
2. Xóa hết, paste code sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Houses collection
    match /houses/{houseId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.landlordId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.landlordId == request.auth.uid;
    }
    
    // Reservations collection
    match /reservations/{reservationId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.studentId || 
        request.auth.uid == get(/databases/$(database)/documents/houses/$(resource.data.houseId)).data.landlordId
      );
      allow create: if request.auth != null && request.resource.data.studentId == request.auth.uid;
      allow update, delete: if request.auth != null && (
        request.auth.uid == resource.data.studentId ||
        request.auth.uid == get(/databases/$(database)/documents/houses/$(resource.data.houseId)).data.landlordId
      );
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;
    }
  }
}
```

3. Click **"Publish"**

---

## ⚙️ BƯỚC 3: CẤU HÌNH PROJECT

### 3.1. Tạo file .env
```bash
cp .env.example .env
```

### 3.2. Điền Firebase Config vào .env
Mở file `.env`, điền thông tin từ Firebase Console (Bước 2.2):

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=ulis-home-xxxxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ulis-home-xxxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=ulis-home-xxxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxx
```

**⚠️ QUAN TRỌNG:** File `.env` đã có trong `.gitignore`, KHÔNG commit lên Git!

---

## 🏃 BƯỚC 4: CHẠY PROJECT

### 4.1. Start development server
```bash
npm start
```

### 4.2. Mở trình duyệt
Tự động mở: http://localhost:3000

### 4.3. Kiểm tra Console
- Mở DevTools (F12)
- Tab Console: không có error đỏ
- Tab Network: requests đến Firebase thành công

---

## ✅ BƯỚC 5: TEST CHỨC NĂNG

### 5.1. Test Đăng ký Sinh viên
1. Click "Đăng ký ngay"
2. Chọn "Sinh viên"
3. Email: `test@ulis.edu.vn` (phải có .edu.vn)
4. Mật khẩu: `123456`
5. Xác nhận mật khẩu: `123456`
6. Click "Đăng ký"
7. Điền thông tin:
   - Upload ảnh (nhỏ hơn 500KB)
   - Tên: "Nguyễn Văn A"
   - Tuổi: 20
   - SĐT: 0912345678
   - Địa chỉ: "Hà Nội"
   - CCCD: 123456789012
8. Click "Hoàn tất"

**Expected:** Vào được StudentDashboard

### 5.2. Test Đăng ký Chủ nhà
1. Đăng xuất
2. Đăng ký với email: `landlord@gmail.com`
3. Chọn "Chủ nhà"
4. Hoàn tất profile tương tự

**Expected:** Vào được LandlordDashboard

### 5.3. Test Đăng nhà (Chủ nhà)
1. Tab "Đăng nhà mới"
2. Bước 1: Nhập địa chỉ, click trên map
3. Bước 2: Upload 2-3 ảnh (mỗi ảnh < 500KB)
4. Bước 3: Điền thông tin nhà
5. Click "Hoàn tất"

**Expected:** Nhà xuất hiện trong "Nhà đã đăng"

### 5.4. Test Xem nhà (Sinh viên)
1. Đăng xuất, login lại bằng sinh viên
2. Tab "Tìm nhà"
3. Click vào nhà vừa đăng

**Expected:** Hiển thị chi tiết nhà

### 5.5. Test Đặt phòng
1. Trong chi tiết nhà, click "Đặt phòng"

**Expected:** 
- Thông báo "Đặt phòng thành công"
- Nút đổi thành "Hủy đặt phòng"
- Status "Đang chờ duyệt"

### 5.6. Test Duyệt đặt phòng (Chủ nhà)
1. Đăng xuất, login lại bằng chủ nhà
2. Tab "Nhà đã đăng"
3. Click "Xem đặt phòng" trên nhà
4. Click "Duyệt"

**Expected:** Status đổi thành "Đã duyệt"

### 5.7. Test Chat
1. Login bằng sinh viên
2. Tab "Chat"
3. Chọn cuộc trò chuyện với chủ nhà
4. Gửi tin nhắn

**Expected:** Tin nhắn hiển thị realtime

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: "Firebase: Error (auth/...)"
**Nguyên nhân:** Authentication chưa enable
**Giải pháp:** Kiểm tra lại Bước 2.3

### Lỗi 2: "Missing or insufficient permissions"
**Nguyên nhân:** Firestore Rules chưa update
**Giải pháp:** Kiểm tra lại Bước 2.5

### Lỗi 3: "Cannot find module 'firebase'"
**Nguyên nhân:** Dependencies chưa cài
**Giải pháp:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi 4: Map không hiển thị
**Nguyên nhân:** Leaflet CSS chưa load
**Giải pháp:** Kiểm tra file `public/index.html` có dòng:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
```

### Lỗi 5: "File too large"
**Nguyên nhân:** Ảnh > 500KB
**Giải pháp:** Resize ảnh bằng:
- TinyPNG.com
- Squoosh.app
- Online Image Compressor

### Lỗi 6: Chat không realtime
**Nguyên nhân:** Firestore onSnapshot không hoạt động
**Giải pháp:** 
- Check console có error không
- Verify Firestore Rules
- Thử refresh trang

---

## 📦 BƯỚC 6: DEPLOY PRODUCTION

### Option 1: Firebase Hosting (Khuyến nghị)

```bash
# 1. Cài Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Init hosting
firebase init hosting
# Chọn: build, Yes, No

# 4. Build
npm run build

# 5. Deploy
firebase deploy
```

**URL:** `https://ulis-home-xxxxx.web.app`

### Option 2: GitHub Pages

```bash
# 1. Update package.json
"homepage": "https://your-username.github.io/ulis-home"

# 2. Install gh-pages
npm install --save-dev gh-pages

# 3. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/ulis-home.git
git push -u origin main

# 4. Deploy
npm run deploy
```

**URL:** `https://your-username.github.io/ulis-home`

---

## 📊 CHECKLIST HOÀN THÀNH

- [ ] Đã tạo đủ 35 files
- [ ] npm install thành công
- [ ] Firebase project đã tạo
- [ ] Authentication đã enable
- [ ] Firestore đã setup
- [ ] Firestore Rules đã update
- [ ] File .env đã tạo và điền config
- [ ] npm start chạy được
- [ ] Đăng ký sinh viên thành công
- [ ] Đăng ký chủ nhà thành công
- [ ] Chủ nhà đăng nhà được
- [ ] Sinh viên xem nhà được
- [ ] Đặt phòng hoạt động
- [ ] Chat realtime hoạt động
- [ ] Deploy thành công

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành, bạn sẽ có:
- ✅ Web app chạy mượt mà trên local
- ✅ Tất cả chức năng hoạt động
- ✅ Realtime chat và updates
- ✅ Website public trên internet
- ✅ Firebase free tier (đủ cho 1000+ users)

---

## 📞 HỖ TRỢ

**Nếu gặp vấn đề:**
1. Check Console (F12 > Console)
2. Check Network tab
3. Check Firebase Console > Firestore/Auth
4. Đọc lại bước bị lỗi
5. Google error message
6. Tạo issue trên GitHub

**Firebase free tier limits:**
- Firestore: 50K reads/day ✅
- Auth: Unlimited ✅
- Hosting: 10GB storage ✅

**Đủ cho dự án sinh viên!**

---

## 🎉 CHÚC MỪNG!

Bạn đã setup thành công ULIS HOME - một ứng dụng web production-ready với React + Firebase!

**Next steps:**
- Thêm Google Analytics
- SEO optimization
- PWA features
- Custom domain
- Email notifications