import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { phongAPI, yeuCauAPI } from '../services/api';

const getStatusLabel = status => {
  if (status === 'Chap nhan') return 'Chấp nhận';
  if (status === 'Tu choi') return 'Từ chối';
  return 'Chờ duyệt';
};

const getStatusBadge = status => {
  if (status === 'Chap nhan') return 'badge-success';
  if (status === 'Tu choi') return 'badge-danger';
  return 'badge-warning';
};

export default function YeuCau() {
  const [sentRequests, setSentRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [ownedRooms, setOwnedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sentRes, ownedRoomsRes] = await Promise.all([
        yeuCauAPI.layCuaToi(),
        phongAPI.layPhongCuaToi(),
      ]);

      const nextOwnedRooms = ownedRoomsRes.data.data || [];
      const incomingResponses = await Promise.all(
        nextOwnedRooms.map(room =>
          yeuCauAPI.layCuaPhong(room.maPhong).catch(() => ({ data: { data: [] } }))
        )
      );

      setSentRequests(sentRes.data.data || []);
      setOwnedRooms(nextOwnedRooms);
      setIncomingRequests(
        incomingResponses.flatMap(response => response.data.data || [])
      );
    } catch {
      toast.error('Không tải được danh sách yêu cầu');
      setSentRequests([]);
      setIncomingRequests([]);
      setOwnedRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingIncomingRequests = useMemo(
    () => incomingRequests.filter(request => request.trangThai === 'Chờ duyệt'),
    [incomingRequests]
  );

  const handleApprove = async (requestId, accepted) => {
    setActingId(requestId);
    try {
      await yeuCauAPI.duyet(requestId, accepted);
      toast.success(accepted ? 'Đã duyêt yêu cầu' : 'Đã từ chối yêu cầu');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xử lý yêu cầu thất bại');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async requestId => {
    setActingId(requestId);
    try {
      await yeuCauAPI.huy(requestId);
      toast.success('Da huy yeu cau');
      setSentRequests(current => current.filter(request => request.maYeuCau !== requestId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'hủy yêu cầu thất bại');
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Yêu cầu tham gia phòng</h1>
      <p className="section-subtitle">Quản lý yêu cầu vào phòng của bạn và các yêu cầu đã gửi.</p>

      <div style={{ display: 'grid', gap: 24 }}>
        <section className="card">
          <div className="card-header">Yêu cầu vào phòng</div>
          <div className="card-body">
            {ownedRooms.length === 0 ? (
              <div className="member-empty">Không có yêu cầu nào.</div>
            ) : incomingRequests.length === 0 ? (
              <div className="member-empty">Chưa có ai gửi yêu cầu vào phòng của bạn.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {incomingRequests.map(request => (
                  <div key={request.maYeuCau} className="card">
                    <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          <Link to={`/nguoi-dung/${request.maNguoiDung}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {request.tenNguoiDung}
                          </Link>
                          {' '}muon vao phong: <strong>{request.tenPhong}</strong>
                        </div>
                        {request.moTa && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{request.moTa}</div>
                        )}
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                          Gui luc: {request.ngayYeuCau ? new Date(request.ngayYeuCau).toLocaleString('vi-VN') : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <span className={`badge ${getStatusBadge(request.trangThai)}`}>
                          {getStatusLabel(request.trangThai)}
                        </span>
                        {request.trangThai === 'Cho duyet' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(request.maYeuCau, true)}
                              disabled={actingId === request.maYeuCau}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleApprove(request.maYeuCau, false)}
                              disabled={actingId === request.maYeuCau}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingIncomingRequests.length > 0 && (
              <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 13 }}>
                Dang co {pendingIncomingRequests.length} yeu cau cho duyet.
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">Yêu cầu đã gửi</div>
          <div className="card-body">
            {sentRequests.length === 0 ? (
              <div className="member-empty">Bạn chưa gửi yêu cầu nào.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sentRequests.map(request => (
                  <div key={request.maYeuCau} className="card">
                    <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          Phong: <strong>{request.tenPhong}</strong>
                        </div>
                        {request.moTa && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{request.moTa}</div>
                        )}
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                          Gửi lúc: {request.ngayYeuCau ? new Date(request.ngayYeuCau).toLocaleString('vi-VN') : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <span className={`badge ${getStatusBadge(request.trangThai)}`}>
                          {getStatusLabel(request.trangThai)}
                        </span>
                        {request.trangThai === 'Cho duyet' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCancel(request.maYeuCau)}
                            disabled={actingId === request.maYeuCau}
                          >
                            Huy yeu cau
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
