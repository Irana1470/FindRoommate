import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { danhGiaAPI, nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import './HoSoCaNhan.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const normalizeName = value => value.trim().replace(/\s+/g, ' ');
const isValidName = value => {
  const normalized = normalizeName(value);
  return normalized.length >= 2 && normalized.length <= 100 && !/\d/.test(normalized);
};
const isValidPhone = value => /^\d{10,11}$/.test(value);

export default function HoSoCaNhan() {
  const { user, layThongTinToi } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ hoTen: '', soDienThoai: '' });
  const [saving, setSaving] = useState(false);
  const [danhGias, setDanhGias] = useState([]);
  const [loadingDanhGia, setLoadingDanhGia] = useState(true);

  useEffect(() => {
    setForm({
      hoTen: user?.hoTen || '',
      soDienThoai: user?.soDienThoai || '',
    });
  }, [user]);

  useEffect(() => {
    let active = true;

    danhGiaAPI.layNhanDuoc()
      .then(res => {
        if (active) {
          setDanhGias(res.data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoadingDanhGia(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    const hoTen = normalizeName(form.hoTen);
    const soDienThoai = form.soDienThoai.trim();

    if (!isValidName(hoTen)) {
      toast.error('Họ tên phải từ 2 đến 100 ký tự và không được chứa số');
      return;
    }

    if (!isValidPhone(soDienThoai)) {
      toast.error('Số điện thoại phải gồm 10 hoặc 11 chữ số');
      return;
    }

    setSaving(true);
    try {
      await nguoiDungAPI.capNhat({ ...form, hoTen, soDienThoai });
      await layThongTinToi();
      toast.success('Cập nhật thành công');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      await nguoiDungAPI.uploadAvatar(fd);
      await layThongTinToi();
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại');
    }
  };

  if (!user) return <div className="spinner" />;

  const danhGiaHienThi = [...danhGias]
    .sort((a, b) => new Date(b.ngayDanhGia || 0) - new Date(a.ngayDanhGia || 0))
    .slice(0, 5);

  return (
    <div className="container page-wrapper">
      <div className="hoso-layout">
        <div className="card profile-card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="avatar-upload">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=12355B&color=fff&size=120`}
                className="avatar avatar-xl"
                alt=""
              />
              <label htmlFor="avatar-input" className="avatar-edit-btn" title="Đổi ảnh">✏️</label>
              <input id="avatar-input" type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>

            <h2 style={{ marginTop: 16, fontWeight: 800 }}>{user.hoTen}</h2>
            <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)' }}>
              Trang công khai của bạn chỉ hiển thị cho người dùng khác khi họ bấm vào tên hoặc ảnh đại diện của bạn.
            </div>

            {user.xacThuc ? (
              <span className="badge badge-success" style={{ marginTop: 8 }}>Đã xác thực CCCD</span>
            ) : (
              <Link
                to="/xac-thuc"
                className="badge badge-warning"
                style={{ marginTop: 8, cursor: 'pointer', textDecoration: 'none' }}
              >
                Chưa xác thực - Xác thực ngay
              </Link>
            )}

            <div style={{ marginTop: 14 }}>
              {user.diemDanhGia ? (
                <div className="stars">
                  {'★'.repeat(Math.round(user.diemDanhGia))}
                  {'☆'.repeat(5 - Math.round(user.diemDanhGia))}
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 6 }}>
                    {user.diemDanhGia.toFixed(1)} / 5
                  </span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chưa có đánh giá nào</div>
              )}
            </div>

            <div style={{ marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Số dư ví</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{fmt(user.soDuVi)}</div>
              <div className="profile-wallet-actions">
                <Link to="/thanh-toan" className="btn btn-outline btn-sm">Nạp tiền</Link>
                <Link to="/hoa-don" className="btn btn-outline btn-sm">Hóa đơn</Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Thông tin cá nhân</span>
              {!editing ? (
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Chỉnh sửa</button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        hoTen: user?.hoTen || '',
                        soDienThoai: user?.soDienThoai || '',
                      });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              {editing ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Họ và tên</label>
                    <input
                      className="form-control"
                      maxLength={100}
                      value={form.hoTen}
                      onChange={e => setForm(current => ({ ...current, hoTen: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      inputMode="numeric"
                      pattern="[0-9]{10,11}"
                      maxLength={11}
                      value={form.soDienThoai}
                      onChange={e => setForm(current => ({ ...current, soDienThoai: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                </>
              ) : (
                <div>
                  {[
                    ['Họ tên', user.hoTen],
                    ['Email', user.email],
                    ['Điện thoại', user.soDienThoai || 'Chưa cập nhật'],
                    ['Ngày tham gia', user.ngayTao ? new Date(user.ngayTao).toLocaleDateString('vi-VN') : ''],
                  ].map(([label, value]) => (
                    <div key={label} className="info-row">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Đánh giá nhận được</span>
              <Link to="/danh-gia" className="btn btn-outline btn-sm">Quản lý đánh giá</Link>
            </div>
            <div className="card-body">
              {loadingDanhGia ? (
                <div style={{ color: 'var(--text-muted)' }}>Đang tải đánh giá...</div>
              ) : danhGiaHienThi.length === 0 ? (
                <div className="review-empty">
                  Hồ sơ hiện chưa có đánh giá nào dành cho bạn.
                </div>
              ) : (
                <div className="review-list">
                  {danhGiaHienThi.map(dg => (
                    <div key={dg.maDanhGia} className="review-item">
                      <div className="review-top">
                        <strong>{dg.tenNguoiDanhGia || 'Người dùng ẩn danh'}</strong>
                        <span className="stars">{'★'.repeat(dg.soSao)}{'☆'.repeat(5 - dg.soSao)}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                        {dg.moTa || 'Không có nhận xét chi tiết'}
                      </div>
                      <div className="review-date">
                        {dg.ngayDanhGia ? new Date(dg.ngayDanhGia).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">Hành động nhanh</div>
            <div className="card-body">
              <div className="quick-actions">
                {[
                  ['/quan-ly-phong', '🏠', 'Quản lý phòng'],
                  ['/quan-ly-bai-dang', '📝', 'Quản lý bài đăng'],
                  ['/yeu-cau', '📋', 'Yêu cầu của tôi'],
                  ['/thanh-toan', '💰', 'Ví tiền'],
                  ['/hoa-don', '📄', 'Hóa đơn của tôi'],
                  ['/tam-tru', '📑', 'Phiếu tạm trú'],
                  ['/danh-gia', '⭐', 'Đánh giá'],
                  ['/xac-thuc', '🔐', 'Xác thực CCCD'],
                ].map(([to, icon, label]) => (
                  <Link key={to} to={to} className="quick-action-btn">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
