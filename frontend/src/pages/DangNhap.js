import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import './Auth.css';

export function DangNhap() {
  const [form, setForm] = useState({ email: '', matKhau: '' });
  const { dangNhap, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    const ok = await dangNhap(form.email, form.matKhau);

    if (ok) {
      toast.success('Đăng nhập thành công!');
      navigate('/');
      return;
    }

    toast.error(useAuthStore.getState().error || 'Đăng nhập thất bại');
  };

  const updateField = (key, value) => {
    clearError();
    setForm(current => ({ ...current, [key]: value }));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <div className="card-body">
          <div className="auth-logo">FindRoomMate</div>
          <div className="auth-kicker">Truy cập an toàn</div>
          <h2 className="auth-title">Đăng nhập</h2>
          <p className="auth-subtitle">Quay lại bảng điều khiển để tiếp tục quản lý phòng và giao dịch.</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                className="form-control"
                type="password"
                required
                autoComplete="current-password"
                value={form.matKhau}
                onChange={e => updateField('matKhau', e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </div>
            <button className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p className="auth-footer">
            Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DangNhap;
