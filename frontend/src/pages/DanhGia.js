import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { danhGiaAPI } from '../services/api';

const formatDate = value => (value ? new Date(value).toLocaleDateString('vi-VN') : '');
const renderStars = value => `${'★'.repeat(value || 0)}${'☆'.repeat(5 - (value || 0))}`;

export default function DanhGia() {
  const [danhGiaDaViet, setDanhGiaDaViet] = useState([]);
  const [danhGiaNhanDuoc, setDanhGiaNhanDuoc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('nhan-duoc');

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [daVietRes, nhanDuocRes] = await Promise.all([
          danhGiaAPI.layCuaToi(),
          danhGiaAPI.layNhanDuoc(),
        ]);

        if (!active) return;

        setDanhGiaDaViet(daVietRes.data.data || []);
        setDanhGiaNhanDuoc(nhanDuocRes.data.data || []);
      } catch {
        toast.error('Không tải được dữ liệu đánh giá');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const currentReviews = tab === 'nhan-duoc' ? danhGiaNhanDuoc : danhGiaDaViet;
  const emptyMessage = tab === 'nhan-duoc'
    ? 'Bạn chưa nhận được đánh giá nào.'
    : 'Bạn chưa viết đánh giá nào.';

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Đánh giá</h1>

      <div className="tabs">
        {[
          ['nhan-duoc', 'Đánh giá về bạn'],
          ['da-viet', 'Đánh giá đã viết'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Đang tải đánh giá...</p>
        </div>
      ) : currentReviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">★</div>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {currentReviews.map(dg => (
            <div key={dg.maDanhGia} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700 }}>
                    {tab === 'nhan-duoc' ? (
                      dg.maNguoiDanhGia ? (
                        <Link to={`/nguoi-dung/${dg.maNguoiDanhGia}`}>
                          {dg.tenNguoiDanhGia || 'Người dùng ẩn danh'}
                        </Link>
                      ) : (
                        dg.tenNguoiDanhGia || 'Người dùng ẩn danh'
                      )
                    ) : (
                      dg.maHoaDon ? `Hóa đơn xác thực #${dg.maHoaDon}` : 'Đánh giá đã gửi'
                    )}
                  </div>
                  <div className="stars">{renderStars(dg.soSao)}</div>
                </div>

                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                  {dg.moTa || 'Không có nhận xét chi tiết'}
                </p>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {formatDate(dg.ngayDanhGia)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
