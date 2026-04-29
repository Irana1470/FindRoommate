import React, { useEffect, useState } from 'react';
import { yeuCauAPI } from '../services/api';

export default function YeuCau() {
  const [yeuCaus, setYeuCaus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    yeuCauAPI.layCuaToi()
      .then(r => setYeuCaus(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const trangThaiLabel = t => t === 'Chap nhan' ? '✅ Chấp nhận' : t === 'Tu choi' ? '❌ Từ chối' : '⏳ Chờ duyệt';
  const trangThaiBadge = t => t === 'Chap nhan' ? 'badge-success' : t === 'Tu choi' ? 'badge-danger' : 'badge-warning';

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">📋 Yêu cầu của tôi</h1>
      <p className="section-subtitle">Theo dõi trạng thái các yêu cầu tham gia phòng</p>
      {yeuCaus.length === 0 ? (
        <div className="empty-state card"><div className="card-body"><div className="empty-state-icon">📋</div><p>Bạn chưa gửi yêu cầu nào.</p></div></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
          {yeuCaus.map(yc => (
            <div key={yc.maYeuCau} className="card">
              <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Phòng: {yc.tenPhong}</div>
                  {yc.moTa && <div style={{ color:'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{yc.moTa}</div>}
                  <div style={{ color:'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                    Gửi lúc: {yc.ngayYeuCau ? new Date(yc.ngayYeuCau).toLocaleString('vi-VN') : ''}
                  </div>
                </div>
                <span className={`badge ${trangThaiBadge(yc.trangThai)}`}>{trangThaiLabel(yc.trangThai)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
