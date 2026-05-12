import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { addressAPI, baiDangAPI, phongAPI } from '../services/api';
import './TaoBaiDang.css';

const createInitialForm = () => ({
  moTa: '',
  noiDung: '',
  giaTien: '',
  tinhThanh: '',
  quanHuyen: '',
  diaChi: '',
  maPhong: '',
  trangThai: 'Dang',
});

export default function TaoBaiDang() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(createInitialForm);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [existingVideo, setExistingVideo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [loadingTinhThanh, setLoadingTinhThanh] = useState(true);
  const [loadingQuanHuyen, setLoadingQuanHuyen] = useState(false);
  const [loadingPhong, setLoadingPhong] = useState(true);
  const [phongSoHuu, setPhongSoHuu] = useState([]);
  const [tinhThanhs, setTinhThanhs] = useState([]);
  const [quanHuyens, setQuanHuyens] = useState([]);
  const [selectedTinhThanhCode, setSelectedTinhThanhCode] = useState('');
  const [selectedQuanHuyenCode, setSelectedQuanHuyenCode] = useState('');

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const appendMedia = useCallback(acceptedFiles => {
    if (!acceptedFiles.length) {
      return;
    }

    const imageFiles = acceptedFiles.filter(file => file.type?.startsWith('image/'));
    const videoFiles = acceptedFiles.filter(file => file.type?.startsWith('video/'));

    if (imageFiles.length > 0) {
      setFiles(prev => [...prev, ...imageFiles]);
      setPreviews(prev => [...prev, ...imageFiles.map(file => URL.createObjectURL(file))]);
    }

    if (videoFiles.length > 0) {
      const nextVideo = videoFiles[0];
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(nextVideo);
      setVideoPreview(URL.createObjectURL(nextVideo));

      if (videoFiles.length > 1) {
        toast('Chỉ hỗ trợ 1 video cho mỗi bài đăng, mình đã giữ video đầu tiên.');
      } else if (acceptedFiles.length > 1 && imageFiles.length > 0) {
        toast.success('Đã thêm ảnh và video vào bài đăng.');
      }
    }
  }, [videoPreview]);

  const onDrop = useCallback(accepted => {
    appendMedia(accepted);
  }, [appendMedia]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    multiple: true,
  });

  useEffect(() => () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
  }, [previews, videoPreview]);

  useEffect(() => {
    let active = true;

    addressAPI.layTinhThanh()
      .then(response => {
        if (active) {
          setTinhThanhs(response.data || []);
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Không tải được danh sách tỉnh thành');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingTinhThanh(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    phongAPI.layPhongCuaToi()
      .then(response => {
        if (active) {
          setPhongSoHuu(response.data.data || []);
        }
      })
      .catch(() => {
        if (active) {
          setPhongSoHuu([]);
          toast.error('Không tải được danh sách phòng');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPhong(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLoadingPost(isEditMode);
    setForm(createInitialForm());
    setFiles([]);
    setPreviews([]);
    setExistingImages([]);
    setVideoFile(null);
    setVideoPreview('');
    setExistingVideo('');
    setSelectedTinhThanhCode('');
    setSelectedQuanHuyenCode('');
    setQuanHuyens([]);

    if (!isEditMode) {
      setLoadingPost(false);
      return;
    }

    let active = true;

    baiDangAPI.layBaiDangCuaToi()
      .then(response => {
        if (!active) {
          return;
        }

        const post = (response.data.data || []).find(item => String(item.maBaiDang) === String(id));
        if (!post) {
          toast.error('Bạn không có quyền sửa bài đăng này');
          navigate('/ho-so', { replace: true });
          return;
        }

        setForm({
          moTa: post.moTa || '',
          noiDung: post.noiDung || '',
          giaTien: post.giaTien || '',
          tinhThanh: post.tinhThanh || '',
          quanHuyen: post.quanHuyen || '',
          diaChi: post.diaChi || '',
          maPhong: post.maPhong ? String(post.maPhong) : '',
          trangThai: post.trangThai || 'Dang',
        });
        setExistingImages(post.images || []);
        setExistingVideo(post.video || '');
      })
      .catch(() => {
        if (active) {
          toast.error('Không tải được bài đăng để chỉnh sửa');
          navigate('/ho-so', { replace: true });
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPost(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    if (!tinhThanhs.length || !form.tinhThanh) {
      return;
    }

    const matched = tinhThanhs.find(item => item.name === form.tinhThanh);
    if (matched && String(matched.code) !== String(selectedTinhThanhCode)) {
      setSelectedTinhThanhCode(String(matched.code));
    }
  }, [tinhThanhs, form.tinhThanh, selectedTinhThanhCode]);

  useEffect(() => {
    let active = true;

    if (!selectedTinhThanhCode) {
      setQuanHuyens([]);
      return undefined;
    }

    setLoadingQuanHuyen(true);

    addressAPI.layTinhThanhChiTiet(selectedTinhThanhCode)
      .then(response => {
        if (!active) {
          return;
        }

        setQuanHuyens(response.data?.districts || []);
      })
      .catch(() => {
        if (active) {
          toast.error('Không tải được danh sách quận huyện');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingQuanHuyen(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTinhThanhCode]);

  useEffect(() => {
    if (!quanHuyens.length || !form.quanHuyen) {
      return;
    }

    const matchedDistrict = quanHuyens.find(item => item.name === form.quanHuyen);
    if (matchedDistrict && String(matchedDistrict.code) !== String(selectedQuanHuyenCode)) {
      setSelectedQuanHuyenCode(String(matchedDistrict.code));
    }
  }, [quanHuyens, form.quanHuyen, selectedQuanHuyenCode]);

  const handleTinhThanhChange = event => {
    const nextCode = event.target.value;
    const selectedTinhThanh = tinhThanhs.find(item => String(item.code) === nextCode);

    setSelectedTinhThanhCode(nextCode);
    setSelectedQuanHuyenCode('');
    setQuanHuyens([]);
    setForm(current => ({
      ...current,
      tinhThanh: selectedTinhThanh?.name || '',
      quanHuyen: '',
    }));
  };

  const handleQuanHuyenChange = event => {
    const nextCode = event.target.value;
    const selectedQuanHuyen = quanHuyens.find(item => String(item.code) === nextCode);

    setSelectedQuanHuyenCode(nextCode);
    set('quanHuyen', selectedQuanHuyen?.name || '');
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
    setExistingVideo('');
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!form.moTa || !form.giaTien || !form.tinhThanh || !form.quanHuyen || !form.diaChi) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        moTa: form.moTa,
        noiDung: form.noiDung,
        giaTien: parseFloat(form.giaTien),
        tinhThanh: form.tinhThanh,
        quanHuyen: form.quanHuyen,
        diaChi: form.diaChi,
        maPhong: form.maPhong ? parseInt(form.maPhong, 10) : null,
      };

      let maBaiDang = id;

      if (isEditMode) {
        await baiDangAPI.capNhat(id, {
          ...payload,
          images: existingImages,
          video: existingVideo,
          trangThai: form.trangThai || 'Dang',
        });
      } else {
        const response = await baiDangAPI.tao(payload);
        maBaiDang = response.data.data.maBaiDang;
      }

      if (files.length > 0 || videoFile) {
        const fd = new FormData();
        files.forEach(file => fd.append('files', file));
        if (videoFile) {
          fd.append('files', videoFile);
        }
        await baiDangAPI.uploadMedia(maBaiDang, fd);
      }

      toast.success(isEditMode ? 'Cập nhật bài đăng thành công!' : 'Đăng bài thành công!');
      navigate(`/bai-dang/${maBaiDang}`);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEditMode ? 'Cập nhật bài đăng thất bại' : 'Đăng bài thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPost) {
    return <div className="spinner" />;
  }

  return (
    <div className="container page-wrapper">
      <div className="tao-baidang-wrapper">
        <div className="card">
          <div className="card-header">{isEditMode ? 'Chỉnh sửa bài đăng' : 'Đăng tin tìm bạn ở ghép'}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tiêu đề / Mô tả ngắn <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="form-control"
                  placeholder="VD: Cần tìm bạn ở ghép có sẵn phòng"
                  value={form.moTa}
                  onChange={event => set('moTa', event.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Giá thuê (đ/tháng) <span style={{ color: 'red' }}>*</span></label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="3000000"
                    value={form.giaTien}
                    onChange={event => set('giaTien', event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Liên kết với phòng đang sở hữu</label>
                  <select
                    className="form-control"
                    value={form.maPhong}
                    onChange={event => set('maPhong', event.target.value)}
                    disabled={loadingPhong}
                  >
                    <option value="">
                      {loadingPhong ? 'Đang tải danh sách phòng...' : '-- Phòng sở hữu --'}
                    </option>
                    {phongSoHuu.map(phong => (
                      <option key={phong.maPhong} value={String(phong.maPhong)}>
                        {`${phong.title} (#${phong.maPhong})`}
                      </option>
                    ))}
                  </select>
                  <div className="form-note">
                    Chọn một phòng bạn đang sở hữu để người xem có thể gửi yêu cầu tham gia trực tiếp từ bài đăng.
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tỉnh / Thành phố <span style={{ color: 'red' }}>*</span></label>
                  <select
                    className="form-control"
                    required
                    value={selectedTinhThanhCode}
                    onChange={handleTinhThanhChange}
                    disabled={loadingTinhThanh}
                  >
                    <option value="">{loadingTinhThanh ? 'Đang tải tỉnh thành...' : '-- Chọn tỉnh thành --'}</option>
                    {tinhThanhs.map(item => (
                      <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quận / Huyện <span style={{ color: 'red' }}>*</span></label>
                  <select
                    className="form-control"
                    required
                    value={selectedQuanHuyenCode}
                    onChange={handleQuanHuyenChange}
                    disabled={!selectedTinhThanhCode || loadingQuanHuyen}
                  >
                    <option value="">
                      {!selectedTinhThanhCode
                        ? '-- Chọn tỉnh thành trước --'
                        : loadingQuanHuyen
                          ? 'Đang tải quận huyện...'
                          : '-- Chọn quận huyện --'}
                    </option>
                    {quanHuyens.map(item => (
                      <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ chi tiết <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="form-control"
                  placeholder="Số nhà, tên đường, tòa nhà..."
                  value={form.diaChi}
                  onChange={event => set('diaChi', event.target.value)}
                  required
                />
              </div>

              {isEditMode && (
                <div className="form-group">
                  <label className="form-label">Trạng thái bài đăng</label>
                  <select
                    className="form-control"
                    value={form.trangThai}
                    onChange={event => set('trangThai', event.target.value)}
                  >
                    <option value="Dang">Đang hoạt động</option>
                    <option value="Tam dung">Tạm dừng</option>
                    <option value="Da dong">Đã đóng</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nội dung chi tiết</label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Mô tả về phòng, tiện nghi, yêu cầu bạn ghép, thời gian có thể vào ở..."
                  value={form.noiDung}
                  onChange={event => set('noiDung', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh và video</label>
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <span style={{ fontSize: 40 }}>📸</span>
                    <p>{isDragActive ? 'Thả ảnh hoặc video vào đây...' : 'Kéo thả hoặc click để chọn ảnh và video'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hỗ trợ JPG, PNG, WEBP và 1 video MP4/MOV/WebM</p>
                  </div>
                </div>

                {isEditMode && (existingImages.length > 0 || existingVideo) && (
                  <div className="media-existing-group">
                    <div className="form-note">Media hiện tại của bài đăng</div>
                    {existingImages.length > 0 && (
                      <div className="preview-grid">
                        {existingImages.map((src, index) => (
                          <div key={`${src}-${index}`} className="preview-item preview-item-static">
                            <img src={src} alt="" />
                            <button
                              type="button"
                              className="preview-remove"
                              onClick={() => {
                                setExistingImages(current => current.filter((_, itemIndex) => itemIndex !== index));
                              }}
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {existingVideo && !videoPreview && (
                      <div className="video-preview-card">
                        <video src={existingVideo} controls className="video-preview-player" />
                        <button
                          type="button"
                          className="preview-remove preview-remove-video"
                          onClick={removeVideo}
                        >
                          x
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {previews.length > 0 && (
                  <div className="media-preview-group">
                    <div className="form-note">Ảnh mới sẽ được thêm vào bộ ảnh hiện tại.</div>
                    <div className="preview-grid">
                      {previews.map((src, index) => (
                        <div key={index} className="preview-item">
                          <img src={src} alt="" />
                          <button
                            type="button"
                            className="preview-remove"
                            onClick={() => {
                              URL.revokeObjectURL(previews[index]);
                              setFiles(current => current.filter((_, itemIndex) => itemIndex !== index));
                              setPreviews(current => current.filter((_, itemIndex) => itemIndex !== index));
                            }}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {videoPreview && (
                  <div className="media-preview-group">
                    <div className="form-note">
                      {videoPreview ? 'Video mới sẽ thay thế video hiện tại.' : 'Video hiện tại của bài đăng.'}
                    </div>
                    <div className="video-preview-card">
                      <video
                        src={videoPreview}
                        controls
                        className="video-preview-player"
                      />
                      {videoPreview && (
                        <button
                          type="button"
                          className="preview-remove preview-remove-video"
                          onClick={removeVideo}
                        >
                          x
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Đang xử lý...' : isEditMode ? 'Lưu thay đổi' : 'Đăng bài'}
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
