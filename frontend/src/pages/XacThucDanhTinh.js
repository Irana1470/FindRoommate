import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import './XacThucDanhTinh.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const getErrorMessage = error => {
  if (error.response?.data?.message) {
    const message = error.response.data.message;
    const normalized = message.toLowerCase();

    if (normalized.includes('app.cccd.ocr.tessdata-path')) {
      return message;
    }
    if (normalized.includes('tessdata') || normalized.includes('traineddata')) {
      return 'Backend chua cau hinh Tesseract OCR hoac thieu vie.traineddata nen chua the xac thuc CCCD.';
    }

    return message;
  }

  return error.message || 'Xac thuc that bai';
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

  useEffect(() => () => {
    if (prevTruoc) URL.revokeObjectURL(prevTruoc);
    if (prevSau) URL.revokeObjectURL(prevSau);
  }, [prevTruoc, prevSau]);

  const clearResult = () => setResult(null);

  const handleFile = (side, file) => {
    if (!file) return;

    clearResult();

    if (!file.type.startsWith('image/')) {
      toast.error('Chi chap nhan file anh');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Anh vuot qua 10MB');
      return;
    }

    const nextPreview = URL.createObjectURL(file);

    if (side === 'truoc') {
      if (prevTruoc) URL.revokeObjectURL(prevTruoc);
      setMatTruoc(file);
      setPrevTruoc(nextPreview);
      return;
    }

    if (prevSau) URL.revokeObjectURL(prevSau);
    setMatSau(file);
    setPrevSau(nextPreview);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!matTruoc || !matSau) {
      toast.error('Vui long chon ca hai mat CCCD');
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
        throw new Error(res.data?.message || 'Xac thuc that bai');
      }

      setResult(verificationResult);
      await layThongTinToi();
      toast.success(verificationResult?.thongBao || 'Xac thuc danh tinh thanh cong');
    } catch (error) {
      clearResult();
      toast.error(getErrorMessage(error));
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
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>Xac thuc danh tinh</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                Tai len CCCD/CMND de xac minh danh tinh. Anh chi duoc dung tam thoi de OCR va khong duoc luu lai.
              </p>
            </div>

            <div className="alert alert-info">
              ℹ️ Chi tai khoan da xac thuc moi co the <strong>dang phong</strong>, <strong>apply vao phong</strong> va <strong>thanh toan</strong>.
            </div>

            {isVerified ? (
              <div className="xacthuc-result">
                <div className="result-icon">✅</div>
                <h2>Xac thuc thanh cong!</h2>
                <div className="result-info">
                  {result.hoTen && <div className="info-row"><span>Ho ten:</span><strong>{result.hoTen}</strong></div>}
                  {result.ngaySinh && <div className="info-row"><span>Ngay sinh:</span><strong>{result.ngaySinh}</strong></div>}
                  {result.diaChi && <div className="info-row"><span>Dia chi:</span><strong>{result.diaChi}</strong></div>}
                </div>
                <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
                  Ve trang chu
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid-2" style={{ gap: 20 }}>
                  <div className="cccd-upload-box">
                    <label htmlFor="mat-truoc" className="upload-label">
                      {prevTruoc ? (
                        <img src={prevTruoc} alt="Mat truoc CCCD" />
                      ) : (
                        <div className="upload-placeholder">
                          <span>🪪</span>
                          <p>Mat truoc CCCD</p>
                          <small>Click de chon anh</small>
                        </div>
                      )}
                    </label>
                    <input id="mat-truoc" type="file" accept="image/*" hidden onChange={e => handleFile('truoc', e.target.files[0])} />
                    <p className="upload-label-text">Mat truoc</p>
                  </div>

                  <div className="cccd-upload-box">
                    <label htmlFor="mat-sau" className="upload-label">
                      {prevSau ? (
                        <img src={prevSau} alt="Mat sau CCCD" />
                      ) : (
                        <div className="upload-placeholder">
                          <span>🪪</span>
                          <p>Mat sau CCCD</p>
                          <small>Click de chon anh</small>
                        </div>
                      )}
                    </label>
                    <input id="mat-sau" type="file" accept="image/*" hidden onChange={e => handleFile('sau', e.target.files[0])} />
                    <p className="upload-label-text">Mat sau</p>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 24 }}>
                  {loading ? 'Dang xac thuc bang AI...' : 'Xac thuc ngay'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 12 }}>Huong dan chup anh</h3>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 20 }}>
              <li>Dat CCCD tren nen phang, du anh sang</li>
              <li>Chup du 4 goc cua the, khong bi mo</li>
              <li>Khong che khuat thong tin</li>
              <li>Anh ro net va de OCR doc duoc so CCCD</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
