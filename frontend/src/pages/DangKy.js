import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import './Auth.css';

const isValidName = value => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length >= 2 && normalized.length <= 100 && !/\d/.test(normalized);
};

const isValidPhone = value => /^\d{10,11}$/.test(value);

export default function DangKy() {
  const [form, setForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
    xacNhanMatKhau: '',
  });
  const { dangKy, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();

    if (!isValidName(form.hoTen)) {
      toast.error('Họ và tên phải từ 2 đến 100 ký tự và không được chứa số');
      return;
    }

    if (!isValidPhone(form.soDienThoai)) {
      toast.error('Số điện thoại phải gồm 10 hoặc 11 chữ số');
      return;
    }

    if (form.matKhau !== form.xacNhanMatKhau) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    const ok = await dangKy({
      hoTen: form.hoTen,
      email: form.email,
      soDienThoai: form.soDienThoai,
      matKhau: form.matKhau,
    });

    if (ok) {
      toast.success('Đăng ký thành công!');
      navigate('/xac-thuc');
      return;
    }

    toast.error(useAuthStore.getState().error || 'Đăng ký thất bại');
  };

  const set = (key, value) => {
    clearError();
    setForm(current => ({ ...current, [key]: value }));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <div className="card-body">
          <div className="auth-logo">FindRoomMate</div>
          <div className="auth-kicker">Tạo hồ sơ mới</div>
          <h2 className="auth-title">Tạo tài khoản mới</h2>
          <p className="auth-subtitle">Bắt đầu hành trình tìm bạn ở ghép an toàn và minh bạch.</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input
                className="form-control"
                required
                maxLength={100}
                autoComplete="name"
                value={form.hoTen}
                onChange={e => set('hoTen', e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  className="form-control"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10,11}"
                  maxLength={11}
                  autoComplete="tel"
                  value={form.soDienThoai}
                  onChange={e => set('soDienThoai', e.target.value.replace(/\D/g, ''))}
                  placeholder="0901234567"
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input
                  className="form-control"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.matKhau}
                  onChange={e => set('matKhau', e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu</label>
                <input
                  className="form-control"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.xacNhanMatKhau}
                  onChange={e => set('xacNhanMatKhau', e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>
            <button className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>
          <p className="auth-footer">
            Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
