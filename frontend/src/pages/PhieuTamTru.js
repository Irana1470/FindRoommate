import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { nguoiDungAPI, phieuTamTruAPI } from '../services/api';
import {
  buildCt01FileName,
  buildCt01PreviewData,
  CT01_NOTES,
  downloadBlob,
  formatDateVN,
} from '../utils/phieuTamTruDocument';
import './PhieuTamTru.css';

const normalizeName = value => value.trim().replace(/\s+/g, ' ');
const isValidName = value => {
  const normalized = normalizeName(value);
  return normalized.length >= 2 && normalized.length <= 100 && !/\d/.test(normalized);
};
const isValidOptionalName = value => value === '' || isValidName(value);
const isValidPhone = value => value === '' || /^\d{10,11}$/.test(value);
const isValidCitizenId = value => value === '' || /^\d{9,12}$/.test(value);
const isValidEmail = value => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeOptionalText = value => (value ?? '').trim().replace(/\s+/g, ' ');

const createInitialForm = user => ({
  coQuanDangKy: '',
  hoTen: user?.hoTenXacThuc || user?.hoTen || '',
  gioiTinh: '',
  soCanCuocCongDan: user?.soCanCuocCongDan || '',
  soDienThoai: user?.soDienThoai || '',
  email: user?.email || '',
  ngaySinh: user?.ngaySinhXacThuc || '',
  tenChuHo: '',
  quanHeVoiChuHo: '',
  soDinhDanhChuHo: '',
  diaChiThuongTru: user?.diaChiThuongTruXacThuc || '',
  diaChiTamTru: '',
  noiDungDeNghi: '',
  ngayBatDau: '',
});

const mapPhieuToForm = phieu => ({
  coQuanDangKy: phieu?.coQuanDangKy || '',
  hoTen: phieu?.hoTen || '',
  gioiTinh: phieu?.gioiTinh || '',
  soCanCuocCongDan: phieu?.soCanCuocCongDan || '',
  soDienThoai: phieu?.soDienThoai || '',
  email: phieu?.email || '',
  ngaySinh: phieu?.ngaySinh || '',
  tenChuHo: phieu?.tenChuHo || '',
  quanHeVoiChuHo: phieu?.quanHeVoiChuHo || '',
  soDinhDanhChuHo: phieu?.soDinhDanhChuHo || '',
  diaChiThuongTru: phieu?.diaChiThuongTru || '',
  diaChiTamTru: phieu?.diaChiTamTru || '',
  noiDungDeNghi: phieu?.noiDungDeNghi || '',
  ngayBatDau: phieu?.ngayBatDau || '',
});

const mergeWithUserFallback = (form, user) => ({
  ...form,
  hoTen: form.hoTen || user?.hoTenXacThuc || user?.hoTen || '',
  soCanCuocCongDan: form.soCanCuocCongDan || user?.soCanCuocCongDan || '',
  soDienThoai: form.soDienThoai || user?.soDienThoai || '',
  email: form.email || user?.email || '',
  ngaySinh: form.ngaySinh || user?.ngaySinhXacThuc || '',
  diaChiThuongTru: form.diaChiThuongTru || user?.diaChiThuongTruXacThuc || '',
});

const loadUserProfile = async ({ user, layThongTinToi }) => {
  if (user) {
    return user;
  }

  const storeUser = await layThongTinToi?.();
  if (storeUser) {
    return storeUser;
  }

  try {
    const response = await nguoiDungAPI.layThongTinToi();
    return response.data?.data || null;
  } catch {
    return null;
  }
};

const extractErrorMessage = async (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof Blob !== 'undefined' && responseData instanceof Blob) {
    try {
      const rawText = await responseData.text();
      const parsed = JSON.parse(rawText);
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
    } catch (blobError) {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
};

const buildIdentityDigits = value => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 12).split('');
  return Array.from({ length: 12 }, (_, index) => digits[index] || '');
};

function UnderlineValue({ value, className = '', multiline = false }) {
  return (
    <span className={`ct01-underline-value ${multiline ? 'multiline' : ''} ${className}`.trim()}>
      {value || '\u00A0'}
    </span>
  );
}

