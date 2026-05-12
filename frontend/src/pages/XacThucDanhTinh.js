import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import './XacThucDanhTinh.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.88;

const resizeImageForUpload = file => new Promise(resolve => {
  const previewUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(previewUrl);

    const maxDimension = Math.max(image.width, image.height);
    if (maxDimension <= MAX_UPLOAD_IMAGE_DIMENSION) {
      resolve(file);
      return;
    }

    const scale = MAX_UPLOAD_IMAGE_DIMENSION / maxDimension;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) {
        resolve(file);
        return;
      }

      const fileName = file.name.replace(/\.[^.]+$/, '') || 'cccd';
      resolve(new File([blob], `${fileName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }));
    }, 'image/jpeg', JPEG_QUALITY);
  };

  image.onerror = () => {
    URL.revokeObjectURL(previewUrl);
    resolve(file);
  };

  image.src = previewUrl;
});

const getErrorMessage = error => {
  if (error.code === 'ECONNABORTED' || String(error.message || '').toLowerCase().includes('timeout')) {
    return 'Quá trình OCR mất quá nhiều thời gian. Vui lòng thử lại với ảnh rõ nét hơn, chụp thẳng mặt thẻ, đủ sáng và không bị lóa.';
  }

  if (!error.response) {
    return 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra backend đang chạy rồi thử lại.';
  }

  if (error.response?.data?.message) {
    const message = error.response.data.message;
    const normalized = message.toLowerCase();

    if (normalized.includes('app.cccd.ocr.tessdata-path')) {
      return message;
    }
    if (normalized.includes('tessdata') || normalized.includes('traineddata')) {
      return 'Backend chưa cấu hình Tesseract OCR hoặc thiếu vie.traineddata nên chưa thể xác thực CCCD.';
    }

    return message;
  }

  return error.message || 'Xác thực thất bại';
};

export default function XacThucDanhTinh() {
  const { layThongTinToi } = useAuthStore();
  const navigate = useNavigate();
  const [matTruoc, setMatTruoc] = useState(null);
  const [matSau, setMatSau] = useState(null);
  const [prevTruoc, setPrevTruoc] = useState(null);
  const [prevSau, setPrevSau] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => () => {
    if (prevTruoc) URL.revokeObjectURL(prevTruoc);
    if (prevSau) URL.revokeObjectURL(prevSau);
  }, [prevTruoc, prevSau]);

  const clearResult = () => {
    setResult(null);
    setVerificationError('');
  };

  const handleFile = async (side, file) => {
    if (!file) return;

    clearResult();

    if (!file.type.startsWith('image/')) {
      setVerificationError('Chỉ chấp nhận file ảnh.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setVerificationError('Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    const optimizedFile = await resizeImageForUpload(file);
    const nextPreview = URL.createObjectURL(optimizedFile);

    if (side === 'truoc') {
      if (prevTruoc) URL.revokeObjectURL(prevTruoc);
      setMatTruoc(optimizedFile);
      setPrevTruoc(nextPreview);
      return;
    }

    if (prevSau) URL.revokeObjectURL(prevSau);
    setMatSau(optimizedFile);
    setPrevSau(nextPreview);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!matTruoc || !matSau) {
      setVerificationError('Vui lòng chọn cả hai mặt CCCD/CMND trước khi xác thực.');
      return;
    }

    setLoading(true);
    clearResult();

    try {
      const fd = new FormData();
      fd.append('matTruoc', matTruoc);
      fd.append('matSau', matSau);

      const res = await nguoiDungAPI.xacThucCCCD(fd);
      const verificationResult = res.data?.data;

      if (verificationResult?.xacThucThanhCong !== true) {
        throw new Error(res.data?.message || 'Xác thực thất bại');
      }

      setResult({ xacThucThanhCong: true });
      await layThongTinToi();
      toast.success(verificationResult?.thongBao || 'Xác thực danh tính thành công');
    } catch (error) {
      setResult(null);
      setVerificationError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const isVerified = result?.xacThucThanhCong === true;

  return (
    <div className="container page-wrapper">
      <div className="xacthuc-wrapper">
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔐</div>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>Xác thực danh tính</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                Tải lên CCCD/CMND để xác minh danh tính.
              </p>
            </div>

            <div className="alert alert-info">
              ℹ️ Chỉ tài khoản đã xác thực mới có thể <strong>đăng phòng</strong>, <strong>apply vào phòng</strong> và <strong>thanh toán</strong>.
            </div>

            {verificationError && (
              <div className="xacthuc-message xacthuc-message-error" role="alert">
                <strong>Xác thực chưa thành công</strong>
                <span>{verificationError}</span>
              </div>
            )}

            {isVerified ? (
              <div className="xacthuc-result">
                <div className="result-icon">✅</div>
                <h2>Xác thực thành công!</h2>
                <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
                  Về trang chủ
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid-2" style={{ gap: 20 }}>
                  <div className="cccd-upload-box">
                    <label htmlFor="mat-truoc" className="upload-label">
                      {prevTruoc ? (
                        <img src={prevTruoc} alt="Mặt trước CCCD" />
                      ) : (
                        <div className="upload-placeholder">
                          <span>🪪</span>
                          <p>Mặt trước CCCD</p>
                          <small>Click để chọn ảnh</small>
                        </div>
                      )}
                    </label>
                    <input id="mat-truoc" type="file" accept="image/*" hidden onChange={e => handleFile('truoc', e.target.files[0])} />
                    <p className="upload-label-text">Mặt trước</p>
                  </div>

                  <div className="cccd-upload-box">
                    <label htmlFor="mat-sau" className="upload-label">
                      {prevSau ? (
                        <img src={prevSau} alt="Mặt sau CCCD" />
                      ) : (
                        <div className="upload-placeholder">
                          <span>🪪</span>
                          <p>Mặt sau CCCD</p>
                          <small>Click để chọn ảnh</small>
                        </div>
                      )}
                    </label>
                    <input id="mat-sau" type="file" accept="image/*" hidden onChange={e => handleFile('sau', e.target.files[0])} />
                    <p className="upload-label-text">Mặt sau</p>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 24 }}>
                  {loading ? 'Đang xử lý ảnh và xác thực...' : 'Xác thực ngay'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 12 }}>Hướng dẫn chụp ảnh</h3>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 20 }}>
              <li>Đặt CCCD trên nền phẳng, đủ ánh sáng</li>
              <li>Chụp đủ 4 góc của thẻ, không bị mờ</li>
              <li>Không che khuất thông tin</li>
              <li>Ảnh rõ nét và dễ OCR đọc được số CCCD</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
