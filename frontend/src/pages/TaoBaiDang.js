import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { baiDangAPI } from '../services/api';
import './TaoBaiDang.css';

const createInitialForm = () => ({
  moTa: '',
  noiDung: '',
  giaTien: '',
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
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);

  const onDrop = useCallback(accepted => {
    setFiles(prev => [...prev, ...accepted]);
    setPreviews(prev => [...prev, ...accepted.map(file => URL.createObjectURL(file))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEditMode) {
      setLoadingPost(false);
      setForm(createInitialForm());
      setExistingImages([]);
      return;
    }

    let active = true;

    baiDangAPI.layBaiDangCuaToi()
      .then(res => {
        if (!active) return;

        const post = (res.data.data || []).find(item => String(item.maBaiDang) === String(id));
        if (!post) {
          toast.error('Bạn không có quyền sửa bài đăng này');
          navigate('/ho-so', { replace: true });
          return;
        }

        setForm({
          moTa: post.moTa || '',
          noiDung: post.noiDung || '',
          giaTien: post.giaTien || '',
          diaChi: post.diaChi || '',
          maPhong: post.maPhong || '',
          trangThai: post.trangThai || 'Dang',
        });
        setExistingImages(post.images || []);
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.moTa || !form.giaTien || !form.diaChi) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        moTa: form.moTa,
        noiDung: form.noiDung,
        giaTien: parseFloat(form.giaTien),
        diaChi: form.diaChi,
        maPhong: form.maPhong ? parseInt(form.maPhong, 10) : null,
      };

      let maBaiDang = id;

      if (isEditMode) {
        await baiDangAPI.capNhat(id, {
          ...payload,
          trangThai: form.trangThai || 'Dang',
        });
      } else {
        const res = await baiDangAPI.tao(payload);
        maBaiDang = res.data.data.maBaiDang;
      }

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach(file => fd.append('files', file));
        await baiDangAPI.uploadAnh(maBaiDang, fd);
      }

      toast.success(isEditMode ? 'Cập nhật bài đăng thành công!' : 'Đăng bài thành công!');
      navigate(`/bai-dang/${maBaiDang}`);
    } catch (e) {
      toast.error(e.response?.data?.message || (isEditMode ? 'Cập nhật bài đăng thất bại' : 'Đăng bài thất bại'));
    }

    setSubmitting(false);
  };

  if (loadingPost) return <div className="spinner" />;

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
                  placeholder="VD: Cần tìm 1 bạn nữ ghép phòng Q1, giá 3tr/tháng"
                  value={form.moTa}
                  onChange={e => set('moTa', e.target.value)}
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
                    onChange={e => set('giaTien', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã phòng (nếu có)</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="ID phòng đã tạo"
                    value={form.maPhong}
                    onChange={e => set('maPhong', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="form-control"
                  placeholder="Số nhà, đường, phường, quận, thành phố"
                  value={form.diaChi}
                  onChange={e => set('diaChi', e.target.value)}
                  required
                />
              </div>

              {isEditMode && (
                <div className="form-group">
                  <label className="form-label">Trạng thái bài đăng</label>
                  <select
                    className="form-control"
                    value={form.trangThai}
                    onChange={e => set('trangThai', e.target.value)}
                  >
                    <option value="Dang">Đang hiển thị</option>
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
                  onChange={e => set('noiDung', e.target.value)}
                />
              </div>

              {isEditMode && existingImages.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Ảnh hiện tại</label>
                  <div className="preview-grid">
                    {existingImages.map((src, index) => (
                      <div key={`${src}-${index}`} className="preview-item preview-item-static">
                        <img src={src} alt="" />
                      </div>
                    ))}
                  </div>
                  <div className="form-note">Ảnh mới sẽ được thêm vào bộ ảnh hiện tại.</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{isEditMode ? 'Thêm ảnh mới' : 'Hình ảnh phòng'}</label>
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <span style={{ fontSize: 40 }}>📸</span>
                    <p>{isDragActive ? 'Thả ảnh vào đây...' : 'Kéo thả hoặc click để chọn ảnh'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hỗ trợ JPG, PNG, WEBP</p>
                  </div>
                </div>
                {previews.length > 0 && (
                  <div className="preview-grid">
                    {previews.map((src, index) => (
                      <div key={index} className="preview-item">
                        <img src={src} alt="" />
                        <button
                          type="button"
                          className="preview-remove"
                          onClick={() => {
                            setFiles(current => current.filter((_, itemIndex) => itemIndex !== index));
                            setPreviews(current => current.filter((_, itemIndex) => itemIndex !== index));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Đang xử lý...' : isEditMode ? 'Lưu thay đổi' : 'Đăng bài ngay'}
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
