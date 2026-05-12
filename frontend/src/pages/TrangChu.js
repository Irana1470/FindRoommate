import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { baiDangAPI, thongKeAPI } from '../services/api';
import RoomCard from '../components/room/RoomCard';
import useAuthStore from '../store/authStore';
import './TrangChu.css';

const dinhDangSo = value => new Intl.NumberFormat('vi-VN').format(value || 0);

export default function TrangChu() {
  const { token, user } = useAuthStore();
  const [baiDangMoi, setBaiDangMoi] = useState([]);
  const [thongKe, setThongKe] = useState({
    tongNguoiDung: 0,
    tongPhongSanSang: 0,
    tongBaiDangDangHienThi: 0,
    tongTaiKhoanXacThuc: 0,
  });
  const [tuKhoa, setTuKhoa] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    baiDangAPI.layDanhSach({ page: 0, size: 6 })
      .then(response => setBaiDangMoi(response.data.data?.content || []))
      .catch(() => {});

    thongKeAPI.layTrangChu()
      .then(response => {
        if (response.data?.data) {
          setThongKe(response.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = event => {
    event.preventDefault();
    navigate(`/bai-dang?tuKhoa=${encodeURIComponent(tuKhoa)}`);
  };

  const thongKeTrangChu = [
    { value: dinhDangSo(thongKe.tongNguoiDung), label: 'Người dùng' },
    { value: dinhDangSo(thongKe.tongPhongSanSang), label: 'Phòng trọ sẵn sàng' },
    { value: dinhDangSo(thongKe.tongBaiDangDangHienThi), label: 'Bài đăng đang hiển thị' },
    { value: dinhDangSo(thongKe.tongTaiKhoanXacThuc), label: 'Tài khoản đã xác thực' },
  ];

  return (
    <div>
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title">Tìm bạn ở ghép<br /><span>dễ dàng và an toàn</span></h1>
          <p className="hero-subtitle">
            Kết nối hàng nghìn người tìm phòng và chia sẻ tiền thuê.<br />
            Xác thực danh tính, minh bạch, đáng tin cậy.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              className="form-control"
              placeholder="Nhập khu vực, địa chỉ..."
              value={tuKhoa}
              onChange={event => setTuKhoa(event.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-lg">Tìm phòng</button>
          </form>
          <div className="hero-actions">
            <Link to="/tao-bai-dang" className="btn btn-outline btn-lg">Đăng tin tìm bạn ghép</Link>
            <Link to="/tao-phong" className="btn btn-secondary btn-lg">Đăng phòng</Link>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="grid-4">
            {thongKeTrangChu.map(item => (
              <div key={item.label} className="stat-card">
                <div className="stat-value">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title text-center">Tại sao chọn FindRoomMate?</h2>
          <p className="section-subtitle text-center">Nền tảng đáng tin cậy với nhiều tính năng vượt trội</p>
          <div className="grid-3">
            {[
              { icon: '🔐', title: 'Xác thực CCCD bằng OCR', desc: 'Xác minh danh tính tự động, tăng độ tin cậy giữa người thuê' },
              { icon: '💰', title: 'Chia tiền tự động', desc: 'Hệ thống tự chia đều tiền phòng cho các thành viên' },
              { icon: '📄', title: 'Đăng ký tạm trú', desc: 'Tự động tạo phiếu tạm trú, xuất file gửi công an khu vực' },
              { icon: '💬', title: 'Chat trực tiếp', desc: 'Nhắn tin, trao đổi ngay trong app trước khi quyết định' },
              { icon: '🗺️', title: 'Bản đồ tích hợp', desc: 'Xem vị trí phòng, so sánh khoảng cách đến trường hoặc cơ quan' },
              { icon: '⭐', title: 'Đánh giá minh bạch', desc: 'Đánh giá bạn cùng phòng và chủ nhà sau khi ở' },
            ].map(feature => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="latest-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Tin đăng mới nhất</h2>
              <p className="section-subtitle">Các phòng trọ và tìm bạn ghép mới nhất</p>
            </div>
            <Link to="/bai-dang" className="btn btn-outline">Xem tất cả →</Link>
          </div>
          <div className="grid-3">
            {baiDangMoi.map(baiDang => <RoomCard key={baiDang.maBaiDang} baiDang={baiDang} />)}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-content">
          {token ? (
            <>
              <h2>{user?.hoTen ? `${user.hoTen}, sẵn sàng tìm bạn ở ghép?` : 'Sẵn sàng tìm bạn ở ghép?'}</h2>
              <p>Tạo bài đăng mới hoặc mở hộp thư để kết nối nhanh với những người phù hợp.</p>
              <div className="cta-actions">
                <Link to="/tao-bai-dang" className="btn btn-primary btn-lg">Đăng bài tìm bạn ở ghép</Link>
                <Link to="/tin-nhan" className="btn btn-outline btn-lg cta-outline-light">Mở tin nhắn</Link>
              </div>
            </>
          ) : (
            <>
              <h2>Sẵn sàng tìm bạn ở ghép?</h2>
              <p>Đăng ký miễn phí ngay hôm nay và kết nối với hàng nghìn người.</p>
              <Link to="/dang-ky" className="btn btn-primary btn-lg">Bắt đầu miễn phí</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