function IdentityBoxes({ value }) {
  return (
    <span className="ct01-id-boxes" aria-label={value || 'Số định danh cá nhân'}>
      {buildIdentityDigits(value).map((digit, index) => (
        <span key={`${value || 'empty'}-${index}`} className="ct01-id-box">
          {digit || '\u00A0'}
        </span>
      ))}
    </span>
  );
}

function DatePartsField({ parts }) {
  return (
    <span className="ct01-date-parts">
      <UnderlineValue value={parts.day} className="ct01-date-part" />
      <span>/</span>
      <UnderlineValue value={parts.month} className="ct01-date-part" />
      <span>/</span>
      <UnderlineValue value={parts.year} className="ct01-date-year" />
    </span>
  );
}

function SignatureBlock({
  title,
  dateText,
  signerName = '',
  signerId = '',
  showIdentityFields = false,
}) {
  return (
    <div className="ct01-signature-block">
      <div className="ct01-signature-date">{dateText}</div>
      <div className="ct01-signature-title">{title}</div>

      {showIdentityFields && (
        <div className="ct01-signature-meta">
          <div className="ct01-signature-meta-row">
            <span>(7) Họ và tên:</span>
            <UnderlineValue value={signerName} className="ct01-signature-inline" />
          </div>
          <div className="ct01-signature-meta-row">
            <span>(7) Số định danh cá nhân:</span>
            <UnderlineValue value={signerId} className="ct01-signature-inline" />
          </div>
        </div>
      )}

      <div className="ct01-signature-space" />
      {!showIdentityFields && <div className="ct01-signature-note">(Ký, ghi rõ họ tên)</div>}
      <div className="ct01-signature-name">{signerName}</div>
    </div>
  );
}

