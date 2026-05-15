import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { banBeAPI } from '../services/api';
import './BanBe.css';

export default function BanBe() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ banBe: [], loiMoiDaNhan: [], loiMoiDaGui: [] });
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const response = await banBeAPI.layDanhSach();
      setData(response.data.data || { banBe: [], loiMoiDaNhan: [], loiMoiDaGui: [] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await banBeAPI.timNguoiDung(keyword.trim());
      setSearchResults(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tìm được người dùng');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async maNguoiDung => {
    try {
      await banBeAPI.guiLoiMoi(maNguoiDung);
      toast.success('Đã gửi lời mời kết bạn');
      await loadFriends();
      await handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời kết bạn');
    }
  };

  const handleRespond = async (maBanBe, chapNhan) => {
    try {
      await banBeAPI.phanHoiLoiMoi(maBanBe, chapNhan);
      toast.success(chapNhan ? 'Đã chấp nhận lời mời kết bạn' : 'Đã từ chối lời mời kết bạn');
      await loadFriends();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý lời mời');
    }
  };

  const handleRemove = async maBanBe => {
    try {
      await banBeAPI.xoaQuanHe(maBanBe);
      toast.success('Đã cập nhật danh sách bạn bè');
      await loadFriends();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật danh sách bạn bè');
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="friend-page">
        <div className="friend-header">
          <h1>Bạn bè</h1>
          <p>Tìm bạn bằng số điện thoại hoặc Gmail, quản lý lời mời và danh sách bạn bè của bạn.</p>
        </div>

        <section className="card friend-search-card">
          <div className="card-body friend-search-toolbar">
            <input
              className="form-control"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="Tìm bằng số điện thoại hoặc Gmail"
            />
            <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="friend-search-results">
              {searchResults.map(item => (
                <div key={item.maNguoiDung} className="friend-user-row">
                  <Link to={`/nguoi-dung/${item.maNguoiDung}`} className="friend-user-link">
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
                  </Link>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSendRequest(item.maNguoiDung)}>
                    Kết bạn
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <div className="card friend-empty">Đang tải dữ liệu bạn bè...</div>
        ) : (
          <div className="friend-grid">
            <section className="card friend-section">
              <div className="card-header">Lời mời đã nhận</div>
              <div className="card-body friend-list">
                {data.loiMoiDaNhan?.length ? data.loiMoiDaNhan.map(item => (
                  <div key={item.maBanBe} className="friend-user-row">
                    <Link to={`/nguoi-dung/${item.nguoiGui.maNguoiDung}`} className="friend-user-link">
                      <img
                        src={item.nguoiGui.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nguoiGui.hoTen || 'U')}&background=12355B&color=fff&size=56`}
                        alt={item.nguoiGui.hoTen}
                        className="avatar avatar-md"
                      />
                      <div>
                        <strong>{item.nguoiGui.hoTen}</strong>
                        <span>{item.nguoiGui.email}</span>
                      </div>
                    </Link>
                    <div className="friend-actions-inline">
                      <button type="button" className="btn btn-success btn-sm" onClick={() => handleRespond(item.maBanBe, true)}>
                        Chấp nhận
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => handleRespond(item.maBanBe, false)}>
                        Từ chối
                      </button>
                    </div>
                  </div>
                )) : <div className="friend-empty-inline">Chưa có lời mời nào.</div>}
              </div>
            </section>

            <section className="card friend-section">
              <div className="card-header">Lời mời đã gửi</div>
              <div className="card-body friend-list">
                {data.loiMoiDaGui?.length ? data.loiMoiDaGui.map(item => (
                  <div key={item.maBanBe} className="friend-user-row">
                    <Link to={`/nguoi-dung/${item.nguoiNhan.maNguoiDung}`} className="friend-user-link">
                      <img
                        src={item.nguoiNhan.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nguoiNhan.hoTen || 'U')}&background=12355B&color=fff&size=56`}
                        alt={item.nguoiNhan.hoTen}
                        className="avatar avatar-md"
                      />
                      <div>
                        <strong>{item.nguoiNhan.hoTen}</strong>
                        <span>{item.nguoiNhan.email}</span>
                      </div>
                    </Link>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleRemove(item.maBanBe)}>
                      Hủy lời mời
                    </button>
                  </div>
                )) : <div className="friend-empty-inline">Bạn chưa gửi lời mời nào.</div>}
              </div>
            </section>
          </div>
        )}

        <section className="card friend-section">
          <div className="card-header">Danh sách bạn bè</div>
          <div className="card-body friend-list">
            {loading ? null : data.banBe?.length ? data.banBe.map(item => (
              <div key={item.maNguoiDung} className="friend-user-row">
                <Link to={`/nguoi-dung/${item.maNguoiDung}`} className="friend-user-link">
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
                </Link>
              </div>
            )) : <div className="friend-empty-inline">Bạn chưa có bạn bè nào.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
