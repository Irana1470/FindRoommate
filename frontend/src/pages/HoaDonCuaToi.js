import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { thanhToanAPI } from '../services/api';
import './ThanhToan.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function HoaDonCuaToi() {
  const [hoaDons, setHoaDons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHoaDons = async () => {
    setLoading(true);
    try {
      const res = await thanhToanAPI.layHoaDon();
      setHoaDons(res.data.data || []);
    } catch {
      toast.error('Không tải được hóa đơn');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHoaDons();
  }, []);

  const handleThanhToan = async maHoaDon => {
    try {
      await thanhToanAPI.thanhToan(maHoaDon);
      toast.success('Thanh toán thành công');
      fetchHoaDons();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thanh toán thất bại');
    }
  };

  const { hoaDonChuaDong, hoaDonDaDong } = useMemo(() => {
    const sorted = [...hoaDons].sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0));
    return {
      hoaDonChuaDong: sorted.filter(item => item.trangThai !== 'Da thanh toan'),
      hoaDonDaDong: sorted.filter(item => item.trangThai === 'Da thanh toan'),
    };
  }, [hoaDons]);

  const renderHoaDon = hd => (
    <div key={hd.maHoaDon} className="card hoadon-item">
      <div className="card-body">
        <div className="hoadon-row">
          <div>
            <div className="hoadon-title">#{hd.maHoaDon} — {hd.tenPhong}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              {hd.moTa || 'Không có mô tả'} · {hd.ngayTao ? new Date(hd.ngayTao).toLocaleDateString('vi-VN') : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="hoadon-amount">{fmt(hd.tongTien)}</div>
            <span className={`badge ${hd.trangThai === 'Da thanh toan' ? 'badge-success' : 'badge-warning'}`}>
              {hd.trangThai === 'Da thanh toan' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
            {hd.trangThai !== 'Da thanh toan' && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8, display: 'block', marginLeft: 'auto' }}
                onClick={() => handleThanhToan(hd.maHoaDon)}
              >
                Thanh toán ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 6 }}>Hóa đơn của tôi</h1>
          <div style={{ color: 'var(--text-muted)' }}>Ưu tiên hiển thị các hóa đơn chưa đóng để bạn xử lý nhanh.</div>
        </div>
        <Link to="/thanh-toan" className="btn btn-outline">
          Về ví tiền
        </Link>
      </div>

      {hoaDons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <p>Chưa có hóa đơn nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Chưa thanh toán</h2>
              <span className="badge badge-warning">{hoaDonChuaDong.length}</span>
            </div>
            {hoaDonChuaDong.length === 0 ? (
              <div className="alert alert-success">Bạn không có hóa đơn nào đang chờ thanh toán.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {hoaDonChuaDong.map(renderHoaDon)}
              </div>
            )}
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Đã thanh toán</h2>
              <span className="badge badge-success">{hoaDonDaDong.length}</span>
            </div>
            {hoaDonDaDong.length === 0 ? (
              <div className="alert alert-info">Chưa có hóa đơn nào đã thanh toán.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {hoaDonDaDong.map(renderHoaDon)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
