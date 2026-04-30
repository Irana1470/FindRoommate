import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { addressAPI, phongAPI } from '../services/api';
import { buildPhongAddress } from '../utils/location';
import './TimPhong.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function TimPhong() {
  const [filters, setFilters] = useState({
    giaTienMin: '',
    giaTienMax: '',
    tinhThanh: '',
    quanHuyen: '',
    diaChi: '',
    soNguoi: '',
  });
  const [phongs, setPhongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tinhThanhs, setTinhThanhs] = useState([]);
  const [quanHuyens, setQuanHuyens] = useState([]);
  const [selectedTinhThanhCode, setSelectedTinhThanhCode] = useState('');
  const [selectedQuanHuyenCode, setSelectedQuanHuyenCode] = useState('');

  const set = (key, value) => setFilters(current => ({ ...current, [key]: value }));

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
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!selectedTinhThanhCode) {
      setQuanHuyens([]);
      setSelectedQuanHuyenCode('');
      return undefined;
    }

    addressAPI.layTinhThanhChiTiet(selectedTinhThanhCode)
      .then(response => {
        if (active) {
          setQuanHuyens(response.data?.districts || []);
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Không tải được danh sách quận huyện');
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTinhThanhCode]);

  const handleTinhThanhChange = event => {
    const nextCode = event.target.value;
    const selectedTinhThanh = tinhThanhs.find(item => String(item.code) === nextCode);

    setSelectedTinhThanhCode(nextCode);
    setSelectedQuanHuyenCode('');
    setQuanHuyens([]);
    setFilters(current => ({
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

  const handleSearch = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const params = {};
      if (filters.giaTienMin) params.giaTienMin = filters.giaTienMin;
      if (filters.giaTienMax) params.giaTienMax = filters.giaTienMax;
      if (filters.tinhThanh) params.tinhThanh = filters.tinhThanh;
      if (filters.quanHuyen) params.quanHuyen = filters.quanHuyen;
      if (filters.diaChi) params.diaChi = filters.diaChi;
      if (filters.soNguoi) params.soNguoi = filters.soNguoi;

      const response = await phongAPI.timKiem(params);
      setPhongs(response.data.data || []);
      setSearched(true);
    } catch {
      toast.error('Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Lọc phòng nâng cao</h1>
      <p className="section-subtitle">Tìm phòng theo tỉnh thành, quận huyện và các tiêu chí cụ thể của bạn</p>

      <form onSubmit={handleSearch} className="card" style={{ marginBottom: 28 }}>
        <div className="card-body">
          <div className="tim-phong-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tỉnh / Thành phố</label>
              <select className="form-control" value={selectedTinhThanhCode} onChange={handleTinhThanhChange}>
                <option value="">-- Tất cả tỉnh thành --</option>
                {tinhThanhs.map(item => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quận / Huyện</label>
              <select className="form-control" value={selectedQuanHuyenCode} onChange={handleQuanHuyenChange} disabled={!selectedTinhThanhCode}>
                <option value="">{selectedTinhThanhCode ? '-- Tất cả quận huyện --' : '-- Chọn tỉnh thành trước --'}</option>
                {quanHuyens.map(item => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Địa chỉ chi tiết</label>
              <input
                className="form-control"
                placeholder="Tên đường, tòa nhà..."
                value={filters.diaChi}
                onChange={event => set('diaChi', event.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Giá tối thiểu</label>
              <input
                className="form-control"
                type="number"
                placeholder="0"
                value={filters.giaTienMin}
                onChange={event => set('giaTienMin', event.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Giá tối đa</label>
              <input
                className="form-control"
                type="number"
                placeholder="10000000"
                value={filters.giaTienMax}
                onChange={event => set('giaTienMax', event.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Số người tối thiểu</label>
              <input
                className="form-control"
                type="number"
                min="1"
                placeholder="2"
                value={filters.soNguoi}
                onChange={event => set('soNguoi', event.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm phòng'}
          </button>
        </div>
      </form>

      <div className="map-placeholder card" style={{ marginBottom: 28 }}>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>ĐỊA GIỚI</div>
          <h3 style={{ marginTop: 12 }}>Bộ lọc địa giới hành chính</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Tỉnh thành và quận huyện đang được nạp từ Vietnam Provinces API theo `openapi.json`.
          </p>
        </div>
      </div>

      {searched && (
        <>
          <h3 style={{ marginBottom: 16 }}>Kết quả: <strong>{phongs.length}</strong> phòng</h3>
          {phongs.length === 0 ? (
            <div className="empty-state">
              <p>Không tìm thấy phòng phù hợp.</p>
            </div>
          ) : (
            <div className="grid-3">
              {phongs.map(phong => (
                <div key={phong.maPhong} className="card phong-item">
                  <div className="card-body">
                    <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{phong.title}</h4>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{fmt(phong.giaTien)}/thang</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                      Địa chỉ: {buildPhongAddress(phong) || 'Chưa cập nhật địa chỉ'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                      <span style={{ fontSize: 13 }}>Ở hiện tại: {phong.soNguoiHienTai}/{phong.soNguoiToiDa} người</span>
                      <span className={`badge ${phong.trangThai === 'San sang' ? 'badge-success' : 'badge-danger'}`}>
                        {phong.trangThai === 'San sang' ? 'Còn trống' : 'Đã đầy'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
