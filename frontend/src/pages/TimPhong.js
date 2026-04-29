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
          toast.error('Khong tai duoc danh sach tinh thanh');
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
          toast.error('Khong tai duoc danh sach quan huyen');
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
      toast.error('Tim kiem that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Loc phong nang cao</h1>
      <p className="section-subtitle">Tim phong theo tinh thanh, quan huyen va cac tieu chi cu the cua ban</p>

      <form onSubmit={handleSearch} className="card" style={{ marginBottom: 28 }}>
        <div className="card-body">
          <div className="tim-phong-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tinh / Thanh pho</label>
              <select className="form-control" value={selectedTinhThanhCode} onChange={handleTinhThanhChange}>
                <option value="">-- Tat ca tinh thanh --</option>
                {tinhThanhs.map(item => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quan / Huyen</label>
              <select className="form-control" value={selectedQuanHuyenCode} onChange={handleQuanHuyenChange} disabled={!selectedTinhThanhCode}>
                <option value="">{selectedTinhThanhCode ? '-- Tat ca quan huyen --' : '-- Chon tinh thanh truoc --'}</option>
                {quanHuyens.map(item => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Dia chi chi tiet</label>
              <input
                className="form-control"
                placeholder="Ten duong, toa nha..."
                value={filters.diaChi}
                onChange={event => set('diaChi', event.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gia toi thieu</label>
              <input
                className="form-control"
                type="number"
                placeholder="0"
                value={filters.giaTienMin}
                onChange={event => set('giaTienMin', event.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gia toi da</label>
              <input
                className="form-control"
                type="number"
                placeholder="10000000"
                value={filters.giaTienMax}
                onChange={event => set('giaTienMax', event.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">So nguoi toi thieu</label>
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
            {loading ? 'Dang tim...' : 'Tim phong'}
          </button>
        </div>
      </form>

      <div className="map-placeholder card" style={{ marginBottom: 28 }}>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>DIA GIOI</div>
          <h3 style={{ marginTop: 12 }}>Bo loc dia gioi hanh chinh</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Tinh thanh va quan huyen dang duoc nap tu Vietnam Provinces API theo `openapi.json`.
          </p>
        </div>
      </div>

      {searched && (
        <>
          <h3 style={{ marginBottom: 16 }}>Ket qua: <strong>{phongs.length}</strong> phong</h3>
          {phongs.length === 0 ? (
            <div className="empty-state">
              <p>Khong tim thay phong phu hop.</p>
            </div>
          ) : (
            <div className="grid-3">
              {phongs.map(phong => (
                <div key={phong.maPhong} className="card phong-item">
                  <div className="card-body">
                    <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{phong.title}</h4>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{fmt(phong.giaTien)}/thang</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                      Dia chi: {buildPhongAddress(phong) || 'Chua cap nhat dia chi'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                      <span style={{ fontSize: 13 }}>O hien tai: {phong.soNguoiHienTai}/{phong.soNguoiToiDa} nguoi</span>
                      <span className={`badge ${phong.trangThai === 'San sang' ? 'badge-success' : 'badge-danger'}`}>
                        {phong.trangThai === 'San sang' ? 'Con trong' : 'Da day'}
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
