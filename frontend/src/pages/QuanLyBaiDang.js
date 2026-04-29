import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { baiDangAPI } from '../services/api';
import './QuanLyBaiDang.css';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function QuanLyBaiDang() {
  const [baiDangCuaToi, setBaiDangCuaToi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingBaiDangId, setDeletingBaiDangId] = useState(null);

  useEffect(() => {
    let active = true;

    baiDangAPI.layBaiDangCuaToi()
      .then(res => {
        if (active) {
          setBaiDangCuaToi(res.data.data || []);
        }
      })
      .catch(() => {
        if (active) {
          setBaiDangCuaToi([]);
          toast.error('Không tải được danh sách bài đăng');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDeleteBaiDang = async maBaiDang => {
    if (!window.confirm('Bạn có chắc muốn xóa bài đăng này không?')) return;

    setDeletingBaiDangId(maBaiDang);
    try {
      await baiDangAPI.xoa(maBaiDang);
      setBaiDangCuaToi(current => current.filter(item => item.maBaiDang !== maBaiDang));
      toast.success('Đã xóa bài đăng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa bài đăng thất bại');
    }
    setDeletingBaiDangId(null);
  };

  const baiDangHienThi = [...baiDangCuaToi]
    .sort((a, b) => new Date(b.ngayDang || 0) - new Date(a.ngayDang || 0));

  return (
    <div className="container page-wrapper">
      <div className="post-page-header">
        <div>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Quản lý bài đăng</h1>
          <p className="section-subtitle">Theo dõi, chỉnh sửa hoặc xóa các bài đăng của bạn.</p>
        </div>
        <Link to="/tao-bai-dang" className="btn btn-primary">Đăng bài mới</Link>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : baiDangHienThi.length === 0 ? (
        <div className="card">
          <div className="card-body review-empty">
            Bạn chưa có bài đăng nào. Hãy tạo bài đăng để tìm bạn ở ghép.
          </div>
        </div>
      ) : (
        <div className="post-manage-list">
          {baiDangHienThi.map(baiDang => (
            <div key={baiDang.maBaiDang} className="post-manage-item">
              <div className="post-manage-top">
                <div>
                  <div className="post-manage-title">{baiDang.moTa}</div>
                  <div className="post-manage-meta">
                    <span>{fmt(baiDang.giaTien)}/tháng</span>
                    <span>{baiDang.diaChi}</span>
                    <span>{baiDang.ngayDang ? new Date(baiDang.ngayDang).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                </div>
                <span
                  className={`badge ${
                    baiDang.trangThai === 'Dang'
                      ? 'badge-success'
                      : baiDang.trangThai === 'Tam dung'
                        ? 'badge-warning'
                        : 'badge-gray'
                  }`}
                >
                  {baiDang.trangThai || 'Dang'}
                </span>
              </div>

              {baiDang.noiDung && (
                <div className="post-manage-content">{baiDang.noiDung}</div>
              )}

              <div className="post-manage-actions">
                <Link to={`/bai-dang/${baiDang.maBaiDang}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
                <Link to={`/bai-dang/${baiDang.maBaiDang}/chinh-sua`} className="btn btn-secondary btn-sm">Chỉnh sửa</Link>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteBaiDang(baiDang.maBaiDang)}
                  disabled={deletingBaiDangId === baiDang.maBaiDang}
                >
                  {deletingBaiDangId === baiDang.maBaiDang ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
