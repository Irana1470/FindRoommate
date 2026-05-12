import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminChatAPI, nguoiDungAPI } from '../services/api';
import { formatConversationTime, getAvatarUrl } from '../utils/inbox';
import './AdminBaoCaoHoiThoai.css';

export default function AdminBaoCaoHoiThoai() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadReports = async () => {
    try {
      const response = await adminChatAPI.layBaoCaoHoiThoai();
      setReports(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được báo cáo hội thoại');
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
      const response = await adminChatAPI.capNhatBaoCaoHoiThoai(reportId, { trangThai, ghiChuXuLy });
      setReports(current => current.map(item => (item.maBaoCao === reportId ? response.data.data : item)));
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật báo cáo');
      throw error;
    } finally {
      setSavingId(null);
    }
  };

  const handleLockUser = async report => {
    const lyDo = window.prompt(`Nhập lý do khóa tài khoản ${report.nguoiBiBaoCao.hoTen}`, report.lyDo || 'Bị báo cáo qua hội thoại');
    if (lyDo === null) {
      return;
    }

    setSavingId(report.maBaoCao);
    try {
      await nguoiDungAPI.capNhatKhoaTaiKhoan(report.nguoiBiBaoCao.maNguoiDung, true, lyDo.trim() || 'Bị báo cáo qua hội thoại');
      await adminChatAPI.capNhatBaoCaoHoiThoai(report.maBaoCao, {
        trangThai: 'RESOLVED',
        ghiChuXuLy: 'Đã khóa tài khoản người dùng bị báo cáo',
      });
      toast.success('Đã khóa tài khoản');
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể khóa tài khoản');
    } finally {
      setSavingId(null);
    }
  };

  const handleUnlockUser = async report => {
    setSavingId(report.maBaoCao);
    try {
      await nguoiDungAPI.capNhatKhoaTaiKhoan(report.nguoiBiBaoCao.maNguoiDung, false, null);
      await adminChatAPI.capNhatBaoCaoHoiThoai(report.maBaoCao, {
        trangThai: 'REVIEWING',
        ghiChuXuLy: 'Đã mở khóa tài khoản để xem xét lại',
      });
      toast.success('Đã mở khóa tài khoản');
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể mở khóa tài khoản');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="admin-chat-report-page">
        <div className="admin-chat-report-header">
          <div>
            <h1>Quản lý báo cáo chat</h1>
            <p>Admin có thể xem báo cáo cuộc trò chuyện, đánh dấu xử lý và khóa tài khoản người dùng bị báo cáo.</p>
          </div>
        </div>

        {loading ? (
          <div className="card admin-chat-report-empty">Đang tải báo cáo...</div>
        ) : reports.length === 0 ? (
          <div className="card admin-chat-report-empty">Chưa có báo cáo cuộc trò chuyện nào.</div>
        ) : (
          <div className="admin-chat-report-list">
            {reports.map(report => (
              <article key={report.maBaoCao} className="card admin-chat-report-card">
                <div className="admin-chat-report-card-top">
                  <div>
                    <span className={`badge ${report.trangThai === 'NEW' ? 'badge-danger' : report.trangThai === 'REVIEWING' ? 'badge-warning' : 'badge-success'}`}>
                      {report.trangThai}
                    </span>
                    <h2>{report.lyDo}</h2>
                    <p>{report.chiTiet || 'Không có chi tiết bổ sung.'}</p>
                  </div>
                  <time>{formatConversationTime(report.ngayTao)}</time>
                </div>

                <div className="admin-chat-report-users">
                  <div className="admin-chat-report-user">
                    <img src={getAvatarUrl(report.nguoiBaoCao.hoTen, report.nguoiBaoCao.avatar)} alt={report.nguoiBaoCao.hoTen} className="avatar avatar-md" />
                    <div>
                      <strong>Người báo cáo: {report.nguoiBaoCao.hoTen}</strong>
                      <span>{report.nguoiBaoCao.email}</span>
                    </div>
                  </div>

                  <div className="admin-chat-report-user">
                    <img src={getAvatarUrl(report.nguoiBiBaoCao.hoTen, report.nguoiBiBaoCao.avatar)} alt={report.nguoiBiBaoCao.hoTen} className="avatar avatar-md" />
                    <div>
                      <strong>Người bị báo cáo: {report.nguoiBiBaoCao.hoTen}</strong>
                      <span>{report.nguoiBiBaoCao.email}</span>
                      <span className={`admin-chat-lock-state ${report.nguoiBiBaoCao.taiKhoanBiKhoa ? 'locked' : 'active'}`}>
                        {report.nguoiBiBaoCao.taiKhoanBiKhoa ? 'Tài khoản đang bị khóa' : 'Tài khoản đang hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-chat-report-preview">
                  <strong>Tin nhắn gần nhất</strong>
                  <span>{report.tinNhanGanNhat || 'Không có dữ liệu xem trước'}</span>
                </div>

                {report.ghiChuXuLy && (
                  <div className="admin-chat-report-note">
                    <strong>Ghi chú xử lý</strong>
                    <span>{report.ghiChuXuLy}</span>
                  </div>
                )}

                <div className="admin-chat-report-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleUpdateReport(report.maBaoCao, 'REVIEWING', 'Admin đang xem xét báo cáo')} disabled={savingId === report.maBaoCao}>
                    Đánh dấu đang xem xét
                  </button>
                  {report.nguoiBiBaoCao.taiKhoanBiKhoa ? (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleUnlockUser(report)} disabled={savingId === report.maBaoCao}>
                      Mở khóa tài khoản
                    </button>
                  ) : (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleLockUser(report)} disabled={savingId === report.maBaoCao}>
                      Khóa tài khoản
                    </button>
                  )}
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
