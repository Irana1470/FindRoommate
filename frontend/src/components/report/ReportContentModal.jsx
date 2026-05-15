import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { REPORT_REASONS } from './reportConstants';
import './ReportContentModal.css';

export default function ReportContentModal({
  open,
  title,
  targetLabel,
  defaultReason = REPORT_REASONS[0],
  onClose,
  onSubmit,
}) {
  const [lyDo, setLyDo] = useState(defaultReason);
  const [chiTiet, setChiTiet] = useState('');
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => REPORT_REASONS, []);

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

  if (!open) {
    return null;
  }

  const handleSubmit = async event => {
    event.preventDefault();
    if (!lyDo) {
      toast.error('Vui lòng chọn lý do báo cáo');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        lyDo,
        chiTiet: chiTiet.trim(),
      });
      setLyDo(defaultReason);
      setChiTiet('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) {
      return;
    }
    setLyDo(defaultReason);
    setChiTiet('');
    onClose();
  };

  const modalContent = (
    <div
      className="report-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseDown={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        className="report-modal-card"
        onClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="report-modal-header">
          <div>
            <h3>{title}</h3>
            <p>{targetLabel}</p>
          </div>
          <button type="button" className="report-modal-close" onClick={handleClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="report-modal-form">
          <div className="form-group">
            <label className="form-label">Lý do báo cáo</label>
            <select className="form-control" value={lyDo} onChange={event => setLyDo(event.target.value)}>
              {options.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Chi tiết bổ sung</label>
            <textarea
              className="form-control"
              rows={4}
              value={chiTiet}
              onChange={event => setChiTiet(event.target.value)}
              placeholder="Mô tả ngắn gọn để admin dễ xử lý hơn"
            />
          </div>

          <div className="report-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className="btn btn-danger" disabled={saving}>
              {saving ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
