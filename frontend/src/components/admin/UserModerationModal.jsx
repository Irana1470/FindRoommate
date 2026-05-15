import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { nguoiDungAPI } from '../../services/api';
import './UserModerationModal.css';

const defaultRestrictionForm = {
  lyDoHanCheHoatDong: '',
  hanCheDangBai: true,
  hanCheTaoPhong: false,
  hanCheGuiYeuCauPhong: false,
  thoiGianHanCheDen: '',
};

export default function UserModerationModal({ open, user, onClose, onUpdated, initialMode = 'restrict' }) {
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [warningReason, setWarningReason] = useState('');
  const [restrictionForm, setRestrictionForm] = useState(defaultRestrictionForm);

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setMode(initialMode);
    setLockReason(user.lyDoKhoaTaiKhoan || '');
    setWarningReason(user.canhBaoTaiKhoan || '');
    setRestrictionForm({
      lyDoHanCheHoatDong: user.lyDoHanCheHoatDong || '',
      hanCheDangBai: Boolean(user.hanCheDangBai),
      hanCheTaoPhong: Boolean(user.hanCheTaoPhong),
      hanCheGuiYeuCauPhong: Boolean(user.hanCheGuiYeuCauPhong),
      thoiGianHanCheDen: user.thoiGianHanCheDen ? user.thoiGianHanCheDen.slice(0, 16) : '',
    });
  }, [open, user, initialMode]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !user) {
    return null;
  }

  const closeModal = () => {
    if (!saving) {
      onClose();
    }
  };

  const handleLockUser = async () => {
    setSaving(true);
    try {
      await nguoiDungAPI.capNhatKhoaTaiKhoan(
        user.maNguoiDung,
        true,
        lockReason.trim() || 'Vi phạm quy định nền tảng'
      );
      toast.success('Đã khóa tài khoản');
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể khóa tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlockUser = async () => {
    setSaving(true);
    try {
      await nguoiDungAPI.capNhatKhoaTaiKhoan(user.maNguoiDung, false, null);
      toast.success('Đã mở khóa tài khoản');
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể mở khóa tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const handleRestrictUser = async () => {
    if (!restrictionForm.hanCheDangBai && !restrictionForm.hanCheTaoPhong && !restrictionForm.hanCheGuiYeuCauPhong) {
      toast.error('Vui lòng chọn ít nhất một quyền cần hạn chế');
      return;
    }
    if (!restrictionForm.thoiGianHanCheDen) {
      toast.error('Vui lòng nhập thời gian hết hạn hạn chế');
      return;
    }

    setSaving(true);
    try {
      await nguoiDungAPI.capNhatHanCheHoatDong(user.maNguoiDung, {
        biHanCheHoatDong: true,
        lyDoHanCheHoatDong: restrictionForm.lyDoHanCheHoatDong.trim() || 'Vi phạm quy định nền tảng',
        hanCheDangBai: restrictionForm.hanCheDangBai,
        hanCheTaoPhong: restrictionForm.hanCheTaoPhong,
        hanCheGuiYeuCauPhong: restrictionForm.hanCheGuiYeuCauPhong,
        thoiGianHanCheDen: restrictionForm.thoiGianHanCheDen,
      });
      toast.success('Đã hạn chế người dùng');
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hạn chế người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRestriction = async () => {
    setSaving(true);
    try {
      await nguoiDungAPI.capNhatHanCheHoatDong(user.maNguoiDung, {
        biHanCheHoatDong: false,
        lyDoHanCheHoatDong: null,
        hanCheDangBai: false,
        hanCheTaoPhong: false,
        hanCheGuiYeuCauPhong: false,
        thoiGianHanCheDen: null,
      });
      toast.success('Đã gỡ hạn chế tài khoản');
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gỡ hạn chế');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWarning = async () => {
    if (!warningReason.trim()) {
      toast.error('Vui lòng nhập nội dung cảnh báo');
      return;
    }

    setSaving(true);
    try {
      await nguoiDungAPI.capNhatCanhBaoTaiKhoan(user.maNguoiDung, warningReason.trim());
      toast.success('Đã lưu cảnh báo');
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu cảnh báo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWarning = async () => {
    setSaving(true);
    try {
      await nguoiDungAPI.capNhatCanhBaoTaiKhoan(user.maNguoiDung, null);
      toast.success('Đã gỡ cảnh báo');
      await onUpdated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gỡ cảnh báo');
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div
      className="user-moderation-overlay"
      onMouseDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
      <div className="user-moderation-card">
        <div className="user-moderation-header">
          <div>
            <h3>Quản lý người dùng</h3>
            <p>{user.hoTen}</p>
          </div>
          <button type="button" className="user-moderation-close" onClick={closeModal} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="user-moderation-tabs">
          <button
            type="button"
            className={`btn btn-sm ${mode === 'restrict' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('restrict')}
          >
            Hạn chế
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'warning' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('warning')}
          >
            Cảnh báo
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'lock' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('lock')}
          >
            Khóa tài khoản
          </button>
        </div>

        {mode === 'restrict' && (
          <div className="user-moderation-body">
            <label className="form-label">Lý do hạn chế</label>
            <textarea
              className="form-control"
              rows={3}
              value={restrictionForm.lyDoHanCheHoatDong}
              onChange={event => setRestrictionForm(current => ({ ...current, lyDoHanCheHoatDong: event.target.value }))}
              placeholder="Nhập lý do hạn chế"
            />

            <label className="form-label">Chức năng bị hạn chế</label>
            <div className="user-moderation-checks">
              <label>
                <input
                  type="checkbox"
                  checked={restrictionForm.hanCheDangBai}
                  onChange={event => setRestrictionForm(current => ({ ...current, hanCheDangBai: event.target.checked }))}
                />
                Hạn chế đăng bài
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={restrictionForm.hanCheTaoPhong}
                  onChange={event => setRestrictionForm(current => ({ ...current, hanCheTaoPhong: event.target.checked }))}
                />
                Hạn chế tạo phòng
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={restrictionForm.hanCheGuiYeuCauPhong}
                  onChange={event => setRestrictionForm(current => ({ ...current, hanCheGuiYeuCauPhong: event.target.checked }))}
                />
                Hạn chế gửi yêu cầu tham gia phòng
              </label>
            </div>

            <label className="form-label">Thời gian hạn chế đến</label>
            <input
              type="datetime-local"
              className="form-control"
              value={restrictionForm.thoiGianHanCheDen}
              onChange={event => setRestrictionForm(current => ({ ...current, thoiGianHanCheDen: event.target.value }))}
            />

            <div className="user-moderation-actions">
              {user.biHanCheHoatDong && (
                <button type="button" className="btn btn-outline" onClick={handleRemoveRestriction} disabled={saving}>
                  Gỡ hạn chế
                </button>
              )}
              <button type="button" className="btn btn-warning" onClick={handleRestrictUser} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu hạn chế'}
              </button>
            </div>
          </div>
        )}

        {mode === 'warning' && (
          <div className="user-moderation-body">
            <label className="form-label">Nội dung cảnh báo</label>
            <textarea
              className="form-control"
              rows={4}
              value={warningReason}
              onChange={event => setWarningReason(event.target.value)}
              placeholder="Ví dụ: Tài khoản này bị cảnh báo do spam"
            />

            <div className="user-moderation-actions">
              {user.canhBaoTaiKhoan && (
                <button type="button" className="btn btn-outline" onClick={handleRemoveWarning} disabled={saving}>
                  Gỡ cảnh báo
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleSaveWarning} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu cảnh báo'}
              </button>
            </div>
          </div>
        )}

        {mode === 'lock' && (
          <div className="user-moderation-body">
            <label className="form-label">Lý do khóa tài khoản</label>
            <textarea
              className="form-control"
              rows={4}
              value={lockReason}
              onChange={event => setLockReason(event.target.value)}
              placeholder="Nhập lý do khóa tài khoản"
            />

            <div className="user-moderation-actions">
              {user.taiKhoanBiKhoa && (
                <button type="button" className="btn btn-outline" onClick={handleUnlockUser} disabled={saving}>
                  Mở khóa tài khoản
                </button>
              )}
              <button type="button" className="btn btn-danger" onClick={handleLockUser} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Khóa tài khoản'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
