import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { nguoiDungAPI } from '../services/api';
import UserModerationModal from '../components/admin/UserModerationModal';
import './AdminNguoiDung.css';

export default function AdminNguoiDung() {
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);

  const loadUsers = async (nextKeyword = keyword) => {
    setLoading(true);
    try {
      const response = await nguoiDungAPI.layDanhSachChoAdmin(nextKeyword.trim() || undefined);
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers('');
  }, []);

  const handleUnlockUser = async currentUser => {
    setSavingUserId(currentUser.maNguoiDung);
    try {
      await nguoiDungAPI.capNhatKhoaTaiKhoan(currentUser.maNguoiDung, false, null);
      toast.success('Đã mở khóa tài khoản');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể mở khóa tài khoản');
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="admin-user-page">
        <div className="admin-user-header">
          <div>
            <h1>Quản lý người dùng</h1>
            <p>Tìm kiếm theo email, Gmail hoặc số điện thoại để xem và quản trị tài khoản người dùng.</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body admin-user-toolbar">
            <input
              className="form-control"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="Tìm theo email hoặc số điện thoại"
            />
            <button type="button" className="btn btn-primary" onClick={() => loadUsers()}>
              Tìm kiếm
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card admin-user-empty">Đang tải người dùng...</div>
        ) : users.length === 0 ? (
          <div className="card admin-user-empty">Không tìm thấy người dùng phù hợp.</div>
        ) : (
          <div className="admin-user-list">
            {users.map(currentUser => (
              <article key={currentUser.maNguoiDung} className="card admin-user-card">
                <div className="admin-user-main">
                  <Link to={`/nguoi-dung/${currentUser.maNguoiDung}`} className="admin-user-profile-link">
                    <img
                      src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.hoTen || 'U')}&background=12355B&color=fff&size=64`}
                      alt={currentUser.hoTen}
                      className="avatar avatar-md"
                    />
                    <div>
                      <h2>{currentUser.hoTen}</h2>
                      <p>{currentUser.email || 'Chưa có email'}</p>
                      <p>{currentUser.soDienThoai || 'Chưa có số điện thoại'}</p>
                      {currentUser.canhBaoTaiKhoan && <p>Cảnh báo: {currentUser.canhBaoTaiKhoan}</p>}
                    </div>
                  </Link>

                  <div className="admin-user-statuses">
                    <span className={`badge ${currentUser.taiKhoanBiKhoa ? 'badge-danger' : 'badge-success'}`}>
                      {currentUser.taiKhoanBiKhoa ? 'Đang bị khóa' : 'Đang hoạt động'}
                    </span>
                    {currentUser.biHanCheHoatDong && (
                      <span className="badge badge-warning">
                        Bị hạn chế đến {currentUser.thoiGianHanCheDen ? new Date(currentUser.thoiGianHanCheDen).toLocaleString('vi-VN') : 'không xác định'}
                      </span>
                    )}
                    {currentUser.canhBaoTaiKhoan && (
                      <span className="badge badge-secondary">Đang có cảnh báo</span>
                    )}
                  </div>
                </div>

                <div className="admin-user-actions">
                  <Link to={`/nguoi-dung/${currentUser.maNguoiDung}`} className="btn btn-outline btn-sm">
                    Xem trang cá nhân
                  </Link>
                  {currentUser.taiKhoanBiKhoa && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUnlockUser(currentUser)}
                      disabled={savingUserId === currentUser.maNguoiDung}
                    >
                      {savingUserId === currentUser.maNguoiDung ? 'Đang mở khóa...' : 'Mở khóa tài khoản'}
                    </button>
                  )}
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedUser(currentUser)}>
                    Quản lý tài khoản
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <UserModerationModal
        open={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdated={async () => {
          if (selectedUser?.maNguoiDung) {
            const detail = await nguoiDungAPI.layChiTietChoAdmin(selectedUser.maNguoiDung);
            setSelectedUser(detail.data.data);
          }
          await loadUsers();
        }}
      />
    </div>
  );
}
