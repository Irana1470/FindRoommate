import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { phongAPI, thanhToanAPI, yeuCauAPI } from '../services/api';
import { buildPhongAddress } from '../utils/location';
import './QuanLyPhong.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

function DotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.9" fill="currentColor" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      <circle cx="18" cy="12" r="1.9" fill="currentColor" />
    </svg>
  );
}

const createManualSplitForm = () => ({
  maPhong: null,
  tienPhong: '',
  tienDichVu: '',
  tienDien: '',
  tienNuoc: '',
  moTa: '',
});

export default function QuanLyPhong() {
  const navigate = useNavigate();
  const [phongs, setPhongs] = useState([]);
  const [phongThamGia, setPhongThamGia] = useState([]);
  const [yeuCaus, setYeuCaus] = useState({});
  const [selectedPhong, setSelectedPhong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingPhongId, setDeletingPhongId] = useState(null);
  const [memberMenu, setMemberMenu] = useState(null);
  const [manualSplitForm, setManualSplitForm] = useState(createManualSplitForm());
  const [manualSplitLoading, setManualSplitLoading] = useState(false);

  const fetchPhongs = async () => {
    setLoading(true);
    try {
      const [ownedRes, joinedRes] = await Promise.all([
        phongAPI.layPhongCuaToi(),
        phongAPI.layPhongThamGia().catch(() => ({ data: { data: [] } })),
      ]);
      setPhongs(ownedRes.data.data || []);
      setPhongThamGia(joinedRes.data.data || []);
    } catch {
      toast.error('Khong tai duoc danh sach phong');
    }
    setLoading(false);
  };

  const fetchYeuCau = async maPhong => {
    try {
      const res = await yeuCauAPI.layCuaPhong(maPhong);
      setYeuCaus(prev => ({ ...prev, [maPhong]: res.data.data || [] }));
    } catch {
      toast.error('Khong tai duoc yeu cau tham gia');
    }
  };

  useEffect(() => {
    fetchPhongs();
  }, []);

  const handleDuyet = async (maYeuCau, chapNhan, maPhong) => {
    try {
      await yeuCauAPI.duyet(maYeuCau, chapNhan);
      toast.success(chapNhan ? 'Da chap nhan yeu cau' : 'Da tu choi yeu cau');
      fetchPhongs();
      fetchYeuCau(maPhong);
    } catch (err) {
      toast.error(err.response?.data?.message || 'That bai');
    }
  };

  const handleChiaTuDong = async maPhong => {
    try {
      await thanhToanAPI.chiaTien(maPhong);
      toast.success('Da chia tu dong theo cong thuc: tien phong + dien + nuoc + dich vu');
    } catch (err) {
      toast.error(err.response?.data?.message || 'That bai');
    }
  };

  const handleChiaThuCong = async event => {
    event.preventDefault();
    if (!manualSplitForm.maPhong) {
      return;
    }

    setManualSplitLoading(true);
    try {
      await thanhToanAPI.chiaTienThuCong(manualSplitForm.maPhong, {
        tienPhong: parseFloat(manualSplitForm.tienPhong || 0),
        tienDichVu: parseFloat(manualSplitForm.tienDichVu || 0),
        tienDien: parseFloat(manualSplitForm.tienDien || 0),
        tienNuoc: parseFloat(manualSplitForm.tienNuoc || 0),
        moTa: manualSplitForm.moTa,
      });
      toast.success('Da tao hoa don chia tien thu cong');
      setManualSplitForm(createManualSplitForm());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chia tien thu cong that bai');
    } finally {
      setManualSplitLoading(false);
    }
  };

  const handleXoaThanhVien = async (maPhong, maThanhVien) => {
    if (!window.confirm('Ban co chac muon xoa thanh vien nay khoi phong khong?')) {
      return;
    }

    try {
      await phongAPI.xoaThanhVien(maPhong, maThanhVien);
      toast.success('Da xoa thanh vien khoi phong');
      setMemberMenu(null);
      fetchPhongs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoa thanh vien that bai');
    }
  };

  const handleDoiTrangThai = async (maPhong, trangThai) => {
    try {
      await phongAPI.capNhat(maPhong, { trangThai });
      toast.success('Cap nhat trang thai thanh cong');
      fetchPhongs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'That bai');
    }
  };

  const handleDeletePhong = async maPhong => {
    if (!window.confirm('Ban co chac muon xoa phong nay khong?')) return;

    setDeletingPhongId(maPhong);
    try {
      await phongAPI.xoa(maPhong);
      setPhongs(current => current.filter(phong => phong.maPhong !== maPhong));
      setSelectedPhong(current => (current === maPhong ? null : current));
      setYeuCaus(current => {
        const next = { ...current };
        delete next[maPhong];
        return next;
      });
      toast.success('Da xoa phong thanh cong');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoa phong that bai');
    }
    setDeletingPhongId(null);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-title-row">
        <h1 className="section-title" style={{ marginBottom: 0 }}>Quan ly phong</h1>
        <Link to="/tao-phong" className="btn btn-primary">Them phong moi</Link>
      </div>

      {phongs.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">Chia tien thu cong</div>
          <div className="card-body">
            <form onSubmit={handleChiaThuCong}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Chon phong</label>
                  <select
                    className="form-control"
                    value={manualSplitForm.maPhong || ''}
                    onChange={event => setManualSplitForm(current => ({ ...current, maPhong: Number(event.target.value) || null }))}
                    required
                  >
                    <option value="">-- Chon phong --</option>
                    {phongs.map(phong => (
                      <option key={phong.maPhong} value={phong.maPhong}>{phong.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mo ta</label>
                  <input
                    className="form-control"
                    value={manualSplitForm.moTa}
                    onChange={event => setManualSplitForm(current => ({ ...current, moTa: event.target.value }))}
                    placeholder="VD: Chia tien thang 4"
                  />
                </div>
              </div>

              <div className="grid-4">
                <div className="form-group">
                  <label className="form-label">Tien phong</label>
                  <input className="form-control" type="number" min="0" value={manualSplitForm.tienPhong} onChange={event => setManualSplitForm(current => ({ ...current, tienPhong: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tien dich vu</label>
                  <input className="form-control" type="number" min="0" value={manualSplitForm.tienDichVu} onChange={event => setManualSplitForm(current => ({ ...current, tienDichVu: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tien dien</label>
                  <input className="form-control" type="number" min="0" value={manualSplitForm.tienDien} onChange={event => setManualSplitForm(current => ({ ...current, tienDien: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tien nuoc</label>
                  <input className="form-control" type="number" min="0" value={manualSplitForm.tienNuoc} onChange={event => setManualSplitForm(current => ({ ...current, tienNuoc: event.target.value }))} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={manualSplitLoading}>
                {manualSplitLoading ? 'Dang tao...' : 'Chia tien thu cong'}
              </button>
            </form>
          </div>
        </div>
      )}

      {phongs.length === 0 ? (
        <div className="empty-state card">
          <div className="card-body">
            <div className="empty-state-icon">🏠</div>
            <p>Ban chua co phong nao. <Link to="/tao-phong">Tao phong ngay</Link></p>
          </div>
        </div>
      ) : (
        <div className="phong-manage-list">
          {phongs.map(phong => (
            <div key={phong.maPhong} className="card phong-manage-card">
              <div className="phong-manage-header">
                <div>
                  <h3>{phong.title}</h3>
                  <div className="phong-manage-subtitle">
                    {buildPhongAddress(phong)} · {fmt(phong.giaTien)}/thang
                  </div>
                </div>

                <div className="phong-manage-header-actions">
                  <span className={`badge ${
                    phong.trangThai === 'San sang'
                      ? 'badge-success'
                      : phong.trangThai === 'Da day'
                        ? 'badge-danger'
                        : 'badge-warning'
                  }`}>
                    {phong.trangThai === 'San sang' ? 'San sang' : phong.trangThai === 'Da day' ? 'Da day' : 'Bao tri'}
                  </span>

                  <select
                    className="form-control phong-status-select"
                    value={phong.trangThai}
                    onChange={e => handleDoiTrangThai(phong.maPhong, e.target.value)}
                  >
                    <option value="San sang">San sang</option>
                    <option value="Da day">Da day</option>
                    <option value="Bao tri">Bao tri</option>
                  </select>
                </div>
              </div>

              <div className="phong-manage-body">
                <div className="phong-manage-main">
                  <div className="room-cost-grid">
                    <div className="room-cost-card"><span>Gia phong</span><strong>{fmt(phong.giaTien)}/thang</strong></div>
                    <div className="room-cost-card"><span>Tien dich vu</span><strong>{fmt(phong.tienDichVu)}</strong></div>
                    <div className="room-cost-card"><span>Tien dien</span><strong>{fmt(phong.tienDien)}</strong></div>
                    <div className="room-cost-card"><span>Tien nuoc</span><strong>{fmt(phong.tienNuoc)}</strong></div>
                  </div>

                  <div className="members-section">
                    <h4>Thanh vien phong ({phong.soNguoiHienTai}/{phong.soNguoiToiDa})</h4>
                    <div className="members-list-column">
                      {phong.danhSachThanhVien?.map(member => (
                        <div key={member.maNguoiDung} className="member-row">
                          <Link to={`/nguoi-dung/${member.maNguoiDung}`} className="member-profile-link member-row-link">
                            <img
                              src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.hoTen)}&background=12355B&color=fff&size=40`}
                              className="avatar avatar-sm"
                              alt={member.hoTen}
                            />
                            <div className="member-row-text">
                              <strong>{member.hoTen}</strong>
                              <span>{member.ngayThamGia ? `Vao phong: ${new Date(member.ngayThamGia).toLocaleDateString('vi-VN')}` : 'Thanh vien hien tai'}</span>
                            </div>
                          </Link>

                          <div className="member-menu-wrap">
                            <button
                              type="button"
                              className="member-menu-trigger"
                              onClick={() => setMemberMenu(current => (
                                current?.maPhong === phong.maPhong && current?.maThanhVien === member.maNguoiDung
                                  ? null
                                  : { maPhong: phong.maPhong, maThanhVien: member.maNguoiDung }
                              ))}
                            >
                              <DotIcon />
                            </button>

                            {memberMenu?.maPhong === phong.maPhong && memberMenu?.maThanhVien === member.maNguoiDung && (
                              <div className="member-menu-dropdown">
                                <button type="button" className="member-menu-item" onClick={() => handleXoaThanhVien(phong.maPhong, member.maNguoiDung)}>
                                  Xoa thanh vien
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {phong.danhSachThanhVien?.length === 0 && (
                        <p className="member-empty">Chua co thanh vien</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="phong-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/phong/${phong.maPhong}`)}>Xem chi tiet phong</button>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/phong/${phong.maPhong}/chinh-sua`)}>Chinh sua phong</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    fetchYeuCau(phong.maPhong);
                    setSelectedPhong(current => (current === phong.maPhong ? null : phong.maPhong));
                  }}>
                    {selectedPhong === phong.maPhong ? 'An yeu cau' : 'Xem yeu cau'}
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => handleChiaTuDong(phong.maPhong)}>Chia tu dong</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePhong(phong.maPhong)} disabled={deletingPhongId === phong.maPhong}>
                    {deletingPhongId === phong.maPhong ? 'Dang xoa...' : 'Xoa phong'}
                  </button>
                </div>
              </div>

              {selectedPhong === phong.maPhong && (
                <div className="yeu-cau-panel">
                  <h4>Yeu cau tham gia</h4>
                  {(yeuCaus[phong.maPhong] || []).length === 0 ? (
                    <p className="member-empty">Chua co yeu cau nao.</p>
                  ) : (
                    (yeuCaus[phong.maPhong] || []).map(yc => (
                      <div key={yc.maYeuCau} className="yeu-cau-item">
                        <Link to={`/nguoi-dung/${yc.maNguoiDung}`} className="yeu-cau-user-link">
                          <img
                            src={yc.avatarNguoiDung || `https://ui-avatars.com/api/?name=${encodeURIComponent(yc.tenNguoiDung)}&size=40`}
                            className="avatar avatar-sm"
                            alt={yc.tenNguoiDung}
                          />
                          <div style={{ flex: 1 }}>
                            <strong>{yc.tenNguoiDung}</strong>
                            {yc.moTa && <p className="yeu-cau-note">{yc.moTa}</p>}
                          </div>
                        </Link>
                        <span className={`badge ${yc.trangThai === 'Chap nhan' ? 'badge-success' : yc.trangThai === 'Tu choi' ? 'badge-danger' : 'badge-warning'}`}>
                          {yc.trangThai === 'Chap nhan' ? 'Da chap nhan' : yc.trangThai === 'Tu choi' ? 'Da tu choi' : 'Cho duyet'}
                        </span>
                        {yc.trangThai === 'Cho duyet' && (
                          <div className="yeu-cau-action-row">
                            <button className="btn btn-success btn-sm" onClick={() => handleDuyet(yc.maYeuCau, true, phong.maPhong)}>Duyet</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDuyet(yc.maYeuCau, false, phong.maPhong)}>Tu choi</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 28 }}>
        <div className="card-header">Phong toi tham gia</div>
        <div className="card-body">
          {phongThamGia.length === 0 ? (
            <div className="member-empty">Ban chua tham gia phong nao.</div>
          ) : (
            <div className="joined-room-list">
              {phongThamGia.map(phong => (
                <div key={phong.maPhong} className="joined-room-item">
                  <div>
                    <strong>{phong.title}</strong>
                    <div className="phong-manage-subtitle">{buildPhongAddress(phong)} · {fmt(phong.giaTien)}/thang</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/phong/${phong.maPhong}`)}>
                    Xem chi tiet phong
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
