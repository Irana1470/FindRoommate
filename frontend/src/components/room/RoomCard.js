import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const formatCurrency = n =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function RoomCard({ baiDang }) {
  const navigate = useNavigate();
  const imgs = baiDang.images || [];
  const thumb = baiDang.video || imgs[0] || null;
  const hasVideo = Boolean(baiDang.video);

  const openBaiDang = () => {
    navigate(`/bai-dang/${baiDang.maBaiDang}`);
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBaiDang();
    }
  };

  return (
    <article
      className="room-card"
      role="link"
      tabIndex={0}
      onClick={openBaiDang}
      onKeyDown={handleKeyDown}
    >
      {thumb ? (
        <div className="room-card-media">
          {hasVideo ? (
            <video src={thumb} className="room-card-img" muted playsInline preload="metadata" />
          ) : (
            <img src={thumb} alt={baiDang.moTa} className="room-card-img" />
          )}
          {hasVideo && (
            <>
              <div className="room-card-media-overlay" aria-hidden="true" />
              <span className="room-card-video-badge">Video</span>
            </>
          )}
        </div>
      ) : (
        <div className="room-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>Nhà</div>
      )}
      <div className="room-card-body">
        <div className="room-card-title">{baiDang.moTa?.slice(0, 60)}{baiDang.moTa?.length > 60 ? '...' : ''}</div>
        <div className="room-card-price">{formatCurrency(baiDang.giaTien)}/tháng</div>
        <div className="room-card-info">
          Địa chỉ: {baiDang.diaChi || 'Chưa cập nhật địa chỉ'}
        </div>

        <div className="room-card-footer">
          <Link
            to={`/nguoi-dung/${baiDang.maNguoiDang}`}
            className="room-card-user"
            onClick={event => event.stopPropagation()}
          >
            <img
              src={baiDang.avatarNguoiDang || `https://ui-avatars.com/api/?name=${encodeURIComponent(baiDang.tenNguoiDang || 'U')}&background=12355B&color=fff&size=32`}
              alt={baiDang.tenNguoiDang || 'Người đăng'}
              style={{ width: 24, height: 24, borderRadius: '50%' }}
            />
            <span className="room-card-user-name">{baiDang.tenNguoiDang || 'Người đăng'}</span>
          </Link>

          <span className={`badge room-card-status ${baiDang.trangThai === 'Dang' ? 'badge-success' : 'badge-gray'}`}>
            {baiDang.trangThai === 'Dang' ? 'Đang đăng' : baiDang.trangThai}
          </span>
        </div>
      </div>
    </article>
  );
}
