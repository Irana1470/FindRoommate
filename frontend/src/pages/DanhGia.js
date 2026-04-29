import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { danhGiaAPI, thanhToanAPI } from '../services/api';

export default function DanhGia() {
  const [danhGias, setDanhGias] = useState([]);
  const [hoaDons, setHoaDons] = useState([]);
  const [form, setForm] = useState({ maHoaDon: '', moTa: '', soSao: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('da-viet');

  const fetchData = async () => {
    try {
      const [danhGiaRes, hoaDonRes] = await Promise.all([
        danhGiaAPI.layCuaToi(),
        thanhToanAPI.layHoaDon(),
      ]);

      setDanhGias(danhGiaRes.data.data || []);
      setHoaDons((hoaDonRes.data.data || []).filter(h => h.trangThai === 'Da thanh toan'));
    } catch {
      toast.error('Không tải được dữ liệu đánh giá');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.maHoaDon) {
      toast.error('Chọn hóa đơn để xác nhận lượt ở trước khi đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      await danhGiaAPI.tao({
        maHoaDon: parseInt(form.maHoaDon, 10),
        moTa: form.moTa,
        soSao: form.soSao,
      });
      toast.success('Đánh giá thành công!');
      setForm({ maHoaDon: '', moTa: '', soSao: 5 });
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thất bại');
    }
    setSubmitting(false);
  };

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">⭐ Đánh giá</h1>

      <div className="tabs">
        {[
          ['da-viet', '⭐ Đánh giá đã viết'],
          ['viet-moi', '✍️ Viết đánh giá'],
        ].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {l}
          </div>
        ))}
      </div>

      {tab === 'da-viet' && (
        danhGias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⭐</div>
            <p>Bạn chưa viết đánh giá nào.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {danhGias.map(dg => (
              <div key={dg.maDanhGia} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700 }}>
                      {dg.maHoaDon ? `Hóa đơn xác thực #${dg.maHoaDon}` : 'Đánh giá đã gửi'}
                    </div>
                    <div className="stars">{'★'.repeat(dg.soSao)}{'☆'.repeat(5 - dg.soSao)}</div>
                  </div>
                  {dg.moTa && <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{dg.moTa}</p>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    {dg.ngayDanhGia ? new Date(dg.ngayDanhGia).toLocaleDateString('vi-VN') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'viet-moi' && (
        <div style={{ maxWidth: 560 }}>
          <div className="card">
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                ℹ️ Hóa đơn chỉ dùng để xác nhận bạn đã thanh toán và có trải nghiệm thực tế. Hồ sơ cá nhân sẽ hiển thị phần nhận xét, không đưa giao diện thanh toán vào đó.
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Chọn hóa đơn đã thanh toán để xác thực lượt ở</label>
                  <select
                    className="form-control"
                    value={form.maHoaDon}
                    onChange={e => setForm(f => ({ ...f, maHoaDon: e.target.value }))}
                  >
                    <option value="">-- Chọn hóa đơn --</option>
                    {hoaDons.map(h => (
                      <option key={h.maHoaDon} value={h.maHoaDon}>
                        #{h.maHoaDon} — {h.tenPhong}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Số sao</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        style={{
                          fontSize: 28,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: s <= form.soSao ? '#F6AD55' : '#CBD5E0',
                        }}
                        onClick={() => setForm(f => ({ ...f, soSao: s }))}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nhận xét</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.moTa}
                    onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  {submitting ? '⏳ Đang gửi...' : '⭐ Gửi đánh giá'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
