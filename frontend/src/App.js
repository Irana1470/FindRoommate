import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useTheme, { ThemeProvider } from './hooks/useTheme';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import TrangChu from './pages/TrangChu';
import DangNhap from './pages/DangNhap';
import DangKy from './pages/DangKy';
import TimPhong from './pages/TimPhong';
import ChiTietPhong from './pages/ChiTietPhong';
import TaoPhong from './pages/TaoPhong';
import BaiDang from './pages/BaiDang';
import ChiTietBaiDang from './pages/ChiTietBaiDang';
import TaoBaiDang from './pages/TaoBaiDang';
import HoSoCaNhan from './pages/HoSoCaNhan';
import TrangCaNhanCongKhai from './pages/TrangCaNhanCongKhai';
import XacThucDanhTinh from './pages/XacThucDanhTinh';
import QuanLyPhong from './pages/QuanLyPhong';
import QuanLyBaiDang from './pages/QuanLyBaiDang';
import ThanhToan from './pages/ThanhToan';
import HoaDonCuaToi from './pages/HoaDonCuaToi';
import DanhGia from './pages/DanhGia';
import BanBe from './pages/BanBe';
import PhieuTamTru from './pages/PhieuTamTru';
import YeuCau from './pages/YeuCau';
import TinNhan from './pages/TinNhan';
import AdminBaoCaoHoiThoai from './pages/AdminBaoCaoHoiThoai';
import AdminBaoCaoNoiDung from './pages/AdminBaoCaoNoiDung';
import AdminNguoiDung from './pages/AdminNguoiDung';

import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/dang-nhap" />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) {
    return <Navigate to="/dang-nhap" />;
  }
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const { token, layThongTinToi } = useAuthStore();
  const { theme } = useTheme();

  useEffect(() => {
    if (token) layThongTinToi();
  }, [token, layThongTinToi]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#142033' : '#ffffff',
            color: theme === 'dark' ? '#f5f9ff' : '#132235',
            border: theme === 'dark' ? '1px solid #314766' : '1px solid #d6e1ec',
            boxShadow: theme === 'dark' ? '0 18px 42px rgba(0, 0, 0, 0.4)' : '0 18px 42px rgba(16, 36, 58, 0.12)',
          },
        }}
      />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TrangChu />} />
          <Route path="/dang-nhap" element={<DangNhap />} />
          <Route path="/dang-ky" element={<DangKy />} />
          <Route path="/tim-phong" element={<TimPhong />} />
          <Route path="/phong/:id" element={<ChiTietPhong />} />
          <Route path="/bai-dang" element={<BaiDang />} />
          <Route path="/bai-dang/:id" element={<ChiTietBaiDang />} />
          <Route path="/tao-bai-dang" element={<PrivateRoute><TaoBaiDang /></PrivateRoute>} />
          <Route path="/bai-dang/:id/chinh-sua" element={<PrivateRoute><TaoBaiDang /></PrivateRoute>} />
          <Route path="/tao-phong" element={<PrivateRoute><TaoPhong /></PrivateRoute>} />
          <Route path="/phong/:id/chinh-sua" element={<PrivateRoute><TaoPhong /></PrivateRoute>} />
          <Route path="/ho-so" element={<PrivateRoute><HoSoCaNhan /></PrivateRoute>} />
          <Route path="/nguoi-dung/:id" element={<TrangCaNhanCongKhai />} />
          <Route path="/quan-ly-bai-dang" element={<PrivateRoute><QuanLyBaiDang /></PrivateRoute>} />
          <Route path="/xac-thuc" element={<PrivateRoute><XacThucDanhTinh /></PrivateRoute>} />
          <Route path="/quan-ly-phong" element={<PrivateRoute><QuanLyPhong /></PrivateRoute>} />
          <Route path="/thanh-toan" element={<PrivateRoute><ThanhToan /></PrivateRoute>} />
          <Route path="/hoa-don" element={<PrivateRoute><HoaDonCuaToi /></PrivateRoute>} />
          <Route path="/danh-gia" element={<PrivateRoute><DanhGia /></PrivateRoute>} />
          <Route path="/ban-be" element={<PrivateRoute><BanBe /></PrivateRoute>} />
          <Route path="/tam-tru" element={<PrivateRoute><PhieuTamTru /></PrivateRoute>} />
          <Route path="/yeu-cau" element={<PrivateRoute><YeuCau /></PrivateRoute>} />
          <Route path="/tin-nhan" element={<PrivateRoute><TinNhan /></PrivateRoute>} />
          <Route path="/admin/bao-cao-chat" element={<AdminRoute><AdminBaoCaoHoiThoai /></AdminRoute>} />
          <Route path="/admin/bao-cao-noi-dung" element={<AdminRoute><AdminBaoCaoNoiDung /></AdminRoute>} />
          <Route path="/admin/nguoi-dung" element={<AdminRoute><AdminNguoiDung /></AdminRoute>} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
