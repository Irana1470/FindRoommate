import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import './HoSoCaNhan.css';

const fmt = (n) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function HoSoCaNhan() {
  const { user, layThongTinToi } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ hoTen: '', soDienThoai: '' });
  const [saving, setSaving] = useState(false);

  // Memoize form initial value
  const initialForm = useMemo(() => ({
    hoTen: user?.hoTen || '',
    soDienThoai: user?.soDienThoai || '',
  }), [user?.hoTen, user?.soDienThoai]);

  // Sync form khi user thay đổi
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  // ==================== HANDLERS (được memoize) ====================
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await nguoiDungAPI.capNhat(form);
      await layThongTinToi();
      toast.success('Cập nhật thành công!');
      setEditing(false);
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  }, [form, layThongTinToi]);

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      await nguoiDungAPI.uploadAvatar(fd);
      await layThongTinToi();
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload thất bại');
    }
  }, [layThongTinToi]);

  const handleEditToggle = useCallback(() => setEditing(true), []);
  const handleCancelEdit = useCallback(() => setEditing(false), []);

  // Memoize danh sách quick actions để tránh tạo mới mỗi lần render
  const quickActions = useMemo(() => [
    { to: '/quan-ly-phong', icon: '🏠', label: 'Quản lý phòng' },
    { to: '/yeu-cau', icon: '📋', label: 'Yêu cầu của tôi' },
    { to: '/thanh-toan', icon: '💰', label: 'Ví tiền' },
    { to: '/hoa-don', icon: '📄', label: 'Hóa đơn của tôi' },
    { to: '/tam-tru', icon: '📄', label: 'Phiếu tạm trú' },
    { to: '/danh-gia', icon: '⭐', label: 'Đánh giá' },
    { to: '/xac-thuc', icon: '🔐', label: 'Xác thực CCCD' },
  ], []);

  // Memoize thông tin cá nhân để tránh tạo array mới mỗi render
  const infoRows = useMemo(() => [
    ['👤 Họ tên', user?.hoTen || ''],
    ['📧 Email', user?.email || ''],
    ['📱 Điện thoại', user?.soDienThoai || 'Chưa cập nhật'],
    ['📅 Ngày tham gia', user?.ngayTao 
      ? new Date(user.ngayTao).toLocaleDateString('vi-VN') 
      : ''],
  ], [user]);

  if (!user) {
    return <div className="spinner" />;
  }

  return (
    <div className="container page-wrapper">
      <div className="hoso-layout">
        {/* Profile Card */}
        <div className="card profile-card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="avatar-upload">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=12355B&color=fff&size=120`}
                className="avatar avatar-xl"
                alt="Avatar"
                loading="lazy"
              />
              <label htmlFor="avatar-input" className="avatar-edit-btn" title="Đổi ảnh">
                ✏️
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </div>

            <h2 style={{ marginTop: 16, fontWeight: 800 }}>{user.hoTen}</h2>

            <Link to={`/nguoi-dung/${user.maNguoiDung}`} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
              Xem trang công khai
            </Link>

            {user.xacThuc ? (
              <span className="badge badge-success" style={{ marginTop: 8 }}>✅ Đã xác thực CCCD</span>
            ) : (
              <Link
                to="/xac-thuc"
                className="badge badge-warning"
                style={{ marginTop: 8, cursor: 'pointer', textDecoration: 'none' }}
              >
                ⚠️ Chưa xác thực — Xác thực ngay
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
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
                {fmt(user.soDuVi)}
              </div>
              <div className="profile-wallet-actions">
                <Link to="/thanh-toan" className="btn btn-outline btn-sm">Nạp tiền</Link>
                <Link to="/hoa-don" className="btn btn-outline btn-sm">Hóa đơn</Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Thông tin cá nhân */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Thông tin cá nhân</span>
              {!editing ? (
                <button className="btn btn-outline btn-sm" onClick={handleEditToggle}>
                  ✏️ Chỉnh sửa
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={handleSave} 
                    disabled={saving}
                  >
                    {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
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
                      value={form.hoTen}
                      onChange={(e) => setForm(f => ({ ...f, hoTen: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={form.soDienThoai}
                      onChange={(e) => setForm(f => ({ ...f, soDienThoai: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <div>
                  {infoRows.map(([label, value]) => (
                    <div key={label} className="info-row">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hành động nhanh */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">⚡ Hành động nhanh</div>
            <div className="card-body">
              <div className="quick-actions">
                {quickActions.map(({ to, icon, label }) => (
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