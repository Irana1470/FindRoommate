import { create } from 'zustand';
import { authAPI, nguoiDungAPI } from '../services/api';

const getErrorMessage = err => {
  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Không thể kết nối tới backend. Hãy đảm bảo backend đang chạy tại http://localhost:8080';
  }

  return 'Có lỗi xảy ra, vui lòng thử lại';
};

const normalizeEmail = email => email.trim().toLowerCase();
const normalizePhone = phone => phone.trim();

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  dangNhap: async (email, matKhau) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.dangNhap({ email: normalizeEmail(email), matKhau });
      const { token, ...user } = res.data.data;
      localStorage.setItem('token', token);
      set({ token, user, loading: false, error: null });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
      return false;
    }
  },

  dangKy: async data => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...data,
        hoTen: data.hoTen.trim(),
        email: normalizeEmail(data.email),
        soDienThoai: normalizePhone(data.soDienThoai),
      };
      const res = await authAPI.dangKy(payload);
      const { token, ...user } = res.data.data;
      localStorage.setItem('token', token);
      set({ token, user, loading: false, error: null });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
      return false;
    }
  },

  dangXuat: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  layThongTinToi: async () => {
    if (!get().token) return null;
    try {
      const res = await nguoiDungAPI.layThongTinToi();
      const nextUser = res.data.data;
      set({ user: nextUser });
      return nextUser;
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
