import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { baiDangAPI, yeuCauAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import './ChiTietBaiDang.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ChiTietBaiDang() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [bd, setBd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [moTaYeuCau, setMoTaYeuCau] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [mediaIdx, setMediaIdx] = useState(0);

  useEffect(() => {
    baiDangAPI.layChiTiet(id)
      .then(response => setBd(response.data.data))
      .catch(() => toast.error('Không tìm thấy bài đăng'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      navigate('/dang-nhap');
      return;
    }

    if (!user.xacThuc) {
      toast.error('Bạn cần xác thực CCCD trước khi gửi yêu cầu');
      navigate('/xac-thuc');
      return;
    }

    setApplying(true);
    try {
      await yeuCauAPI.gui({ maPhong: bd.maPhong, moTa: moTaYeuCau });
      toast.success('Đã gửi yêu cầu tham gia');
      setShowApply(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setApplying(false);
    }
  };

  const mediaItems = useMemo(() => {
    if (!bd) {
      return [];
    }

    const items = (bd.images || []).map(src => ({ type: 'image', src }));
    if (bd.video) {
      items.unshift({ type: 'video', src: bd.video });
    }
    return items;
  }, [bd]);

  useEffect(() => {
    if (!mediaItems.length) {
      setMediaIdx(0);
      return;
    }

    if (mediaIdx > mediaItems.length - 1) {
      setMediaIdx(0);
    }
  }, [mediaItems, mediaIdx]);

  const goPrevMedia = () => {
    if (mediaItems.length <= 1) {
      return;
    }
    setMediaIdx(current => (current === 0 ? mediaItems.length - 1 : current - 1));
  };

  const goNextMedia = () => {
    if (mediaItems.length <= 1) {
      return;
    }
    setMediaIdx(current => (current === mediaItems.length - 1 ? 0 : current + 1));
  };

  if (loading) return <div className="spinner" />;
  if (!bd) {
    return (
      <div className="container page-wrapper">
        <div className="alert alert-danger">Không tìm thấy bài đăng.</div>
      </div>
    );
  }

  const currentMedia = mediaItems[mediaIdx] || null;

  return (
    <div className="container page-wrapper">
      <div className="chitiet-layout">
        <div>
          <div className="gallery">
            <div className="gallery-main">
              {currentMedia ? (
                currentMedia.type === 'video' ? (
                  <video src={currentMedia.src} controls className="gallery-video" />
                ) : (
                  <img src={currentMedia.src} alt="Phòng" />
                )
              ) : (
                <div className="gallery-placeholder">Nhà</div>
              )}

              {mediaItems.length > 1 && (
                <>
                  <button type="button" className="gallery-nav gallery-nav-left" onClick={goPrevMedia} aria-label="Xem media trước">
                    ‹
                  </button>
                  <button type="button" className="gallery-nav gallery-nav-right" onClick={goNextMedia} aria-label="Xem media tiếp theo">
                    ›
                  </button>
                </>
              )}
            </div>

            {mediaItems.length > 1 && (
              <div className="gallery-thumbs">
                {mediaItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.src}`}
                    type="button"
                    className={`gallery-thumb ${index === mediaIdx ? 'active' : ''}`}
                    onClick={() => setMediaIdx(index)}
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={item.src} muted className="gallery-thumb-media" />
                        <span className="gallery-thumb-badge">Video</span>
                      </>
                    ) : (
                      <img src={item.src} alt="" className="gallery-thumb-media" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {bd.video && (
              <div className="gallery-video-note">Bài đăng này có kèm video giới thiệu phòng.</div>
            )}
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-body">
              <h1 className="chitiet-title">{bd.moTa}</h1>
              <div className="chitiet-price">{fmt(bd.giaTien)}/tháng</div>
              <div className="chitiet-address">Địa chỉ: {bd.diaChi}</div>

              {bd.noiDung && (
                <div className="chitiet-content">
                  <h3>Mô tả chi tiết</h3>
                  <p>{bd.noiDung}</p>
                </div>
              )}

              {bd.maPhong && (
                <div className="chitiet-phong-info">
                  <h3>Thông tin phòng</h3>
                  <p>Mã phòng: #{bd.maPhong}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card poster-card">
            <div className="card-body">
              <h3 style={{ marginBottom: 16 }}>Người đăng</h3>

              <Link to={`/nguoi-dung/${bd.maNguoiDang}`} className="poster-info" style={{ textDecoration: 'none' }}>
                <img
                  src={bd.avatarNguoiDang || `https://ui-avatars.com/api/?name=${encodeURIComponent(bd.tenNguoiDang || 'U')}&background=12355B&color=fff&size=60`}
                  className="avatar avatar-lg"
                  alt={bd.tenNguoiDang || 'Người đăng'}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{bd.tenNguoiDang}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    Bấm vào avatar hoặc tên để xem hồ sơ công khai
                  </div>
                </div>
              </Link>

              <Link
                to={`/nguoi-dung/${bd.maNguoiDang}`}
                className="btn btn-outline btn-block"
                style={{ marginTop: 14 }}
              >
                Xem hồ sơ người đăng
              </Link>

              <div style={{ marginTop: 20 }}>
                <div className="info-row"><span>Lượt xem</span><strong>{bd.soLuotXem}</strong></div>
                <div className="info-row"><span>Ngày đăng</span><strong>{bd.ngayDang ? new Date(bd.ngayDang).toLocaleDateString('vi-VN') : ''}</strong></div>
                <div className="info-row">
                  <span>Trạng thái</span>
                  <span className={`badge ${bd.trangThai === 'Dang' ? 'badge-success' : 'badge-gray'}`}>
                    {bd.trangThai === 'Dang' ? 'Đang đăng' : bd.trangThai}
                  </span>
                </div>
              </div>

              {user?.maNguoiDung !== bd.maNguoiDang && (
                <div style={{ marginTop: 20 }}>
                  {!bd.maPhong ? (
                    <>
                      <button className="btn btn-primary btn-block btn-lg" disabled>
                        Gửi yêu cầu vào phòng này
                      </button>
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        Bài đăng này chưa liên kết với phòng cụ thể nên hiện chưa thể gửi yêu cầu tham gia.
                      </div>
                    </>
                  ) : !showApply ? (
                    <button className="btn btn-primary btn-block btn-lg" onClick={() => setShowApply(true)}>
                      Gửi yêu cầu vào phòng này
                    </button>
                  ) : (
                    <div>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Giới thiệu bản thân..."
                        value={moTaYeuCau}
                        onChange={event => setMoTaYeuCau(event.target.value)}
                        style={{ marginBottom: 10 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleApply} disabled={applying}>
                          {applying ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowApply(false)}>Hủy</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
