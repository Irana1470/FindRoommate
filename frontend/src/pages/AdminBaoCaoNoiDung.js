import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { adminContentAPI } from '../services/api';
import { formatConversationTime, getAvatarUrl } from '../utils/inbox';
import './AdminBaoCaoNoiDung.css';

export default function AdminBaoCaoNoiDung() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadReports = async () => {
    try {
      const response = await adminContentAPI.layBaoCaoNoiDung();
      setReports(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được báo cáo nội dung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpdateReport = async (reportId, trangThai, ghiChuXuLy = '') => {
    setSavingId(reportId);
    try {
      const response = await adminContentAPI.capNhatBaoCaoNoiDung(reportId, { trangThai, ghiChuXuLy });
      setReports(current => current.map(item => (item.maBaoCao === reportId ? response.data.data : item)));
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật báo cáo');
      throw error;
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteTarget = async report => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nội dung của ${report.loaiDoiTuong === 'ROOM' ? 'phòng' : 'bài đăng'} này?`)) {
      return;
    }

    setSavingId(report.maBaoCao);
    try {
      await adminContentAPI.xoaNoiDungBiBaoCao(report.maBaoCao);
      toast.success('Đã xóa nội dung vi phạm');
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa nội dung');
    } finally {
      setSavingId(null);
    }
  };

  const handleLockUser = async report => {
    const lyDo = window.prompt(`Nhập lý do khóa tài khoản ${report.nguoiBiBaoCao.hoTen}`, report.lyDo || 'Bị báo cáo nội dung');
    if (lyDo === null) {
      return;
    }

    setSavingId(report.maBaoCao);
    try {
      await adminContentAPI.khoaNguoiDung(report.maBaoCao, lyDo.trim() || 'Bị báo cáo nội dung');
      toast.success('Đã khóa tài khoản');
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể khóa tài khoản');
    } finally {
      setSavingId(null);
    }
  };

  const handleRestrictUser = async report => {
    const lyDo = window.prompt(`Nhập lý do hạn chế hoạt động của ${report.nguoiBiBaoCao.hoTen}`, report.lyDo || 'Bị báo cáo nội dung');
    if (lyDo === null) {
      return;
    }

    setSavingId(report.maBaoCao);
    try {
      await adminContentAPI.hanCheNguoiDung(report.maBaoCao, lyDo.trim() || 'Bị báo cáo nội dung');
      toast.success('Đã hạn chế người dùng');
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hạn chế người dùng');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="admin-content-report-page">
        <div className="admin-content-report-header">
          <div>
            <h1>Quản lý báo cáo nội dung</h1>
          </div>
        </div>

        {loading ? (
          <div className="card admin-content-report-empty">Đang tải báo cáo...</div>
        ) : reports.length === 0 ? (
          <div className="card admin-content-report-empty">Chưa có báo cáo nội dung nào.</div>
        ) : (
          <div className="admin-content-report-list">
            {reports.map(report => (
              <article key={report.maBaoCao} className="card admin-content-report-card">
                <div className="admin-content-report-card-top">
                  <div>
                    <div className="admin-content-report-meta-row">
                      <span className={`badge ${report.trangThai === 'NEW' ? 'badge-danger' : report.trangThai === 'REVIEWING' ? 'badge-warning' : 'badge-success'}`}>
                        {report.trangThai}
                      </span>
                      <span className="badge badge-secondary">{report.loaiDoiTuong === 'ROOM' ? 'Phòng' : 'Bài đăng'}</span>
                    </div>
                    <h2>{report.lyDo}</h2>
                    <p className="admin-content-report-target">{report.tieuDeDoiTuong} • #{report.maDoiTuong}</p>
                    <p>{report.chiTiet || 'Không có chi tiết bổ sung.'}</p>
                  </div>
                  <time>{formatConversationTime(report.ngayTao)}</time>
                </div>

                <div className="admin-content-report-users">
                  <div className="admin-content-report-user">
                    <Link to={`/nguoi-dung/${report.nguoiBaoCao.maNguoiDung}`} className="admin-content-user-link">
                      <img src={getAvatarUrl(report.nguoiBaoCao.hoTen, report.nguoiBaoCao.avatar)} alt={report.nguoiBaoCao.hoTen} className="avatar avatar-md" />
                      <div>
                        <strong>Người báo cáo: {report.nguoiBaoCao.hoTen}</strong>
                        <span>{report.nguoiBaoCao.email}</span>
                      </div>
                    </Link>
                  </div>

                  <div className="admin-content-report-user">
                    <Link to={`/nguoi-dung/${report.nguoiBiBaoCao.maNguoiDung}`} className="admin-content-user-link">
                      <img src={getAvatarUrl(report.nguoiBiBaoCao.hoTen, report.nguoiBiBaoCao.avatar)} alt={report.nguoiBiBaoCao.hoTen} className="avatar avatar-md" />
                      <div>
                        <strong>Người bị báo cáo: {report.nguoiBiBaoCao.hoTen}</strong>
                        <span>{report.nguoiBiBaoCao.email}</span>
                        <span className={`admin-content-state ${report.nguoiBiBaoCao.taiKhoanBiKhoa ? 'danger' : report.nguoiBiBaoCao.biHanCheHoatDong ? 'warning' : 'active'}`}>
                          {report.nguoiBiBaoCao.taiKhoanBiKhoa ? 'Tài khoản đang bị khóa' : report.nguoiBiBaoCao.biHanCheHoatDong ? 'Người dùng đang bị hạn chế' : 'Tài khoản đang hoạt động'}
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>

                {report.ghiChuXuLy && (
                  <div className="admin-content-report-note">
                    <strong>Ghi chú xử lý</strong>
                    <span>{report.ghiChuXuLy}</span>
                  </div>
                )}

                <div className="admin-content-report-note">
                  <strong>Chi tiết nội dung bị báo cáo</strong>
                  {report.loaiDoiTuong === 'ROOM' ? (
                    <Link to={`/phong/${report.maDoiTuong}`} className="btn btn-outline btn-sm">
                      Xem chi tiết phòng
                    </Link>
                  ) : (
                    <Link to={`/bai-dang/${report.maDoiTuong}`} className="btn btn-outline btn-sm">
                      Xem chi tiết bài đăng
                    </Link>
                  )}
                </div>

                <div className="admin-content-report-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleUpdateReport(report.maBaoCao, 'REVIEWING', 'Admin đang xem xét báo cáo')} disabled={savingId === report.maBaoCao}>
                    Đánh dấu xem xét
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDeleteTarget(report)} disabled={savingId === report.maBaoCao}>
                    Xóa nội dung
                  </button>
                  <button type="button" className="btn btn-warning btn-sm" onClick={() => handleRestrictUser(report)} disabled={savingId === report.maBaoCao}>
                    Hạn chế người dùng
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleLockUser(report)} disabled={savingId === report.maBaoCao}>
                    Khóa tài khoản
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleUpdateReport(report.maBaoCao, 'RESOLVED', 'Đã xử lý báo cáo')} disabled={savingId === report.maBaoCao}>
                    Đánh dấu đã xử lý
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
