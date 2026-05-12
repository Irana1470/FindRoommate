import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { nguoiDungAPI, thanhToanAPI } from '../services/api';
import './ThanhToan.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const getTransactionMeta = transaction => {
  if (transaction.chieu === 'IN') {
    return {
      amountClassName: 'wallet-transaction-amount in',
      prefix: '+',
      badgeClassName: 'badge badge-success',
      label: transaction.loai === 'NAP_TIEN' ? 'Nạp tiền' : 'Tiền vào',
    };
  }

  return {
    amountClassName: 'wallet-transaction-amount out',
    prefix: '-',
    badgeClassName: 'badge badge-danger',
    label: transaction.loai === 'THANH_TOAN_HOA_DON' ? 'Thanh toán hóa đơn' : 'Tiền ra',
  };
};

export default function ThanhToan() {
  const [soDu, setSoDu] = useState(0);
  const [napSoTien, setNapSoTien] = useState('');
  const [lichSuGiaoDich, setLichSuGiaoDich] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [soDuResponse, lichSuResponse] = await Promise.all([
        thanhToanAPI.xemSoDu(),
        nguoiDungAPI.layLichSuGiaoDich().catch(() => ({ data: { data: [] } })),
      ]);

      setSoDu(soDuResponse.data.data || 0);
      setLichSuGiaoDich(lichSuResponse.data.data || []);
    } catch {
      toast.error('Không tải được thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleNapTien = async () => {
    if (!napSoTien || Number.isNaN(Number(napSoTien)) || Number(napSoTien) <= 0) {
      toast.error('Nhập số tiền hợp lệ');
      return;
    }

    try {
      const res = await thanhToanAPI.napTien(parseFloat(napSoTien));
      setSoDu(res.data.data);
      setNapSoTien('');
      toast.success('Nạp tiền thành công!');
      await fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thất bại');
    }
  };

  const presets = [500000, 1000000, 2000000, 5000000];

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Ví tiền</h1>

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
              {presets.map(amount => (
                <button
                  key={amount}
                  className={`preset-btn ${parseFloat(napSoTien) === amount ? 'active' : ''}`}
                  onClick={() => setNapSoTien(String(amount))}
                >
                  {fmt(amount)}
                </button>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Hoặc nhập số tiền</label>
              <input
                className="form-control"
                type="number"
                min="0"
                placeholder="Nhập số tiền..."
                value={napSoTien}
                onChange={event => setNapSoTien(event.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleNapTien}>
              Nạp tiền
            </button>
            <div className="alert alert-info" style={{ marginTop: 16, fontSize: 13 }}>
              Trong môi trường thực tế, nạp tiền sẽ tích hợp VNPay / MoMo / ZaloPay.
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

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">Lịch sử giao dịch</div>
        <div className="card-body">
          {lichSuGiaoDich.length === 0 ? (
            <div className="wallet-transaction-empty">Chưa có giao dịch nào trong ví.</div>
          ) : (
            <div className="wallet-transaction-list">
              {lichSuGiaoDich.map(transaction => {
                const meta = getTransactionMeta(transaction);

                return (
                  <div key={transaction.maGiaoDich} className="wallet-transaction-item">
                    <div className="wallet-transaction-main">
                      <div className="wallet-transaction-title-row">
                        <span className={meta.badgeClassName}>{meta.label}</span>
                        <strong className={meta.amountClassName}>{meta.prefix}{fmt(transaction.soTien)}</strong>
                      </div>
                      <div className="wallet-transaction-description">
                        {transaction.moTa || 'Không có mô tả'}
                      </div>
                      <div className="wallet-transaction-meta">
                        <span>Số dư sau giao dịch: {fmt(transaction.soDuSauGiaoDich)}</span>
                        <span>{transaction.ngayTao ? new Date(transaction.ngayTao).toLocaleString('vi-VN') : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
