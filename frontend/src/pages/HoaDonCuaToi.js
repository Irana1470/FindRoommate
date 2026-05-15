import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { thanhToanAPI } from '../services/api';
import './ThanhToan.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtNumber = n => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
const DEFAULT_INVOICE_ITEMS = new Set(['Tiền phòng', 'Tiền điện', 'Tiền nước', 'Dịch vụ']);

export default function HoaDonCuaToi() {
  const [hoaDons, setHoaDons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoices, setExpandedInvoices] = useState({});

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

  const toggleInvoiceDetails = maHoaDon => {
    setExpandedInvoices(current => ({
      ...current,
      [maHoaDon]: !current[maHoaDon],
    }));
  };

  const handleXoaHoaDon = async maHoaDon => {
    if (!window.confirm('Bạn có chắc muốn xóa hóa đơn đã thanh toán này khỏi danh sách không?')) return;

    try {
      await thanhToanAPI.xoaHoaDon(maHoaDon);
      toast.success('Đã xóa hóa đơn khỏi danh sách');
      setExpandedInvoices(current => {
        const next = { ...current };
        delete next[maHoaDon];
        return next;
      });
      fetchHoaDons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa hóa đơn thất bại');
    }
  };

  const { hoaDonChuaDong, hoaDonDaDong } = useMemo(() => {
    const sorted = [...hoaDons].sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0));
    return {
      hoaDonChuaDong: sorted.filter(item => item.trangThai !== 'Da thanh toan'),
      hoaDonDaDong: sorted.filter(item => item.trangThai === 'Da thanh toan'),
    };
  }, [hoaDons]);

  const renderHoaDon = hd => {
    const isExpanded = Boolean(expandedInvoices[hd.maHoaDon]);
    const extraItems = Array.isArray(hd.chiTiet)
      ? hd.chiTiet.filter(item => !DEFAULT_INVOICE_ITEMS.has(item.tenDichVu))
      : [];

    return (
      <div key={hd.maHoaDon} className="card hoadon-item">
        <div className="card-body">
          <div className="hoadon-row">
            <div>
              <div className="hoadon-title">#{hd.maHoaDon} - {hd.tenPhong}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                {hd.moTa || 'Không có mô tả'} · {hd.ngayTao ? new Date(hd.ngayTao).toLocaleDateString('vi-VN') : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="hoadon-amount">{fmt(hd.tongTien)}</div>
              <span className={`badge ${hd.trangThai === 'Da thanh toan' ? 'badge-success' : 'badge-warning'}`}>
                {hd.trangThai === 'Da thanh toan' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => toggleInvoiceDetails(hd.maHoaDon)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? '▲ Ẩn chi tiết' : '▼ Xem chi tiết'}
                </button>
                {hd.trangThai !== 'Da thanh toan' ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleThanhToan(hd.maHoaDon)}
                  >
                    Thanh toán ngay
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleXoaHoaDon(hd.maHoaDon)}
                  >
                    Xóa hóa đơn
                  </button>
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 14, display: 'grid', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Chi tiết hóa đơn</div>

              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Tiền phòng</span>
                  <strong>{fmt(hd.tienPhong)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div>Tiền điện</div>
                    {(hd.soDien || hd.giaDien) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {hd.soDien ? `${fmtNumber(hd.soDien)} số` : 'Chưa có chỉ số'}
                        {hd.giaDien ? ` × ${fmt(hd.giaDien)}/số` : ''}
                      </div>
                    )}
                  </div>
                  <strong>{fmt(hd.tienDien)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div>Tiền nước</div>
                    {hd.kieuTinhTienNuoc === 'meter' ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {hd.soNuoc ? `${fmtNumber(hd.soNuoc)} m3` : 'Chưa có chỉ số'}
                        {hd.giaNuoc ? ` × ${fmt(hd.giaNuoc)}/1 m3` : ''}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        Tính theo tiền cố định
                      </div>
                    )}
                  </div>
                  <strong>{fmt(hd.tienNuoc)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Dịch vụ</span>
                  <strong>{fmt(hd.tienDichVu)}</strong>
                </div>
              </div>

              {extraItems.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>Danh sách mục phí</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {extraItems.map((item, index) => (
                      <div key={`${hd.maHoaDon}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div>{item.tenDichVu}</div>
                          {(item.soLuong || item.donGia) && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                              {item.soLuong ? `Số lượng: ${fmtNumber(item.soLuong)}` : ''}
                              {item.soLuong && item.donGia ? ' • ' : ''}
                              {item.donGia ? `Đơn giá: ${fmt(item.donGia)}` : ''}
                            </div>
                          )}
                        </div>
                        <strong>{fmt(item.thanhTien)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

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
