import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { baiDangAPI } from '../services/api';
import RoomCard from '../components/room/RoomCard';
import './BaiDang.css';

export default function BaiDang() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [baiDangs, setBaiDangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState({
    tuKhoa: searchParams.get('tuKhoa') || '',
    diaChi: '',
    giaTienMin: '',
    giaTienMax: '',
  });

  const fetchData = async (p = 0) => {
    setLoading(true);
    try {
      const params = { page: p, size: 9 };
      if (filters.tuKhoa) params.tuKhoa = filters.tuKhoa;
      if (filters.diaChi) params.diaChi = filters.diaChi;
      if (filters.giaTienMin) params.giaTienMin = filters.giaTienMin;
      if (filters.giaTienMax) params.giaTienMax = filters.giaTienMax;
      const r = await baiDangAPI.layDanhSach(params);
      setBaiDangs(r.data.data?.content || []);
      setTotal(r.data.data?.totalElements || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(0); }, []);

  const handleSearch = e => {
    e.preventDefault();
    setPage(0);
    fetchData(0);
  };

  const set = (k, v) => setFilters(f => ({...f, [k]: v}));

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Tìm phòng & bạn ghép</h1>
      <p className="section-subtitle">Có <strong>{total}</strong> bài đăng phù hợp</p>

      <div className="baidang-layout">
        {/* Sidebar filter */}
        <aside className="filter-sidebar card">
          <div className="card-header">🔍 Bộ lọc</div>
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label className="form-label">Từ khóa</label>
                <input className="form-control" placeholder="Tìm kiếm..."
                  value={filters.tuKhoa} onChange={e => set('tuKhoa', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Khu vực</label>
                <input className="form-control" placeholder="Quận, phường, đường..."
                  value={filters.diaChi} onChange={e => set('diaChi', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Giá từ (đ/tháng)</label>
                <input className="form-control" type="number" placeholder="0"
                  value={filters.giaTienMin} onChange={e => set('giaTienMin', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Đến (đ/tháng)</label>
                <input className="form-control" type="number" placeholder="20,000,000"
                  value={filters.giaTienMax} onChange={e => set('giaTienMax', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Tìm kiếm</button>
              <button type="button" className="btn btn-secondary btn-block" style={{marginTop: 8}}
                onClick={() => { setFilters({ tuKhoa:'', diaChi:'', giaTienMin:'', giaTienMax:'' }); fetchData(0); }}>
                Xóa bộ lọc
              </button>
            </form>
          </div>
        </aside>

        {/* Results */}
        <div className="baidang-results">
          {loading ? (
            <div className="spinner" />
          ) : baiDangs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <p>Không tìm thấy bài đăng phù hợp.</p>
            </div>
          ) : (
            <>
              <div className="grid-3">
                {baiDangs.map(bd => <RoomCard key={bd.maBaiDang} baiDang={bd} />)}
              </div>
              <div className="pagination">
                <button className="btn btn-secondary btn-sm" disabled={page === 0}
                  onClick={() => { setPage(p => p-1); fetchData(page-1); }}>← Trước</button>
                <span>Trang {page + 1}</span>
                <button className="btn btn-secondary btn-sm" disabled={baiDangs.length < 9}
                  onClick={() => { setPage(p => p+1); fetchData(page+1); }}>Sau →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
