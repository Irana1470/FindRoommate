import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { phongAPI } from '../services/api';
import { buildPhongAddress } from '../utils/location';
import './QuanLyPhong.css';

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const getStatusMeta = (trangThai) => {
  if (trangThai === 'San sang') return { className: 'badge-success', label: 'Sẵn sàng' };
  if (trangThai === 'Da day') return { className: 'badge-danger', label: 'Đã đầy' };
  return { className: 'badge-warning', label: 'Bảo trì' };
};

const RoomCard = React.memo(({ phong, onNavigate }) => {
  const status = getStatusMeta(phong.trangThai);
  const current = phong.soNguoiHienTai || 0;
  const max = phong.soNguoiToiDa || 0;

  return (
    <article className="card phong-manage-card">
      <div className="phong-card-content">
        <div className="phong-card-main">
          <div className="phong-card-title-row">
            <h3>{phong.title}</h3>
            <span className={`badge ${status.className}`}>{status.label}</span>
          </div>

          <p className="phong-card-address">{buildPhongAddress(phong)}</p>

          <div className="phong-card-meta">
            <div className="phong-meta-item">
              <span>Giá phòng</span>
              <strong>{fmt(phong.giaTien)}/tháng</strong>
            </div>
            <div className="phong-meta-item">
              <span>Thành viên</span>
              <strong>{current}/{max}</strong>
            </div>
            <div className="phong-meta-item">
              <span>Phí dịch vụ</span>
              <strong>{fmt(phong.tienDichVu)}</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary phong-detail-button"
          onClick={() => onNavigate(`/phong/${phong.maPhong}`)}
        >
          Xem chi tiết phòng
        </button>
      </div>
    </article>
  );
});

export default function QuanLyPhong() {
  const navigate = useNavigate();

  const [phongs, setPhongs] = useState([]);
  const [phongThamGia, setPhongThamGia] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPhongs = useCallback(async () => {
    setLoading(true);
    try {
      const [ownedRes, joinedRes] = await Promise.all([
        phongAPI.layPhongCuaToi(),
        phongAPI.layPhongThamGia().catch(() => ({ data: { data: [] } })),
      ]);
      setPhongs(ownedRes.data.data || []);
      setPhongThamGia(joinedRes.data.data || []);
    } catch (err) {
      toast.error('Không tải được danh sách phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhongs();
  }, [fetchPhongs]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const phongList = useMemo(() => phongs, [phongs]);

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-title-row">
        <div>
          <h1 className="section-title">Quản lý phòng</h1>
          <p className="section-subtitle">Theo dõi các phòng bạn đang sở hữu và truy cập nhanh trang chi tiết.</p>
        </div>
        <Link to="/tao-phong" className="btn btn-primary">Thêm phòng mới</Link>
      </div>

      {phongList.length === 0 ? (
        <div className="empty-state card">
          <div className="card-body">
            <div className="empty-state-icon">🏠</div>
            <p>Bạn chưa có phòng nào. <Link to="/tao-phong">Tạo phòng ngay</Link></p>
          </div>
        </div>
      ) : (
        <div className="phong-manage-list">
          {phongList.map(phong => (
            <RoomCard
              key={phong.maPhong}
              phong={phong}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}

      <section className="card joined-room-card">
        <div className="card-header">Phòng tôi tham gia</div>
        <div className="card-body">
          {phongThamGia.length === 0 ? (
            <div className="member-empty">Bạn chưa tham gia phòng nào.</div>
          ) : (
            <div className="joined-room-list">
              {phongThamGia.map(phong => {
                const status = getStatusMeta(phong.trangThai);

                return (
                  <div key={phong.maPhong} className="joined-room-item">
                    <div className="joined-room-main">
                      <div className="joined-room-title-row">
                        <strong>{phong.title}</strong>
                        <span className={`badge ${status.className}`}>{status.label}</span>
                      </div>
                      <div className="phong-card-address">
                        {buildPhongAddress(phong)}
                      </div>
                      <div className="joined-room-price">{fmt(phong.giaTien)}/tháng</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleNavigate(`/phong/${phong.maPhong}`)}
                    >
                      Xem chi tiết phòng
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
