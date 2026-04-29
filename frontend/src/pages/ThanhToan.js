import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { thanhToanAPI } from '../services/api';
import './ThanhToan.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function ThanhToan() {
  const [soDu, setSoDu] = useState(0);
  const [napSoTien, setNapSoTien] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSoDu = async () => {
    setLoading(true);
    try {
      const res = await thanhToanAPI.xemSoDu();
      setSoDu(res.data.data || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSoDu();
  }, []);

  const handleNapTien = async () => {
    if (!napSoTien || isNaN(napSoTien)) {
      toast.error('Nhập số tiền hợp lệ');
      return;
    }

    try {
      const res = await thanhToanAPI.napTien(parseFloat(napSoTien));
      setSoDu(res.data.data);
      setNapSoTien('');
      toast.success('Nạp tiền thành công!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thất bại');
    }
  };

  const presets = [500000, 1000000, 2000000, 5000000];

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">💳 Ví tiền</h1>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48 }}>💰</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Số dư hiện tại</div>
              <div className="balance-amount">{fmt(soDu)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Nạp tiền vào ví</div>
          <div className="card-body">
            <div className="preset-amounts">
              {presets.map(p => (
                <button
                  key={p}
                  className={`preset-btn ${parseFloat(napSoTien) === p ? 'active' : ''}`}
                  onClick={() => setNapSoTien(String(p))}
                >
                  {fmt(p)}
                </button>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Hoặc nhập số tiền</label>
              <input
                className="form-control"
                type="number"
                placeholder="Nhập số tiền..."
                value={napSoTien}
                onChange={e => setNapSoTien(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleNapTien}>
              ➕ Nạp tiền
            </button>
            <div className="alert alert-info" style={{ marginTop: 16, fontSize: 13 }}>
              ℹ️ Trong môi trường thực tế, nạp tiền sẽ tích hợp VNPay / MoMo / ZaloPay.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div
          className="card-body"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Hóa đơn của tôi</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>
              Danh sách hóa đơn và thao tác thanh toán hóa đơn đã được tách sang màn hình riêng.
            </div>
          </div>
          <Link to="/hoa-don" className="btn btn-outline">
            Xem hóa đơn
          </Link>
        </div>
      </div>
    </div>
  );
}
