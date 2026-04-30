import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { phongAPI, thanhToanAPI, yeuCauAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { buildPhongAddress } from '../utils/location';
import './ChiTietPhong.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const createManualSplitForm = () => ({
  tienPhong: '',
  tienDichVu: '',
  tienDien: '',
  tienNuoc: '',
  moTa: '',
});

const DotIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="12" r="1.9" fill="currentColor" />
    <circle cx="12" cy="12" r="1.9" fill="currentColor" />
    <circle cx="18" cy="12" r="1.9" fill="currentColor" />
  </svg>
);

const getStatusMeta = (trangThai) => {
  if (trangThai === 'San sang') return { className: 'badge-success', label: 'Sẵn sàng' };
  if (trangThai === 'Da day') return { className: 'badge-danger', label: 'Đã đầy' };
  return { className: 'badge-warning', label: 'Bảo trì' };
};

export default function ChiTietPhong() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.user);

  const [phong, setPhong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showYeuCau, setShowYeuCau] = useState(false);
  const [yeuCaus, setYeuCaus] = useState([]);
  const [memberMenu, setMemberMenu] = useState(null);
  const [deletingPhong, setDeletingPhong] = useState(false);

  const [manualSplitForm, setManualSplitForm] = useState(createManualSplitForm());
  const [manualSplitLoading, setManualSplitLoading] = useState(false);

  const fetchChiTietPhong = useCallback(async () => {
    try {
      const res = await phongAPI.layChiTiet(id);
      const phongData = res.data.data;
      setPhong(phongData);

      const currentUserId = currentUser?.maNguoiDung;
      setIsOwner(Boolean(phongData.maChuPhong && currentUserId && phongData.maChuPhong === currentUserId));
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy phòng hoặc có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?.maNguoiDung]);

  useEffect(() => {
    fetchChiTietPhong();
  }, [fetchChiTietPhong]);

  const fetchYeuCau = useCallback(async () => {
    try {
      const res = await yeuCauAPI.layCuaPhong(id);
      setYeuCaus(res.data.data || []);
    } catch {
      toast.error('Không tải được yêu cầu tham gia');
    }
  }, [id]);

  const handleToggleYeuCau = async () => {
    const next = !showYeuCau;
    setShowYeuCau(next);
    if (next) await fetchYeuCau();
  };

  const handleDuyetYeuCau = async (maYeuCau, chapNhan) => {
    try {
      await yeuCauAPI.duyet(maYeuCau, chapNhan);
      toast.success(chapNhan ? 'Đã chấp nhận yêu cầu' : 'Đã từ chối yêu cầu');
      await fetchYeuCau();
      await fetchChiTietPhong();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thất bại');
    }
  };

  const handleChiaTuDong = async () => {
    try {
      await thanhToanAPI.chiaTien(id);
      toast.success('Đã chia tự động thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chia tự động thất bại');
    }
  };

  const handleXoaThanhVien = async (maThanhVien) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi phòng không?')) return;

    try {
      await phongAPI.xoaThanhVien(id, maThanhVien);
      toast.success('Đã xóa thành viên khỏi phòng');
      setMemberMenu(null);
      await fetchChiTietPhong();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thành viên thất bại');
    }
  };

  const handleDeletePhong = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này không?')) return;

    setDeletingPhong(true);
    try {
      await phongAPI.xoa(id);
      toast.success('Đã xóa phòng thành công');
      navigate('/quan-ly-phong');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa phòng thất bại');
    } finally {
      setDeletingPhong(false);
    }
  };

  const handleChiaThuCong = async (event) => {
    event.preventDefault();

    if (!manualSplitForm.tienPhong || !manualSplitForm.tienDichVu ||
        !manualSplitForm.tienDien || !manualSplitForm.tienNuoc) {
      toast.error('Vui lòng nhập đầy đủ các khoản tiền');
      return;
    }

    setManualSplitLoading(true);
    try {
      await thanhToanAPI.chiaTienThuCong(id, {
        tienPhong: parseFloat(manualSplitForm.tienPhong || 0),
        tienDichVu: parseFloat(manualSplitForm.tienDichVu || 0),
        tienDien: parseFloat(manualSplitForm.tienDien || 0),
        tienNuoc: parseFloat(manualSplitForm.tienNuoc || 0),
        moTa: manualSplitForm.moTa.trim(),
      });

      toast.success('Đã tạo hóa đơn chia tiền thủ công thành công!');
      setManualSplitForm(createManualSplitForm());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chia tiền thủ công thất bại');
    } finally {
      setManualSplitLoading(false);
    }
  };

  if (loading) return <div className="spinner" />;

  if (!phong) {
    return (
      <div className="container page-wrapper">
        <div className="alert alert-danger">Không tìm thấy phòng.</div>
      </div>
    );
  }

  const members = phong.danhSachThanhVien || [];
  const conCho = Math.max((phong.soNguoiToiDa || 0) - (phong.soNguoiHienTai || 0), 0);
  const status = getStatusMeta(phong.trangThai);

  return (
    <div className="container page-wrapper room-detail-page">
      <div className="room-detail-layout">
        <main className="room-detail-main">
          <section className="card room-detail-hero">
            <div className="room-detail-hero-top">
              <div>
                <span className={`badge ${status.className}`}>{status.label}</span>
                <h1>{phong.title}</h1>
                <p>{buildPhongAddress(phong)}</p>
              </div>
              <div className="room-detail-price">
                <strong>{fmt(phong.giaTien)}</strong>
                <span>/tháng</span>
              </div>
            </div>

            <div className="room-detail-stats">
              <div className="room-detail-stat">
                <span>Hiện tại</span>
                <strong>{phong.soNguoiHienTai || 0}</strong>
              </div>
              <div className="room-detail-stat">
                <span>Tối đa</span>
                <strong>{phong.soNguoiToiDa || 0}</strong>
              </div>
              <div className="room-detail-stat">
                <span>Còn chỗ</span>
                <strong>{conCho}</strong>
              </div>
            </div>

            {phong.moTa && <p className="room-detail-description">{phong.moTa}</p>}
          </section>

          <section className="card room-detail-section">
            <div className="room-detail-section-header">
              <h2>Chi phí hằng tháng</h2>
            </div>
            <div className="room-detail-cost-grid">
              <div className="room-detail-cost-card"><span>Giá phòng</span><strong>{fmt(phong.giaTien)}/tháng</strong></div>
              <div className="room-detail-cost-card"><span>Tiền dịch vụ</span><strong>{fmt(phong.tienDichVu)}</strong></div>
              <div className="room-detail-cost-card"><span>Tiền điện</span><strong>{fmt(phong.tienDien)}</strong></div>
              <div className="room-detail-cost-card"><span>Tiền nước</span><strong>{fmt(phong.tienNuoc)}</strong></div>
            </div>
          </section>

          <section className="card room-detail-section">
            <div className="room-detail-section-header">
              <h2>Thành viên phòng</h2>
              <span>{phong.soNguoiHienTai || 0}/{phong.soNguoiToiDa || 0}</span>
            </div>

            <div className="room-detail-members-list">
              {members.length > 0 ? (
                members.map(member => (
                  <div className="room-detail-member-row" key={member.maNguoiDung}>
                    <Link to={`/nguoi-dung/${member.maNguoiDung}`} className="room-detail-member-link">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.hoTen)}&background=12355B&color=fff&size=40`}
                        className="avatar avatar-sm"
                        alt={member.hoTen}
                        loading="lazy"
                      />
                      <div className="room-detail-member-text">
                        <strong>{member.hoTen}</strong>
                        <span>
                          {member.ngayThamGia
                            ? `Vào phòng: ${new Date(member.ngayThamGia).toLocaleDateString('vi-VN')}`
                            : 'Thành viên hiện tại'}
                        </span>
                      </div>
                    </Link>

                    {isOwner && (
                      <div className="room-detail-member-menu-wrap">
                        <button
                          type="button"
                          className="room-detail-member-menu-trigger"
                          onClick={() => setMemberMenu(prev => prev === member.maNguoiDung ? null : member.maNguoiDung)}
                          aria-label="Mở menu thành viên"
                        >
                          <DotIcon />
                        </button>

                        {memberMenu === member.maNguoiDung && (
                          <div className="room-detail-member-menu-dropdown">
                            <button
                              type="button"
                              className="room-detail-member-menu-item"
                              onClick={() => handleXoaThanhVien(member.maNguoiDung)}
                            >
                              Xóa thành viên
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="room-detail-member-empty">Chưa có thành viên</p>
              )}
            </div>
          </section>

          {isOwner && showYeuCau && (
            <section className="card room-detail-section">
              <div className="room-detail-section-header">
                <h2>Yêu cầu tham gia</h2>
              </div>
              {yeuCaus.length === 0 ? (
                <p className="room-detail-member-empty">Chưa có yêu cầu nào.</p>
              ) : (
                <div className="room-detail-request-list">
                  {yeuCaus.map(yc => (
                    <div key={yc.maYeuCau} className="room-detail-request-item">
                      <Link to={`/nguoi-dung/${yc.maNguoiDung}`} className="room-detail-request-user">
                        <img
                          src={yc.avatarNguoiDung || `https://ui-avatars.com/api/?name=${encodeURIComponent(yc.tenNguoiDung)}&size=40`}
                          className="avatar avatar-sm"
                          alt={yc.tenNguoiDung}
                          loading="lazy"
                        />
                        <div>
                          <strong>{yc.tenNguoiDung}</strong>
                          {yc.moTa && <p>{yc.moTa}</p>}
                        </div>
                      </Link>
                      <span className={`badge ${yc.trangThai === 'Chap nhan' ? 'badge-success' : yc.trangThai === 'Tu choi' ? 'badge-danger' : 'badge-warning'}`}>
                        {yc.trangThai === 'Chap nhan' ? 'Đã chấp nhận' : yc.trangThai === 'Tu choi' ? 'Đã từ chối' : 'Chờ duyệt'}
                      </span>
                      {yc.trangThai === 'Cho duyet' && (
                        <div className="room-detail-request-actions">
                          <button className="btn btn-success btn-sm" onClick={() => handleDuyetYeuCau(yc.maYeuCau, true)}>
                            Duyệt
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDuyetYeuCau(yc.maYeuCau, false)}>
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {isOwner && (
            <section className="card room-detail-section">
              <div className="room-detail-section-header">
                <h2>Chia tiền thủ công</h2>
              </div>
              <form onSubmit={handleChiaThuCong}>
                <div className="room-detail-form-grid room-detail-form-grid-note">
                  <div className="form-group">
                    <label className="form-label">Mô tả (tùy chọn)</label>
                    <input
                      className="form-control"
                      value={manualSplitForm.moTa}
                      onChange={e => setManualSplitForm(prev => ({ ...prev, moTa: e.target.value }))}
                      placeholder="Ví dụ: Chia tiền tháng 5/2026"
                    />
                  </div>
                </div>

                <div className="room-detail-form-grid">
                  <div className="form-group">
                    <label className="form-label">Tiền phòng</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={manualSplitForm.tienPhong}
                      onChange={e => setManualSplitForm(prev => ({ ...prev, tienPhong: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tiền dịch vụ</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={manualSplitForm.tienDichVu}
                      onChange={e => setManualSplitForm(prev => ({ ...prev, tienDichVu: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tiền điện</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={manualSplitForm.tienDien}
                      onChange={e => setManualSplitForm(prev => ({ ...prev, tienDien: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tiền nước</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={manualSplitForm.tienNuoc}
                      onChange={e => setManualSplitForm(prev => ({ ...prev, tienNuoc: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={manualSplitLoading}>
                  {manualSplitLoading ? 'Đang tạo hóa đơn...' : 'Tạo hóa đơn chia tiền thủ công'}
                </button>
              </form>
            </section>
          )}
        </main>

        <aside className="room-detail-sidebar">
          <section className="card room-detail-owner-card">
            <div className="card-header">Chủ phòng</div>
            <div className="card-body">
              <Link to={`/nguoi-dung/${phong.maChuPhong}`} className="room-detail-owner-link">
                <img
                  src={phong.avatarChuPhong || `https://ui-avatars.com/api/?name=${encodeURIComponent(phong.tenChuPhong)}&background=12355B&color=fff&size=40`}
                  className="avatar avatar-md"
                  alt={phong.tenChuPhong || 'Chủ phòng'}
                />
                <div>
                  <div className="room-detail-owner-name">{phong.tenChuPhong}</div>
                  <span className="badge badge-info">Chủ phòng</span>
                </div>
              </Link>
            </div>
          </section>

          {isOwner && (
            <section className="card room-detail-owner-card room-detail-action-card">
              <div className="card-header">Quản lý phòng</div>
              <div className="card-body">
                <button className="btn btn-outline btn-block" onClick={() => navigate(`/phong/${id}/chinh-sua`)}>
                  Chỉnh sửa
                </button>
                <button className="btn btn-secondary btn-block" onClick={handleToggleYeuCau}>
                  {showYeuCau ? 'Ẩn yêu cầu' : 'Xem yêu cầu'}
                </button>
                <button className="btn btn-success btn-block" onClick={handleChiaTuDong}>
                  Chia tự động
                </button>
                <button className="btn btn-danger btn-block" onClick={handleDeletePhong} disabled={deletingPhong}>
                  {deletingPhong ? 'Đang xóa...' : 'Xóa phòng'}
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
