import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChatBox from '../components/chat/ChatBox';
import { danhGiaAPI, nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import './TrangCaNhanCongKhai.css';

const formatJoinDate = value => (
  value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
);

export default function TrangCaNhanCongKhai() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ soSao: 5, moTa: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProfile = () => {
    let active = true;

    setLoading(true);
    nguoiDungAPI.layTrangCaNhanCongKhai(id)
      .then(response => {
        if (active) {
          setProfile(response.data.data);
        }
      })
      .catch(error => {
        if (active) {
          setProfile(null);
          toast.error(error.response?.data?.message || 'Không tải được hồ sơ công khai');
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
  };

  useEffect(() => fetchProfile(), [id]);

  const handleSubmitReview = async event => {
    event.preventDefault();
    if (!profile?.maNguoiDung) {
      return;
    }

    setSubmittingReview(true);
    try {
      await danhGiaAPI.tao({
        maNguoiDuocDanhGia: profile.maNguoiDung,
        moTa: reviewForm.moTa,
        soSao: reviewForm.soSao,
      });
      toast.success('Đã gửi đánh giá');
      setReviewForm({ soSao: 5, moTa: '' });
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="spinner" />;
  }

  if (!profile) {
    return (
      <div className="container page-wrapper">
        <div className="alert alert-danger">Không tìm thấy hồ sơ công khai này.</div>
      </div>
    );
  }

  const isOwnProfile = user?.maNguoiDung === profile.maNguoiDung;
  const hasRating = profile.diemDanhGia !== null && profile.diemDanhGia !== undefined;
  const avatar = profile.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.hoTen || 'U')}&background=12355B&color=fff&size=160`;
  const thongTinNhanh = [
    ['Trạng thái xác thực', profile.xacThuc ? 'Đã xác thực CCCD' : 'Chưa xác thực'],
    ['Ngày tham gia', formatJoinDate(profile.ngayTao)],
    ['Mức độ uy tín', hasRating ? `${profile.diemDanhGia.toFixed(1)} / 5` : 'Chưa có đánh giá'],
    ['Hoạt động', `${profile.tongBaiDang ?? 0} bài đăng và ${profile.tongPhong ?? 0} phòng`],
  ];

  return (
    <div className="container page-wrapper">
      <div className="public-profile-layout">
        <div>
          <div className="card public-profile-hero">
            <div className="card-body public-profile-hero-body">
              <div className="public-profile-avatar">
                <img src={avatar} className="avatar avatar-xl public-profile-avatar-image" alt={profile.hoTen} />
              </div>

              <div className="public-profile-main">
                <div className="public-profile-title-row">
                  <h1>{profile.hoTen}</h1>
                  {profile.xacThuc && <span className="badge badge-success">Đã xác thực</span>}
                </div>

                <div className="public-profile-meta">
                  <span>Tham gia từ: {formatJoinDate(profile.ngayTao)}</span>
                  <span>Điểm đánh giá: {hasRating ? profile.diemDanhGia.toFixed(1) : 'Chưa có'}</span>
                  <span>Bài đăng: {profile.tongBaiDang ?? 0}</span>
                  <span>Phòng đang quản lý: {profile.tongPhong ?? 0}</span>
                </div>

                <div className="public-profile-actions">
                  {isOwnProfile ? (
                    <Link to="/ho-so" className="btn btn-primary">Về hồ sơ của tôi</Link>
                  ) : (
                    <Link to={`/tin-nhan?nguoiDung=${profile.maNguoiDung}`} className="btn btn-primary">Nhắn tin</Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="public-profile-stats">
            <div className="public-profile-stats-grid">
              <div className="stat-card">
                <div className="stat-value">{profile.tongPhong ?? 0}</div>
                <div className="stat-label">Phòng đang quản lý</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{profile.tongBaiDang ?? 0}</div>
                <div className="stat-label">Bài đăng đã tạo</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{hasRating ? profile.diemDanhGia.toFixed(1) : '0.0'}</div>
                <div className="stat-label">Điểm uy tín</div>
              </div>
            </div>
          </div>

          <div className="card public-profile-details-card">
            <div className="card-header">Thông tin nhanh</div>
            <div className="card-body public-profile-details">
              {thongTinNhanh.map(([label, value]) => (
                <div key={label} className="public-profile-detail-row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="card public-profile-review-form-card">
              <div className="card-header">Đánh giá người dùng này</div>
              <div className="card-body">
                <form onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label className="form-label">Số sao</label>
                    <div className="public-profile-star-row">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={`public-profile-star-btn ${star <= reviewForm.soSao ? 'active' : ''}`}
                          onClick={() => setReviewForm(current => ({ ...current, soSao: star }))}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nhận xét</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={reviewForm.moTa}
                      onChange={event => setReviewForm(current => ({ ...current, moTa: event.target.value }))}
                      placeholder="Chia sẻ cảm nhận của bạn về người dùng này..."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">Đánh giá nhận được</div>
            <div className="card-body">
              {!profile.danhGiaNhanDuoc?.length ? (
                <div className="review-empty">Người dùng này chưa có đánh giá công khai nào.</div>
              ) : (
                <div className="review-list">
                  {profile.danhGiaNhanDuoc.map(review => (
                    <div key={review.maDanhGia} className="review-item">
                      <Link to={`/nguoi-dung/${review.maNguoiDanhGia}`} className="public-profile-reviewer">
                        <img
                          src={review.avatarNguoiDanhGia || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.tenNguoiDanhGia || 'U')}&background=12355B&color=fff&size=48`}
                          className="avatar avatar-sm"
                          alt={review.tenNguoiDanhGia || 'Người đánh giá'}
                        />
                        <div>
                          <strong>{review.tenNguoiDanhGia || 'Người dùng ẩn danh'}</strong>
                          <div className="message-time">
                            {review.ngayDanhGia ? new Date(review.ngayDanhGia).toLocaleDateString('vi-VN') : ''}
                          </div>
                        </div>
                      </Link>

                      <div className="public-profile-review-score">Đánh giá: {review.soSao}/5</div>
                      <div className="public-profile-review-content">
                        {review.moTa || 'Không có nhận xét chi tiết'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="public-profile-sidebar">
          <div className="card public-profile-frame">
            <div className="card-body">
              {isOwnProfile ? (
                <div className="public-profile-owner-note" />
              ) : user ? (
                <div className="public-profile-owner-note">
                  Nhắn tin cho {profile.hoTen} để hỏi về việc tìm kiếm bạn ở ghép, trao đổi thông tin phòng trọ.
                </div>
              ) : (
                <>
                  <div className="public-profile-owner-note">
                    Đăng nhập để nhắn tin và đánh giá người dùng này.
                  </div>
                  <Link to="/dang-nhap" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
                    Đăng nhập để tiếp tục
                  </Link>
                </>
              )}
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="card public-profile-chat-card" id="chat-frame">
              <div className="card-header">Nhắn tin nhanh</div>
              <div className="card-body public-profile-chat-body">
                <ChatBox
                  maNguoiKia={profile.maNguoiDung}
                  tenNguoiKia={profile.hoTen}
                  avatarNguoiKia={profile.avatar}
                  embedded
                />
                <Link
                  to={`/tin-nhan?nguoiDung=${profile.maNguoiDung}`}
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: 16 }}
                >
                  Mở toàn bộ hộp thư
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
