import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const AddressAPI = axios.create({
  baseURL: 'https://provinces.open-api.vn/api/v1',
  timeout: 15000,
});

// Attach JWT to every request
API.interceptors.request.use(config => {
  config.headers = config.headers || {};

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/dang-nhap') {
        window.location.assign('/dang-nhap');
      }
    }
    return Promise.reject(err);
  }
);

const deleteWithFallback = path =>
  API.post(`${path}/xoa`).catch(error => {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      return API.delete(path);
    }
    throw error;
  });

// ── AUTH ──────────────────────────────────────────────────────────────
export const authAPI = {
  dangKy: data => API.post('/auth/dang-ky', data),
  dangNhap: data => API.post('/auth/dang-nhap', data),
};

// ── NGƯỜI DÙNG ────────────────────────────────────────────────────────
export const nguoiDungAPI = {
  layThongTinToi: () => API.get('/nguoi-dung/toi'),
  layLichSuGiaoDich: () => API.get('/nguoi-dung/toi/lich-su-giao-dich'),
  layThongTin: id => API.get(`/nguoi-dung/${id}`),
  layTrangCaNhanCongKhai: id => API.get(`/nguoi-dung/cong-khai/${id}`),
  capNhat: data => API.put('/nguoi-dung/cap-nhat', data),
  capNhatRole: (id, role) => API.put(`/nguoi-dung/${id}/role`, { role }),
  capNhatKhoaTaiKhoan: (id, taiKhoanBiKhoa, lyDoKhoaTaiKhoan) => API.put(`/nguoi-dung/${id}/lock`, { taiKhoanBiKhoa, lyDoKhoaTaiKhoan }),
  uploadAvatar: formData => API.post('/nguoi-dung/upload-avatar', formData),
  xacThucCCCD: formData => API.post('/nguoi-dung/xac-thuc-cccd', formData, { timeout: 0 }),
};

// ── PHÒNG ─────────────────────────────────────────────────────────────
export const phongAPI = {
  taoPhong: data => API.post('/phong', data),
  layChiTiet: id => API.get(`/phong/${id}`),
  timKiem: params => API.get('/phong/tim-kiem', { params }),
  layPhongCuaToi: () => API.get('/phong/cua-toi'),
  layPhongThamGia: () => API.get('/phong/tham-gia'),
  capNhat: (id, data) => API.put(`/phong/${id}`, data),
  xoaThanhVien: (maPhong, maThanhVien) => API.delete(`/phong/${maPhong}/thanh-vien/${maThanhVien}`),
  xoa: id => deleteWithFallback(`/phong/${id}`),
};

// ── BÀI ĐĂNG ─────────────────────────────────────────────────────────
export const baiDangAPI = {
  layDanhSach: params => API.get('/bai-dang', { params }),
  layChiTiet: id => API.get(`/bai-dang/${id}`),
  layBaiDangCuaToi: () => API.get('/bai-dang/cua-toi'),
  tao: data => API.post('/bai-dang', data),
  capNhat: (id, data) => API.put(`/bai-dang/${id}`, data),
  uploadMedia: (id, formData) => API.post(`/bai-dang/${id}/upload-media`, formData),
  xoa: id => API.delete(`/bai-dang/${id}`),
};

// ── YÊU CẦU ──────────────────────────────────────────────────────────
export const yeuCauAPI = {
  gui: data => API.post('/yeu-cau', data),
  layCuaToi: () => API.get('/yeu-cau/cua-toi'),
  layCuaPhong: maPhong => API.get(`/yeu-cau/phong/${maPhong}`),
  duyet: (maYeuCau, chapNhan) => API.put(`/yeu-cau/${maYeuCau}/duyet?chapNhan=${chapNhan}`),
  huy: maYeuCau => API.delete(`/yeu-cau/${maYeuCau}`),
};

