import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import UploadMedia from '../components/UploadMedia';
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
  const [submitStage, setSubmitStage] = useState('');
  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [loadingTinhThanh, setLoadingTinhThanh] = useState(true);
  const [loadingQuanHuyen, setLoadingQuanHuyen] = useState(false);
  const [loadingPhong, setLoadingPhong] = useState(true);
  const [phongSoHuu, setPhongSoHuu] = useState([]);
  const [tinhThanhs, setTinhThanhs] = useState([]);
  const [quanHuyens, setQuanHuyens] = useState([]);
  const [selectedTinhThanhCode, setSelectedTinhThanhCode] = useState('');
  const [selectedQuanHuyenCode, setSelectedQuanHuyenCode] = useState('');
  const phongDuocChon = phongSoHuu.find(item => String(item.maPhong) === String(form.maPhong));

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

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

  const handlePhongChange = event => {
    const nextMaPhong = event.target.value;
    const selectedPhong = phongSoHuu.find(item => String(item.maPhong) === nextMaPhong);

    if (!selectedPhong) {
      set('maPhong', '');
      return;
    }

    setForm(current => ({
      ...current,
      maPhong: nextMaPhong,
      moTa: selectedPhong.title || current.moTa,
      noiDung: selectedPhong.moTa || current.noiDung,
      giaTien: selectedPhong.giaTien != null ? String(selectedPhong.giaTien) : current.giaTien,
      tinhThanh: selectedPhong.tinhThanh || current.tinhThanh,
      quanHuyen: selectedPhong.quanHuyen || current.quanHuyen,
      diaChi: selectedPhong.diaChi || current.diaChi,
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!form.moTa || !form.giaTien || !form.tinhThanh || !form.quanHuyen || !form.diaChi) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    setSubmitStage('saving');

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
        setSubmitStage('uploading');
        const fd = new FormData();
        files.forEach(file => fd.append('files', file));
        if (videoFile) {
          fd.append('files', videoFile);
        }
        try {
          await baiDangAPI.uploadMedia(maBaiDang, fd);
        } catch (uploadError) {
          toast.error(uploadError.response?.data?.message || 'Da luu bai dang, nhung tai media that bai. Vui long thu lai.');
          navigate(`/bai-dang/${maBaiDang}`);
          return;
        }
      }

      toast.success(isEditMode ? 'Cập nhật bài đăng thành công!' : 'Đăng bài thành công!');
      navigate(`/bai-dang/${maBaiDang}`);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEditMode ? 'Cập nhật bài đăng thất bại' : 'Đăng bài thất bại'));
    } finally {
      setSubmitting(false);
      setSubmitStage('');
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
                    onChange={handlePhongChange}
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
                  {phongDuocChon && (
                    <div className="form-note">
                      Thong tin bai dang da duoc do tu phong <strong>{phongDuocChon.title}</strong>. Ban van co the chinh tay truoc khi luu.
                    </div>
                  )}
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

              <UploadMedia
                previews={previews}
                files={files}
                setFiles={setFiles}
                setPreviews={setPreviews}
                videoPreview={videoPreview}
                setVideoPreview={setVideoPreview}
                videoFile={videoFile}
                setVideoFile={setVideoFile}
                existingImages={existingImages}
                setExistingImages={setExistingImages}
                existingVideo={existingVideo}
                setExistingVideo={setExistingVideo}
                isEditMode={isEditMode}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ flex: 1 }}>
                  {submitting
                    ? submitStage === 'uploading'
                      ? 'Dang tai media...'
                      : 'Dang luu bai dang...'
                    : isEditMode ? 'Lưu thay đổi' : 'Đăng bài'}
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
