import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { phongAPI, thanhToanAPI, yeuCauAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { buildPhongAddress } from '../utils/location';
import ContentActionMenu from '../components/report/ContentActionMenu';
import ReportContentModal from '../components/report/ReportContentModal';
import AddRoomMemberModal from '../components/room/AddRoomMemberModal';
import './ChiTietPhong.css';

const fmt = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} đ`;

const parseMoney = value => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const clampNumberInput = value => {
  if (value === '') return '';

  const normalized = value.replace(',', '.');
  if (!/^\d*\.?\d*$/.test(normalized)) {
    return value;
  }

  return Math.max(Number.parseFloat(normalized) || 0, 0).toString();
};

const createManualSplitForm = phong => ({
  tienPhong: parseMoney(phong?.giaTien),
  tienDichVu: parseMoney(phong?.tienDichVu),
  giaDien: parseMoney(phong?.tienDien),
  soDien: '',
  waterMode: phong?.kieuTinhTienNuoc === 'fixed' ? 'fixed' : 'meter',
  giaNuoc: parseMoney(phong?.tienNuoc),
  soNuoc: '',
  tienNuocCoDinh: parseMoney(phong?.tienNuoc) ? String(parseMoney(phong?.tienNuoc)) : '',
  moTa: '',
});

const DotIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="12" r="1.9" fill="currentColor" />
    <circle cx="12" cy="12" r="1.9" fill="currentColor" />
    <circle cx="18" cy="12" r="1.9" fill="currentColor" />
  </svg>
);

const getStatusMeta = trangThai => {
  if (trangThai === 'San sang') return { className: 'badge-success', label: 'Sẵn sàng' };
  if (trangThai === 'Da day') return { className: 'badge-danger', label: 'Đã đầy' };
  return { className: 'badge-warning', label: 'Bảo trì' };
};

export default function ChiTietPhong() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);

  const [phong, setPhong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showYeuCau, setShowYeuCau] = useState(false);
  const [yeuCaus, setYeuCaus] = useState([]);
  const [memberMenu, setMemberMenu] = useState(null);
  const [deletingPhong, setDeletingPhong] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applying, setApplying] = useState(false);
  const [moTaYeuCau, setMoTaYeuCau] = useState('');
  const [manualSplitForm, setManualSplitForm] = useState(() => createManualSplitForm());
  const [manualSplitLoading, setManualSplitLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

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

  useEffect(() => {
    if (phong) {
      setManualSplitForm(createManualSplitForm(phong));
    }
  }, [phong]);

  const fetchYeuCau = useCallback(async () => {
    try {
      const res = await yeuCauAPI.layCuaPhong(id);
      setYeuCaus(res.data.data || []);
    } catch {
      toast.error('Không tải được yêu cầu phòng');
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thất bại');
    }
  };

  const handleChiaTuDong = async () => {
    try {
      await thanhToanAPI.chiaTien(id);
      toast.success('Đã chia tự động thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chia tự động thất bại');
    }
  };

  const handleXoaThanhVien = async maThanhVien => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi phòng không?')) return;

    try {
      await phongAPI.xoaThanhVien(id, maThanhVien);
      toast.success('Đã xóa thành viên khỏi phòng');
      setMemberMenu(null);
      await fetchChiTietPhong();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thành viên thất bại');
    }
  };

  const handleDeletePhong = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này không?')) return;

    setDeletingPhong(true);
    try {
      await phongAPI.xoa(id);
      toast.success('Đã xóa phòng thành công');
      navigate('/quan-ly-phong');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa phòng thất bại');
    } finally {
      setDeletingPhong(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm('Bạn muốn gửi yêu cầu rời phòng đến chủ phòng?')) return;

    setLeavingRoom(true);
    try {
      await yeuCauAPI.gui({ maPhong: Number(id), loaiYeuCau: 'ROI_PHONG' });
      toast.success('Đã gửi yêu cầu rời phòng');
      await fetchChiTietPhong();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi yêu cầu rời phòng thất bại');
    } finally {
      setLeavingRoom(false);
    }
  };

  const handleApply = async () => {
    if (!currentUser) {
      navigate('/dang-nhap');
      return;
    }

    if (!currentUser.xacThuc) {
      toast.error('Bạn cần xác thực CCCD trước khi gửi yêu cầu');
      navigate('/xac-thuc');
      return;
    }

    setApplying(true);
    try {
      await yeuCauAPI.gui({ maPhong: phong.maPhong, moTa: moTaYeuCau });
      toast.success('Đã gửi yêu cầu tham gia');
      setShowApply(false);
      setMoTaYeuCau('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setApplying(false);
    }
  };

  const handleManualSplitChange = (field, value) => {
    setManualSplitForm(current => ({ ...current, [field]: value }));
  };

  const handleChiaThuCong = async event => {
    event.preventDefault();

    const tienPhong = parseMoney(manualSplitForm.tienPhong);
    const tienDichVu = parseMoney(manualSplitForm.tienDichVu);
    const tienDien = parseMoney(manualSplitForm.soDien) * parseMoney(manualSplitForm.giaDien);
    const tienNuoc = manualSplitForm.waterMode === 'meter'
      ? parseMoney(manualSplitForm.soNuoc) * parseMoney(manualSplitForm.giaNuoc)
      : parseMoney(manualSplitForm.tienNuocCoDinh);

    setManualSplitLoading(true);
    try {
      await thanhToanAPI.chiaTienThuCong(id, {
        tienPhong,
        tienDichVu,
        tienDien,
        tienNuoc,
        giaDien: parseMoney(manualSplitForm.giaDien),
        soDien: manualSplitForm.soDien === '' ? null : parseMoney(manualSplitForm.soDien),
        giaNuoc: manualSplitForm.waterMode === 'meter' ? parseMoney(manualSplitForm.giaNuoc) : null,
        soNuoc: manualSplitForm.waterMode === 'meter' && manualSplitForm.soNuoc !== '' ? parseMoney(manualSplitForm.soNuoc) : null,
        kieuTinhTienNuoc: manualSplitForm.waterMode,
        moTa: manualSplitForm.moTa.trim(),
      });

      toast.success('Đã tạo hóa đơn chia tiền thủ công thành công!');
      setManualSplitForm(createManualSplitForm(phong));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chia tiền thủ công thất bại');
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
  const isMember = members.some(member => member.maNguoiDung === currentUser?.maNguoiDung);
  const canRequestJoin = !isOwner && !isMember && Boolean(phong.maPhong);
  const tienDienTinhToan = parseMoney(manualSplitForm.soDien) * parseMoney(manualSplitForm.giaDien);
  const tienNuocTinhToan = manualSplitForm.waterMode === 'meter'
    ? parseMoney(manualSplitForm.soNuoc) * parseMoney(manualSplitForm.giaNuoc)
    : parseMoney(manualSplitForm.tienNuocCoDinh);
  const tongChiPhiThuCong = parseMoney(manualSplitForm.tienPhong)
    + parseMoney(manualSplitForm.tienDichVu)
    + tienDienTinhToan
    + tienNuocTinhToan;

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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div className="room-detail-price">
                  <strong>{fmt(phong.giaTien)}</strong>
                  <span>/tháng</span>
                </div>
                {!isOwner && (
                  <ContentActionMenu
                    items={[
                      {
                        label: 'Báo cáo phòng',
                        danger: true,
                        onClick: () => {
                          if (!currentUser) {
                            navigate('/dang-nhap');
                            return;
                          }
                          setShowReportModal(true);
                        },
                      },
                    ]}
                  />
                )}
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
              <h2>Chi phí hàng tháng</h2>
            </div>
            <div className="room-detail-cost-grid">
              <div className="room-detail-cost-card"><span>Giá phòng</span><strong>{fmt(phong.giaTien)}/tháng</strong></div>
              <div className="room-detail-cost-card"><span>Tiền dịch vụ</span><strong>{fmt(phong.tienDichVu)}</strong></div>
              <div className="room-detail-cost-card"><span>Giá điện cấu hình</span><strong>{fmt(phong.tienDien)}/số</strong></div>
              <div className="room-detail-cost-card">
                <span>Cấu hình nước</span>
                <strong>{phong.kieuTinhTienNuoc === 'fixed' ? `${fmt(phong.tienNuoc)}/tháng` : `${fmt(phong.tienNuoc)}/1 m3`}</strong>
              </div>
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
                          onClick={() => setMemberMenu(prev => (prev === member.maNguoiDung ? null : member.maNguoiDung))}
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
                <h2>Yêu cầu phòng</h2>
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
                          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                            {yc.loaiYeuCau === 'ROI_PHONG' ? 'Yêu cầu rời phòng' : 'Yêu cầu tham gia phòng'}
                          </p>
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
                      onChange={event => handleManualSplitChange('moTa', event.target.value)}
                      placeholder="Ví dụ: Chia tiền tháng 5/2026"
                    />
                  </div>
                </div>

                <div className="room-detail-form-grid room-detail-form-grid-fixed">
                  <div className="form-group">
                    <label className="form-label">Tiền phòng</label>
                    <input className="form-control" value={fmt(manualSplitForm.tienPhong)} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tiền dịch vụ</label>
                    <input className="form-control" value={fmt(manualSplitForm.tienDichVu)} readOnly />
                  </div>
                </div>

                <div className="room-detail-split-card-grid">
                  <div className="room-detail-split-panel">
                    <div className="room-detail-split-panel-title">Tiền điện</div>
                    <div className="room-detail-inline-note">Giá điện: {fmt(manualSplitForm.giaDien)} / số</div>
                    <div className="form-group">
                      <label className="form-label">Nhập số điện tháng này</label>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={manualSplitForm.soDien}
                        onChange={event => handleManualSplitChange('soDien', clampNumberInput(event.target.value))}
                        placeholder="Mặc định 0"
                      />
                    </div>
                    <div className="room-detail-total-line">
                      <span>Thành tiền điện</span>
                      <strong>{fmt(tienDienTinhToan)}</strong>
                    </div>
                  </div>

                  <div className="room-detail-split-panel">
                    <div className="room-detail-split-panel-title">Tiền nước</div>
                    <div className="room-detail-inline-note">
                      {manualSplitForm.waterMode === 'meter' ? 'Cấu hình phòng: Tính theo số nước' : 'Cấu hình phòng: Nhập tiền cố định'}
                    </div>

                    {manualSplitForm.waterMode === 'meter' ? (
                      <>
                        <div className="room-detail-inline-note">Giá nước: {fmt(manualSplitForm.giaNuoc)} / 1 m3</div>
                        <div className="form-group">
                          <label className="form-label">Nhập số nước tháng này</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            step="0.1"
                            inputMode="decimal"
                            value={manualSplitForm.soNuoc}
                            onChange={event => handleManualSplitChange('soNuoc', clampNumberInput(event.target.value))}
                            placeholder="Mặc định 0"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Tiền nước tháng này</label>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          value={manualSplitForm.tienNuocCoDinh}
                          onChange={event => handleManualSplitChange('tienNuocCoDinh', clampNumberInput(event.target.value))}
                          placeholder="Nhập tiền nước"
                        />
                      </div>
                    )}

                    <div className="room-detail-total-line">
                      <span>Thành tiền nước</span>
                      <strong>{fmt(tienNuocTinhToan)}</strong>
                    </div>
                  </div>
                </div>

                <div className="room-detail-manual-summary">
                  <div className="room-detail-total-line">
                    <span>Tổng tiền cần chia</span>
                    <strong>{fmt(tongChiPhiThuCong)}</strong>
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

          {canRequestJoin && (
            <section className="card room-detail-owner-card room-detail-action-card">
              <div className="card-header">Yêu cầu tham gia</div>
              <div className="card-body">
                {conCho > 0 ? (
                  !showApply ? (
                    <button className="btn btn-primary btn-block btn-lg" onClick={() => setShowApply(true)}>
                      Gửi yêu cầu vào phòng này
                    </button>
                  ) : (
                    <>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Giới thiệu bản thân..."
                        value={moTaYeuCau}
                        onChange={event => setMoTaYeuCau(event.target.value)}
                      />
                      <button className="btn btn-primary btn-block" onClick={handleApply} disabled={applying}>
                        {applying ? 'Đang gửi...' : 'Gửi yêu cầu'}
                      </button>
                      <button className="btn btn-secondary btn-block" onClick={() => setShowApply(false)}>
                        Hủy
                      </button>
                    </>
                  )
                ) : (
                  <div className="room-detail-member-empty">Phòng hiện đã đủ người.</div>
                )}
              </div>
            </section>
          )}

          {isMember && !isOwner && (
            <section className="card room-detail-owner-card room-detail-action-card">
              <div className="card-header">Thành viên phòng</div>
              <div className="card-body">
                <button className="btn btn-danger btn-block" onClick={handleLeaveRoom} disabled={leavingRoom}>
                  {leavingRoom ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rời phòng'}
                </button>
              </div>
            </section>
          )}

          {isOwner && (
            <section className="card room-detail-owner-card room-detail-action-card">
              <div className="card-header">Quản lý phòng</div>
              <div className="card-body">
                <button className="btn btn-outline btn-block" onClick={() => navigate(`/phong/${id}/chinh-sua`)}>
                  Chỉnh sửa
                </button>
                <button className="btn btn-primary btn-block" onClick={() => setShowAddMemberModal(true)}>
                  Thêm thành viên
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

      <AddRoomMemberModal
        open={showAddMemberModal}
        maPhong={phong.maPhong}
        onClose={() => setShowAddMemberModal(false)}
        onAdded={fetchChiTietPhong}
      />
      <ReportContentModal
        open={showReportModal}
        title="Báo cáo phòng"
        targetLabel={phong.title || `Phòng #${phong.maPhong}`}
        onClose={() => setShowReportModal(false)}
        onSubmit={async payload => {
          await phongAPI.baoCao(phong.maPhong, payload);
          toast.success('Đã gửi báo cáo phòng');
        }}
      />
    </div>
  );
}