// ── THANH TOÁN ────────────────────────────────────────────────────────
export const thanhToanAPI = {
  xemSoDu: () => API.get('/thanh-toan/so-du'),
  napTien: soTien => API.post(`/thanh-toan/nap-tien?soTien=${soTien}`),
  taoHoaDon: data => API.post('/thanh-toan/tao-hoa-don', data),
  thanhToan: maHoaDon => API.post(`/thanh-toan/hoa-don/${maHoaDon}/thanh-toan`),
  chiaTien: maPhong => API.post(`/thanh-toan/chia-tien/${maPhong}`),
  chiaTienThuCong: (maPhong, data) => API.post(`/thanh-toan/chia-tien-thu-cong/${maPhong}`, data),
  layHoaDon: () => API.get('/thanh-toan/hoa-don'),
  layHoaDonPhongCuaToi: () => API.get('/thanh-toan/hoa-don/phong-cua-toi'),
};

// ── ĐÁNH GIÁ ─────────────────────────────────────────────────────────
export const danhGiaAPI = {
  tao: data => API.post('/danh-gia', data),
  layCuaToi: () => API.get('/danh-gia/cua-toi'),
  layNhanDuoc: () => API.get('/danh-gia/nhan-duoc'),
};

// ── PHIẾU TẠM TRÚ ────────────────────────────────────────────────────
export const phieuTamTruAPI = {
  tao: data => API.post('/tam-tru', data),
  capNhat: (id, data) => API.put(`/tam-tru/${id}`, data),
  xoa: id => deleteWithFallback(`/tam-tru/${id}`),
  layCuaToi: () => API.get('/tam-tru/cua-toi'),
  layMacDinh: () => API.get('/tam-tru/defaults'),
  layChiTiet: id => API.get(`/tam-tru/${id}`),
  taiPdfXemTruoc: data => API.post('/tam-tru/preview-pdf', data, { responseType: 'blob' }),
  taiPdf: id => API.get(`/tam-tru/${id}/pdf`, { responseType: 'blob' }),
};

export const thongKeAPI = {
  layTrangChu: () => API.get('/thong-ke/trang-chu'),
};

export const healthAPI = {
  kiemTraDatabase: () => API.get('/health/database'),
  kiemTraTrangThai: () => API.get('/health/status'),
};

export const chatAPI = {
  layLichSu: (maNguoiKia, params) => API.get(`/chat/${maNguoiKia}`, { params }),
  layHoiThoai: () => API.get('/chat/conversations'),
  layPresence: userIds => API.get('/chat/presence', { params: { userIds } }),
  layWebRtcConfig: () => API.get('/chat/webrtc-config'),
  guiTinNhan: payload => API.post('/chat/send', payload),
  xoaHoiThoai: maNguoiKia => API.delete(`/chat/conversations/${maNguoiKia}`),
  baoCaoHoiThoai: (maNguoiKia, payload) => API.post(`/chat/conversations/${maNguoiKia}/report`, payload),
  danhDauDaNhan: messageId => API.put(`/chat/messages/${messageId}/delivered`),
  danhDauDaXem: messageId => API.put(`/chat/messages/${messageId}/seen`),
  thuHoiTinNhan: messageId => API.put(`/chat/messages/${messageId}/recall`),
  xoaTinNhan: messageId => API.put(`/chat/messages/${messageId}/delete`),
  suaTinNhan: (messageId, noiDung) => API.put(`/chat/messages/${messageId}/edit`, { noiDung }),
  reactionTinNhan: (messageId, payload) => API.post(`/chat/messages/${messageId}/reactions`, payload),
};

export const adminChatAPI = {
  layBaoCaoHoiThoai: () => API.get('/admin/chat-reports'),
  capNhatBaoCaoHoiThoai: (reportId, payload) => API.put(`/admin/chat-reports/${reportId}`, payload),
};

export const addressAPI = {
  layTinhThanh: () => AddressAPI.get('/p/'),
  layTinhThanhChiTiet: maTinhThanh => AddressAPI.get(`/p/${maTinhThanh}?depth=2`),
};

export default API;
