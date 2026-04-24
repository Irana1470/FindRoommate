# FindRoomMate App — Tìm Bạn Ở Ghép & Chia Tiền Phòng

Ứng dụng FindRoomMate giúp người dùng tìm bạn ở ghép, chia sẻ tiền phòng, xác thực CCCD bằng OCR và thanh toán trực tuyến.

roommate-app/
├── backend/          ← Java 17 + Spring Boot 3.2 (MVC)
│   └── src/main/java/com/roommate/
│       ├── controller/     ← REST Controllers + WebSocket
│       ├── service/        ← Business Logic
│       ├── repository/     ← Spring Data JPA
│       ├── model/          ← JPA Entities
│       ├── dto/            ← Data Transfer Objects
│       ├── security/       ← JWT + Spring Security
│       └── config/         ← Security, WebSocket, CORS
├── frontend/         ← React 18
│   └── src/
│       ├── pages/          ← Tất cả màn hình
│       ├── components/     ← Tái sử dụng (Navbar, ChatBox...)
│       ├── services/       ← Axios API calls
│       ├── store/          ← Zustand state
│       └── styles/         ← Global CSS
└── database.sql      

## Tính Năng Chính
| Đăng ký / Đăng nhập     ✅
| Xác thực CCCD (OCR)   ✅
| Tìm & lọc phòng   ✅    
| Đăng bài tìm ghép    ✅
| Apply vào phòng    ✅    
| Duyệt yêu cầu       ✅   
| Chia tiền phòng         
| Thanh toán tiền phòng           
| Chat realtime           
| Đánh giá                
| Lập phiếu tạm trú           

---

## Mở Rộng 

- [ ] Tích hợp Google Maps API để hiển thị bản đồ phòng
- [ ] Tích hợp VNPay/MoMo thay vì ví nội bộ
- [ ] Push notification (Firebase FCM)
- [ ] Mobile app (React Native)
