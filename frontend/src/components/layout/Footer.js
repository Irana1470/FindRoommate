import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">🏠 FindRoomMate</div>
          <p>Nền tảng tìm bạn ở ghép & chia sẻ tiền phòng hàng đầu Việt Nam.</p>
        </div>
        <div className="footer-links">
          <h4>Dịch vụ</h4>
          <Link to="/bai-dang">Tìm phòng</Link>
          <Link to="/tao-bai-dang">Đăng tin</Link>
          <Link to="/tim-phong">Lọc phòng</Link>
        </div>
        <div className="footer-links">
          <h4>Hỗ trợ</h4>
          <a href="#">Hướng dẫn</a>
          <a href="#">Liên hệ</a>
          <a href="#">Điều khoản</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 FindRoomMate. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  );
}
