import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { phongAPI } from '../services/api';
import { buildPhongAddress } from '../utils/location';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function ChiTietPhong() {
  const { id } = useParams();
  const [phong, setPhong] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    phongAPI.layChiTiet(id)
      .then(r => setPhong(r.data.data))
      .catch(() => toast.error('Khong tim thay phong'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!phong) {
    return (
      <div className="container page-wrapper">
        <div className="alert alert-danger">Khong tim thay phong.</div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-body">
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>{phong.title}</h1>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '10px 0' }}>
              {fmt(phong.giaTien)}/thang
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              {buildPhongAddress(phong)}
            </div>

            <div className="grid-4" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 22 }}>{fmt(phong.tienDichVu)}</div>
                <div className="stat-label">Dich vu</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 22 }}>{fmt(phong.tienDien)}</div>
                <div className="stat-label">Tien dien</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 22 }}>{fmt(phong.tienNuoc)}</div>
                <div className="stat-label">Tien nuoc</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{phong.soNguoiToiDa - phong.soNguoiHienTai}</div>
                <div className="stat-label">Con cho</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div className="stat-card" style={{ flex: 1, padding: 16 }}>
                <div className="stat-value">{phong.soNguoiHienTai}</div>
                <div className="stat-label">Hien tai</div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: 16 }}>
                <div className="stat-value">{phong.soNguoiToiDa}</div>
                <div className="stat-label">Toi da</div>
              </div>
            </div>
            {phong.moTa && <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{phong.moTa}</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">Thanh vien hien tai</div>
          <div className="card-body">
            <Link
              to={`/nguoi-dung/${phong.maChuPhong}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
                textDecoration: 'none',
              }}
            >
              <img
                src={phong.avatarChuPhong || `https://ui-avatars.com/api/?name=${encodeURIComponent(phong.tenChuPhong)}&background=12355B&color=fff&size=40`}
                className="avatar avatar-sm"
                alt=""
              />
              <div>
                <div style={{ fontWeight: 700 }}>{phong.tenChuPhong}</div>
                <span className="badge badge-info">Chu phong</span>
              </div>
            </Link>

            {phong.danhSachThanhVien?.map(member => (
              <Link
                key={member.maNguoiDung}
                to={`/nguoi-dung/${member.maNguoiDung}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                }}
              >
                <img
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.hoTen)}&size=40`}
                  className="avatar avatar-sm"
                  alt=""
                />
                <div style={{ fontWeight: 600 }}>{member.hoTen}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
