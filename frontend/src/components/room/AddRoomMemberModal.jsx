import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { banBeAPI, phongAPI } from '../../services/api';
import './AddRoomMemberModal.css';

export default function AddRoomMemberModal({ open, maPhong, onClose, onAdded }) {
  const [friends, setFriends] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setLoading(true);
    banBeAPI.layDanhSach()
      .then(response => {
        if (active) {
          setFriends(response.data.data?.banBe || []);
        }
      })
      .catch(error => {
        if (active) {
          toast.error(error.response?.data?.message || 'Không tải được danh sách bạn bè');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

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

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await banBeAPI.timNguoiDung(searchKeyword.trim());
      setSearchResults(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tìm được người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async maNguoiDung => {
    setSavingUserId(maNguoiDung);
    try {
      await phongAPI.themThanhVien(maPhong, maNguoiDung);
      toast.success('Đã thêm thành viên vào phòng');
      await onAdded?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm thành viên vào phòng');
    } finally {
      setSavingUserId(null);
    }
  };

  const renderUserRow = item => (
    <div key={item.maNguoiDung} className="add-room-member-row">
      <div className="add-room-member-user">
        <img
          src={item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.hoTen || 'U')}&background=12355B&color=fff&size=56`}
          alt={item.hoTen}
          className="avatar avatar-md"
        />
        <div>
          <strong>{item.hoTen}</strong>
          <span>{item.email || 'Chưa có Gmail'}</span>
          <span>{item.soDienThoai || 'Chưa có số điện thoại'}</span>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => handleAddMember(item.maNguoiDung)}
        disabled={savingUserId === item.maNguoiDung}
      >
        {savingUserId === item.maNguoiDung ? 'Đang thêm...' : 'Thêm vào phòng'}
      </button>
    </div>
  );

  const content = (
    <div className="add-room-member-overlay" onClick={event => event.stopPropagation()}>
      <div className="add-room-member-card">
        <div className="add-room-member-header">
          <div>
            <h3>Thêm thành viên vào phòng</h3>
            <p>Chọn từ danh sách bạn bè hoặc tìm bằng số điện thoại, Gmail.</p>
          </div>
          <button type="button" className="add-room-member-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="add-room-member-search">
          <input
            className="form-control"
            value={searchKeyword}
            onChange={event => setSearchKeyword(event.target.value)}
            placeholder="Nhập số điện thoại hoặc Gmail"
          />
          <button type="button" className="btn btn-secondary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="add-room-member-section">
            <strong>Kết quả tìm kiếm</strong>
            <div className="add-room-member-list">
              {searchResults.map(renderUserRow)}
            </div>
          </div>
        )}

        <div className="add-room-member-section">
          <strong>Danh sách bạn bè</strong>
          <div className="add-room-member-list">
            {friends.length > 0 ? friends.map(renderUserRow) : (
              <div className="add-room-member-empty">Bạn chưa có bạn bè nào để thêm nhanh vào phòng.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