function CT01Preview({ data }) {
  const preview = buildCt01PreviewData(data);

  return (
    <div className="ct01-sheet">
      <div className="ct01-national-header">
        <div className="ct01-national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div className="ct01-national-motto">Độc lập - Tự do - Hạnh phúc</div>
        <div className="ct01-national-line" />
      </div>

      <h2 className="ct01-title">TỜ KHAI THAY ĐỔI THÔNG TIN CƯ TRÚ</h2>

      <div className="ct01-row">
        <span className="ct01-label">Kính gửi(1):</span>
        <UnderlineValue value={preview.coQuanDangKy} className="grow" />
      </div>

      <div className="ct01-row">
        <span className="ct01-label">1. Họ, chữ đệm và tên:</span>
        <UnderlineValue value={preview.hoTen} className="grow" />
      </div>

      <div className="ct01-row ct01-row-split">
        <div className="ct01-split-field grow">
          <span className="ct01-label">2. Ngày, tháng, năm sinh:</span>
          <DatePartsField parts={preview.ngaySinhParts} />
        </div>
        <div className="ct01-split-field">
          <span className="ct01-label">3. Giới tính:</span>
          <UnderlineValue value={preview.gioiTinh} className="ct01-short-field" />
        </div>
      </div>

      <div className="ct01-row">
        <span className="ct01-label">4. Số định danh cá nhân:</span>
        <IdentityBoxes value={preview.soCanCuocCongDan} />
      </div>

      <div className="ct01-row ct01-row-split">
        <div className="ct01-split-field grow">
          <span className="ct01-label">5. Số điện thoại liên hệ:</span>
          <UnderlineValue value={preview.soDienThoai} className="grow" />
        </div>
        <div className="ct01-split-field grow">
          <span className="ct01-label">6. Email:</span>
          <UnderlineValue value={preview.email} className="grow" />
        </div>
      </div>

      <div className="ct01-row ct01-row-split">
        <div className="ct01-split-field grow">
          <span className="ct01-label">7. Họ, chữ đệm và tên chủ hộ:</span>
          <UnderlineValue value={preview.tenChuHo} className="grow" />
        </div>
        <div className="ct01-split-field">
          <span className="ct01-label">8. Mối quan hệ với chủ hộ:</span>
          <UnderlineValue value={preview.quanHeVoiChuHo} className="grow" />
        </div>
      </div>

      <div className="ct01-row">
        <span className="ct01-label">9. Số định danh cá nhân của chủ hộ:</span>
        <IdentityBoxes value={preview.soDinhDanhChuHo} />
      </div>

      <div className="ct01-row">
        <span className="ct01-label">Địa chỉ thường trú:</span>
        <UnderlineValue value={preview.diaChiThuongTru} className="grow" multiline />
      </div>

      <div className="ct01-row">
        <span className="ct01-label">Địa chỉ tạm trú:</span>
        <UnderlineValue value={preview.diaChiTamTru} className="grow" multiline />
      </div>

      <div className="ct01-row ct01-row-content">
        <span className="ct01-label">10. Nội dung đề nghị(2):</span>
        <UnderlineValue value={preview.noiDungDeNghi} className="grow ct01-content-field" multiline />
      </div>

      <div className="ct01-members">
        <div className="ct01-members-title">11. Những thành viên trong hộ gia đình cùng thay đổi:</div>
        <table className="ct01-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>TT</th>
              <th>Họ, chữ đệm và tên</th>
              <th style={{ width: '18%' }}>Ngày, tháng, năm sinh</th>
              <th style={{ width: '12%' }}>Giới tính</th>
              <th style={{ width: '18%' }}>Số định danh cá nhân</th>
              <th style={{ width: '16%' }}>Mối quan hệ với chủ hộ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="centered">1</td>
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="ct01-signatures">
        <SignatureBlock title="Ý KIẾN CỦA CHỦ HỘ(3)" dateText={preview.ngayKyText} />
        <SignatureBlock
          title="Ý KIẾN CỦA CHỦ SỞ HỮU CHỖ Ở HỢP PHÁP(4)"
          dateText={preview.ngayKyText}
          signerName={preview.tenChuHo}
          signerId={preview.soDinhDanhChuHo}
          showIdentityFields
        />
        <SignatureBlock title="Ý KIẾN CỦA CHA, MẸ HOẶC NGƯỜI GIÁM HỘ(5)" dateText={preview.ngayKyText} showIdentityFields />
        <SignatureBlock title="NGƯỜI KÊ KHAI(6)" dateText={preview.ngayKyText} signerName={preview.hoTen} />
      </div>

      <div className="ct01-notes">
        <strong>Chú thích:</strong>
        {CT01_NOTES.map(note => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </div>
  );
}

export default function PhieuTamTru() {
  const { user, layThongTinToi } = useAuthStore();
  const [phieus, setPhieus] = useState([]);
  const [form, setForm] = useState(() => createInitialForm(null));
  const [defaultForm, setDefaultForm] = useState(() => createInitialForm(null));
  const [tab, setTab] = useState('list');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPhieuId, setSelectedPhieuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [previewDownloading, setPreviewDownloading] = useState(false);
  const [downloadingPhieuId, setDownloadingPhieuId] = useState(null);
  const [deletingPhieuId, setDeletingPhieuId] = useState(null);

  const isEditing = editingId !== null;

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const currentUser = await loadUserProfile({ user, layThongTinToi });

      try {
        const [phieuResult, defaultResult] = await Promise.allSettled([
          phieuTamTruAPI.layCuaToi(),
          phieuTamTruAPI.layMacDinh(),
        ]);

        if (!active) return;

        const nextPhieus = phieuResult.status === 'fulfilled'
          ? (phieuResult.value.data.data || [])
          : [];
        const rawDefaultForm = defaultResult.status === 'fulfilled'
          ? mapPhieuToForm(defaultResult.value.data.data)
          : createInitialForm(currentUser);
        const nextDefaultForm = mergeWithUserFallback(rawDefaultForm, currentUser);

        setPhieus(nextPhieus);
        setSelectedPhieuId(nextPhieus[0]?.maPhieuTamTru || null);
        setDefaultForm(nextDefaultForm);
        setForm(nextDefaultForm);
        if (phieuResult.status !== 'fulfilled') {
          toast.error('Khong tai duoc danh sach phieu tam tru');
        }
        if (defaultResult.status !== 'fulfilled' && !currentUser) {
          toast.error('Khong tai duoc du lieu mac dinh cho phieu tam tru');
        }
      } catch (error) {
        const fallbackForm = mergeWithUserFallback(createInitialForm(currentUser), currentUser);
        if (active) {
          setDefaultForm(fallbackForm);
          setForm(fallbackForm);
          toast.error('Không tải được dữ liệu phiếu tạm trú');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [user, layThongTinToi]);

  useEffect(() => {
    if (!user || isEditing) return;

    setDefaultForm(current => mergeWithUserFallback(current, user));
    setForm(current => mergeWithUserFallback(current, user));
  }, [user, isEditing]);

  const selectedPhieu = phieus.find(phieu => phieu.maPhieuTamTru === selectedPhieuId) || phieus[0] || null;
  const previewData = buildCt01PreviewData(form);

  const setField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm({ ...defaultForm });
  };

  const refreshList = async preferredId => {
    const listRes = await phieuTamTruAPI.layCuaToi();
    const nextPhieus = listRes.data.data || [];
    setPhieus(nextPhieus);

    const resolvedSelectedId = nextPhieus.some(phieu => phieu.maPhieuTamTru === preferredId)
      ? preferredId
      : nextPhieus[0]?.maPhieuTamTru || null;

    setSelectedPhieuId(resolvedSelectedId);
    return nextPhieus;
  };

  const startCreate = () => {
    setEditingId(null);
    resetForm();
    setTab('form');
  };

  const startEdit = phieu => {
    setEditingId(phieu.maPhieuTamTru);
    setSelectedPhieuId(phieu.maPhieuTamTru);
    setForm(mapPhieuToForm(phieu));
    setTab('form');
  };

  const handleCancel = () => {
    setEditingId(null);
    resetForm();
    setTab('list');
  };

  const validateCurrentForm = currentForm => {
    const hoTen = normalizeName(currentForm.hoTen);
    const tenChuHo = normalizeName(currentForm.tenChuHo);
    const quanHeVoiChuHo = currentForm.quanHeVoiChuHo.trim().replace(/\s+/g, ' ');
    const soDinhDanhChuHo = currentForm.soDinhDanhChuHo.trim();
    const diaChiTamTru = currentForm.diaChiTamTru.trim();

    if (!isValidOptionalName(hoTen)) {
      return { error: 'Họ tên phải từ 2 đến 100 ký tự và không được chứa số' };
    }
    if (!isValidPhone(currentForm.soDienThoai)) {
      return { error: 'Số điện thoại phải gồm 10 hoặc 11 chữ số' };
    }
    if (!isValidCitizenId(currentForm.soCanCuocCongDan)) {
      return { error: 'Số định danh cá nhân phải gồm từ 9 đến 12 chữ số' };
    }
    if (!isValidOptionalName(tenChuHo)) {
      return { error: 'Ten chu ho phai tu 2 den 100 ky tu va khong duoc chua so' };
    }
    if (!isValidCitizenId(soDinhDanhChuHo)) {
      return { error: 'Số định danh của chủ hộ phải gồm từ 9 đến 12 chữ số' };
    }
    if (!isValidEmail(currentForm.email)) {
      return { error: 'Email không hợp lệ' };
    }
    if (currentForm.ngaySinh && new Date(currentForm.ngaySinh) > new Date()) {
      return { error: 'Ngày sinh không được lớn hơn ngày hiện tại' };
    }
    if (false && !diaChiTamTru) {
      return { error: 'Vui lòng nhập địa chỉ tạm trú' };
    }
    if (false && !currentForm.ngayBatDau) {
      return { error: 'Vui lòng nhập ngày bắt đầu tạm trú' };
    }

    return {
      payload: {
        ...currentForm,
        hoTen,
        tenChuHo,
        quanHeVoiChuHo,
        soDinhDanhChuHo,
        diaChiTamTru,
      },
    };
  };

  const preparePhieuTamTruPayload = currentForm => {
    const hoTen = normalizeName(currentForm.hoTen || '');
    const tenChuHo = normalizeName(currentForm.tenChuHo || '');
    const payload = {
      ...currentForm,
      coQuanDangKy: normalizeOptionalText(currentForm.coQuanDangKy),
      hoTen,
      gioiTinh: normalizeOptionalText(currentForm.gioiTinh),
      soCanCuocCongDan: normalizeOptionalText(currentForm.soCanCuocCongDan),
      soDienThoai: normalizeOptionalText(currentForm.soDienThoai),
      email: normalizeOptionalText(currentForm.email),
      tenChuHo,
      quanHeVoiChuHo: normalizeOptionalText(currentForm.quanHeVoiChuHo),
      soDinhDanhChuHo: normalizeOptionalText(currentForm.soDinhDanhChuHo),
      diaChiThuongTru: normalizeOptionalText(currentForm.diaChiThuongTru),
      diaChiTamTru: normalizeOptionalText(currentForm.diaChiTamTru),
      noiDungDeNghi: normalizeOptionalText(currentForm.noiDungDeNghi),
    };

    if (!isValidOptionalName(payload.hoTen)) {
      return { error: 'Ho ten phai tu 2 den 100 ky tu va khong duoc chua so' };
    }
    if (!isValidPhone(payload.soDienThoai)) {
      return { error: 'So dien thoai phai gom 10 hoac 11 chu so' };
    }
    if (!isValidCitizenId(payload.soCanCuocCongDan)) {
      return { error: 'So dinh danh ca nhan phai gom tu 9 den 12 chu so' };
    }
    if (!isValidOptionalName(payload.tenChuHo)) {
      return { error: 'Ten chu ho phai tu 2 den 100 ky tu va khong duoc chua so' };
    }
    if (!isValidCitizenId(payload.soDinhDanhChuHo)) {
      return { error: 'So dinh danh cua chu ho phai gom tu 9 den 12 chu so' };
    }
    if (!isValidEmail(payload.email)) {
      return { error: 'Email khong hop le' };
    }
    if (payload.ngaySinh && new Date(payload.ngaySinh) > new Date()) {
      return { error: 'Ngay sinh khong duoc lon hon ngay hien tai' };
    }

    return { payload };
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const { error, payload } = preparePhieuTamTruPayload(form);
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      const response = isEditing
        ? await phieuTamTruAPI.capNhat(editingId, payload)
        : await phieuTamTruAPI.tao(payload);

      const savedPhieu = response.data.data;
      await refreshList(savedPhieu?.maPhieuTamTru || editingId);
      setEditingId(null);
      resetForm();
      setTab('list');
      toast.success(isEditing ? 'Cập nhật phiếu tạm trú thành công' : 'Tạo phiếu tạm trú thành công');
    } catch (errorResponse) {
      toast.error(await extractErrorMessage(errorResponse, 'Không thể lưu phiếu tạm trú'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPreview = async () => {
    const { error, payload } = preparePhieuTamTruPayload(form);
    if (error) {
      toast.error(error);
      return;
    }

    setPreviewDownloading(true);
    try {
      const response = await phieuTamTruAPI.taiPdfXemTruoc(payload);
      downloadBlob(response.data, buildCt01FileName(previewData));
    } catch (errorResponse) {
      toast.error(await extractErrorMessage(errorResponse, 'Không thể tạo file PDF xem trước'));
    } finally {
      setPreviewDownloading(false);
    }
  };

  const handleDownloadSaved = async phieu => {
    if (!phieu) return;

    setDownloadingPhieuId(phieu.maPhieuTamTru);
    try {
      const response = await phieuTamTruAPI.taiPdf(phieu.maPhieuTamTru);
      downloadBlob(response.data, buildCt01FileName(phieu));
    } catch (errorResponse) {
      toast.error(await extractErrorMessage(errorResponse, 'Không thể tải file PDF của phiếu'));
    } finally {
      setDownloadingPhieuId(null);
    }
  };

  const handleDeletePhieu = async phieu => {
    if (!phieu) return;

    const confirmed = window.confirm(`Xóa phiếu #${phieu.maPhieuTamTru} của ${phieu.hoTen || 'người kê khai'}?`);
    if (!confirmed) return;

    setDeletingPhieuId(phieu.maPhieuTamTru);
    try {
      await phieuTamTruAPI.xoa(phieu.maPhieuTamTru);

      const fallbackId = selectedPhieuId === phieu.maPhieuTamTru ? null : selectedPhieuId;
      await refreshList(fallbackId);

      if (editingId === phieu.maPhieuTamTru) {
        setEditingId(null);
        resetForm();
        setTab('list');
      }

      toast.success('Đã xóa phiếu tạm trú');
    } catch (errorResponse) {
      toast.error(await extractErrorMessage(errorResponse, 'Không thể xóa phiếu tạm trú'));
    } finally {
      setDeletingPhieuId(null);
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="phieu-page-header">
        <div>
          <h1 className="section-title">Phiếu tạm trú</h1>
          <p className="section-subtitle">
            Lập phiếu theo mẫu CT01, chỉnh sửa trực tiếp từng trường và tải PDF bám theo biểu mẫu Thông tư 66/2023/TT-BCA.
          </p>
        </div>
        <div className="phieu-brand-pill">FindRoomMate</div>
      </div>

      <div className="tabs">
        {[
          ['list', 'Danh sách phiếu'],
          ['form', isEditing ? 'Chỉnh sửa phiếu' : 'Tạo phiếu mới'],
        ].map(([key, label]) => (
          <div
            key={key}
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => {
              if (key === 'form' && tab !== 'form' && !isEditing) {
                resetForm();
              }
              setTab(key);
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {tab === 'list' && (
        loading ? (
          <div className="card">
            <div className="card-body">Đang tải phiếu tạm trú...</div>
          </div>
        ) : phieus.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">CT01</div>
            <p>Bạn chưa có phiếu tạm trú nào.</p>
            <button type="button" className="btn btn-primary" onClick={startCreate}>
              Tạo phiếu đầu tiên
            </button>
          </div>
        ) : (
          <div className="phieu-dashboard">
            <div className="card phieu-list-panel">
              <div className="card-header phieu-list-header">
                <span>Phiếu đã tạo</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={startCreate}>
                  Tạo mới
                </button>
              </div>
              <div className="card-body phieu-list-body">
                {phieus.map(phieu => (
                  <div
                    key={phieu.maPhieuTamTru}
                    className={`phieu-list-card ${selectedPhieu?.maPhieuTamTru === phieu.maPhieuTamTru ? 'active' : ''}`.trim()}
                  >
                    <button
                      type="button"
                      className="phieu-list-item"
                      onClick={() => setSelectedPhieuId(phieu.maPhieuTamTru)}
                    >
                      <strong>#{phieu.maPhieuTamTru} • {phieu.hoTen}</strong>
                      <span>{phieu.diaChiTamTru || 'Chưa cập nhật địa chỉ tạm trú'}</span>
                      <span>Tạm trú từ {formatDateVN(phieu.ngayBatDau) || 'chưa cập nhật'}</span>
                    </button>
                    <div className="phieu-list-item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => startEdit(phieu)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePhieu(phieu)}
                        disabled={deletingPhieuId === phieu.maPhieuTamTru}
                      >
                        {deletingPhieuId === phieu.maPhieuTamTru ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="phieu-preview-panel">
              <div className="phieu-preview-actions">
                <div>
                  <h3>Mẫu CT01 đã điền</h3>
                  <p>Biểu mẫu hiển thị theo CT01. Bạn có thể sửa, xóa hoặc tải lại PDF từ bản đã lưu bất kỳ lúc nào.</p>
                </div>
                <div className="phieu-action-group">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => selectedPhieu && startEdit(selectedPhieu)}
                    disabled={!selectedPhieu}
                  >
                    Sửa phiếu
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDeletePhieu(selectedPhieu)}
                    disabled={!selectedPhieu || deletingPhieuId === selectedPhieu?.maPhieuTamTru}
                  >
                    {deletingPhieuId === selectedPhieu?.maPhieuTamTru ? 'Đang xóa...' : 'Xóa phiếu'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleDownloadSaved(selectedPhieu)}
                    disabled={!selectedPhieu || downloadingPhieuId === selectedPhieu?.maPhieuTamTru}
                  >
                    {downloadingPhieuId === selectedPhieu?.maPhieuTamTru ? 'Đang tải...' : 'Tải PDF'}
                  </button>
                </div>
              </div>

              {selectedPhieu && <CT01Preview data={selectedPhieu} />}
            </div>
          </div>
        )
      )}

      {tab === 'form' && (
        <div className="phieu-editor">
          <div className="card phieu-form-card">
            <div className="card-header">
              {isEditing ? `Chỉnh sửa phiếu #${editingId}` : 'Khai báo thông tin tạm trú'}
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                Biểu mẫu xem trước và PDF sẽ hiển thị theo CT01. Địa chỉ tạm trú vẫn được dùng để tự tạo nội dung đề nghị khi bạn để trống phần đó.
              </div>

              <form noValidate onSubmit={handleSubmit}>
                <div className="phieu-form-section">
                  <h4>Thông tin cơ bản</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Cơ quan đăng ký</label>
                      <input
                        className="form-control"
                        maxLength={255}
                        placeholder="Ví dụ: Công an phường..."
                        value={form.coQuanDangKy}
                        onChange={event => setField('coQuanDangKy', event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giới tính</label>
                      <select
                        className="form-control"
                        value={form.gioiTinh}
                        onChange={event => setField('gioiTinh', event.target.value)}
                      >
                        <option value="">-- Chọn giới tính --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="phieu-form-section">
                  <h4>Thông tin người kê khai</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Họ và tên *</label>
                      <input
                        className="form-control"
                        maxLength={100}
                        value={form.hoTen}
                        onChange={event => setField('hoTen', event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số định danh cá nhân</label>
                      <input
                        className="form-control"
                        inputMode="numeric"
                        maxLength={12}
                        value={form.soCanCuocCongDan}
                        onChange={event => setField('soCanCuocCongDan', event.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        className="form-control"
                        inputMode="numeric"
                        maxLength={11}
                        value={form.soDienThoai}
                        onChange={event => setField('soDienThoai', event.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        type="email"
                        maxLength={255}
                        value={form.email}
                        onChange={event => setField('email', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Ngày sinh</label>
                      <input
                        className="form-control"
                        type="date"
                        value={form.ngaySinh}
                        onChange={event => setField('ngaySinh', event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ngày bắt đầu tạm trú *</label>
                      <input
                        className="form-control"
                        type="date"
                        value={form.ngayBatDau}
                        onChange={event => setField('ngayBatDau', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Địa chỉ thường trú</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      maxLength={255}
                      value={form.diaChiThuongTru}
                      onChange={event => setField('diaChiThuongTru', event.target.value)}
                    />
                  </div>
                </div>

                <div className="phieu-form-section">
                  <h4>Thông tin chủ hộ và nơi ở</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Tên chủ hộ</label>
                      <input
                        className="form-control"
                        maxLength={100}
                        value={form.tenChuHo}
                        onChange={event => setField('tenChuHo', event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mối quan hệ với chủ hộ</label>
                      <input
                        className="form-control"
                        maxLength={100}
                        value={form.quanHeVoiChuHo}
                        onChange={event => setField('quanHeVoiChuHo', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Số định danh của chủ hộ</label>
                      <input
                        className="form-control"
                        inputMode="numeric"
                        maxLength={12}
                        value={form.soDinhDanhChuHo}
                        onChange={event => setField('soDinhDanhChuHo', event.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Địa chỉ tạm trú *</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        maxLength={255}
                        placeholder="Nhập địa chỉ tạm trú để hiển thị trong nội dung đề nghị"
                        value={form.diaChiTamTru}
                        onChange={event => setField('diaChiTamTru', event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="phieu-form-section">
                  <h4>Nội dung đề nghị</h4>
                  <div className="form-group">
                    <label className="form-label">Nội dung đề nghị</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      maxLength={500}
                      placeholder="Để trống, hệ thống sẽ tự tạo nội dung theo địa chỉ tạm trú và ngày bắt đầu"
                      value={form.noiDungDeNghi}
                      onChange={event => setField('noiDungDeNghi', event.target.value)}
                    />
                  </div>
                </div>

                <div className="phieu-form-actions">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : isEditing ? 'Cập nhật phiếu' : 'Lưu phiếu tạm trú'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    disabled={previewDownloading}
                    onClick={handleDownloadPreview}
                  >
                    {previewDownloading ? 'Đang tạo PDF...' : 'Tải PDF xem trước'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={handleCancel}
                  >
                    {isEditing ? 'Hủy chỉnh sửa' : 'Làm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="phieu-preview-panel">
            <div className="phieu-preview-actions">
              <div>
                <h3>Xem trước mẫu CT01</h3>
                <p>Bản xem trước phản ánh đúng dữ liệu sẽ lưu và cũng là dữ liệu dùng để tạo PDF.</p>
              </div>
            </div>

            <CT01Preview data={previewData} />
          </div>
        </div>
      )}
    </div>
  );
}
