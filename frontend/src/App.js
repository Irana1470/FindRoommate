import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

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
import PhieuTamTru from './pages/PhieuTamTru';
import YeuCau from './pages/YeuCau';
import TinNhan from './pages/TinNhan';

import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/dang-nhap" />;
};

export default function App() {
  const { token, layThongTinToi } = useAuthStore();

  useEffect(() => {
    if (token) layThongTinToi();
  }, [token]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
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
          <Route path="/tam-tru" element={<PrivateRoute><PhieuTamTru /></PrivateRoute>} />
          <Route path="/yeu-cau" element={<PrivateRoute><YeuCau /></PrivateRoute>} />
          <Route path="/tin-nhan" element={<PrivateRoute><TinNhan /></PrivateRoute>} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
