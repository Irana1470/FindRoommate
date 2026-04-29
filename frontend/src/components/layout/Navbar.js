import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { chatAPI, danhGiaAPI, phongAPI, thanhToanAPI, yeuCauAPI } from '../../services/api';
import { formatConversationTime, getTimestamp, sortByNewest } from '../../utils/inbox';
import './Navbar.css';

const STORAGE_KEY = 'frm_notifications_seen_at';

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-4H5l1.25-1.48A2 2 0 0 0 6.75 15V11a5.25 5.25 0 1 1 10.5 0v4c0 .46.16.91.5 1.26L19 18Z" fill="currentColor" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="messageIconBg" x1="4" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#153f82" />
          <stop offset="1" stopColor="#0b1f4f" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#messageIconBg)" />
      <path d="M7.2 8.2A2.2 2.2 0 0 1 9.4 6h5.2a2.2 2.2 0 0 1 2.2 2.2v4.2a2.2 2.2 0 0 1-2.2 2.2h-3.5l-2.9 2.6v-2.6H9.4a2.2 2.2 0 0 1-2.2-2.2V8.2Z" fill="#fff" />
      <circle cx="10.1" cy="10.3" r="0.7" fill="#153f82" />
      <circle cx="12" cy="10.3" r="0.7" fill="#153f82" />
      <circle cx="13.9" cy="10.3" r="0.7" fill="#153f82" />
    </svg>
  );
}

export default function Navbar() {
  const { user, dangXuat } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [conversations, setConversations] = useState([]);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  const handleDangXuat = () => {
    dangXuat();
    navigate('/dang-nhap');
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.maNguoiDung) {
      setNotifications([]);
      setConversations([]);
      return undefined;
    }

    let active = true;

    const loadActivity = async () => {
      try {
        if (active) {
          setLoadingNotifications(true);
        }

        const [conversationResponse, ratingResponse, roomResponse, invoiceResponse] = await Promise.all([
          chatAPI.layHoiThoai(),
          danhGiaAPI.layNhanDuoc(),
          phongAPI.layPhongCuaToi().catch(() => ({ data: { data: [] } })),
          thanhToanAPI.layHoaDon().catch(() => ({ data: { data: [] } })),
        ]);

        const conversationData = sortByNewest(conversationResponse.data.data || []);
        const rooms = roomResponse.data.data || [];
        const requestResponses = await Promise.all(
          rooms.map(room => yeuCauAPI.layCuaPhong(room.maPhong).catch(() => ({ data: { data: [] } })))
        );

        if (!active) {
          return;
        }

        setConversations(conversationData);

        const requestItems = requestResponses
          .flatMap(response => response.data.data || [])
          .map(request => ({
            id: `request-${request.maYeuCau}`,
            type: 'request',
            title: `${request.tenNguoiDung} vừa apply vào phòng`,
            description: request.tenPhong || 'Có yêu cầu tham gia mới',
            href: '/yeu-cau',
            thoiGian: request.ngayYeuCau,
          }));

        const messageItems = conversationData.map(conversation => ({
          id: `message-${conversation.maNguoiKia}`,
          type: 'message',
          title: `${conversation.tenNguoiKia} đã gửi tin nhắn`,
          description: conversation.tinNhanCuoi,
          href: `/tin-nhan?nguoiDung=${conversation.maNguoiKia}`,
          thoiGian: conversation.thoiGian,
        }));

        const ratingItems = (ratingResponse.data.data || []).map(review => ({
          id: `rating-${review.maDanhGia}`,
          type: 'rating',
          title: `${review.tenNguoiDanhGia} đã đánh giá bạn`,
          description: `${review.soSao}/5 sao${review.moTa ? ` • ${review.moTa}` : ''}`,
          href: '/danh-gia',
          thoiGian: review.ngayDanhGia,
        }));

        const invoiceItems = (invoiceResponse.data.data || [])
          .filter(invoice => invoice.trangThai !== 'Da thanh toan')
          .map(invoice => ({
            id: `invoice-${invoice.maHoaDon}`,
            type: 'invoice',
            title: `Hóa đơn #${invoice.maHoaDon} chưa thanh toán`,
            description: `${invoice.tenPhong} • ${invoice.tongTien ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.tongTien) : ''}`,
            href: '/hoa-don',
            thoiGian: invoice.ngayTao,
          }));

        setNotifications(sortByNewest([...requestItems, ...messageItems, ...ratingItems, ...invoiceItems]).slice(0, 12));
      } catch {
        if (active) {
          setNotifications([]);
        }
      } finally {
        if (active) {
          setLoadingNotifications(false);
        }
      }
    };

    loadActivity();
    const timer = window.setInterval(loadActivity, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.maNguoiDung]);

  const unreadCount = useMemo(() => {
    const lastSeen = Number(localStorage.getItem(STORAGE_KEY) || 0);
    return notifications.filter(item => getTimestamp(item.thoiGian) > lastSeen).length;
  }, [notifications]);

  const handleToggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          🏠 <span>FindRoomMate</span>
        </Link>

        <div className="navbar-links">
          <Link to="/bai-dang" className="nav-link">Tìm phòng</Link>
          <Link to="/tim-phong" className="nav-link">Lọc phòng</Link>
          {user && <Link to="/tao-bai-dang" className="nav-link">Đăng tin</Link>}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="notification-area" ref={notificationRef}>
                <Link to="/tin-nhan" className="action-icon-button" title="Tin nhắn">
                  <MessageIcon />
                  {conversations.length > 0 && <span className="action-badge">{Math.min(conversations.length, 9)}</span>}
                </Link>

                <button type="button" className="action-icon-button" onClick={handleToggleNotifications} title="Thông báo">
                  <BellIcon />
                  {unreadCount > 0 && <span className="action-badge">{Math.min(unreadCount, 9)}</span>}
                </button>

                {notificationsOpen && (
                  <div className="dropdown-menu notifications-menu">
                    <div className="dropdown-title-row">
                      <strong>Thông báo</strong>
                      <Link to="/tin-nhan" className="dropdown-link" onClick={() => setNotificationsOpen(false)}>Mở hộp thư</Link>
                    </div>

                    {loadingNotifications ? (
                      <div className="dropdown-empty">Đang tải thông báo...</div>
                    ) : notifications.length === 0 ? (
                      <div className="dropdown-empty">Chưa có thông báo mới.</div>
                    ) : (
                      notifications.map(item => (
                        <Link key={item.id} to={item.href} className="notification-item" onClick={() => setNotificationsOpen(false)}>
                          <span className={`notification-dot ${item.type}`} />
                          <div className="notification-body">
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                          </div>
                          <time>{formatConversationTime(item.thoiGian)}</time>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="user-menu" ref={menuRef} onClick={() => setMenuOpen(!menuOpen)}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=12355B&color=fff`}
                  alt={user.hoTen}
                  className="avatar avatar-sm"
                />
                <span className="user-name">{user.hoTen}</span>
                {user.xacThuc && <span className="verified-badge">✓</span>}

                {menuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/ho-so" className="dropdown-item">👤 Hồ sơ</Link>
                    <Link to="/quan-ly-bai-dang" className="dropdown-item">📝 Quản lý bài đăng</Link>
                    <Link to="/quan-ly-phong" className="dropdown-item">🏠 Quản lý phòng</Link>
                    <Link to="/yeu-cau" className="dropdown-item">📋 Yêu cầu</Link>
                    <Link to="/tin-nhan" className="dropdown-item">💬 Tin nhắn</Link>
                    <Link to="/thanh-toan" className="dropdown-item">💰 Ví tiền</Link>
                    <Link to="/hoa-don" className="dropdown-item">📄 Hóa đơn của tôi</Link>
                    <Link to="/tam-tru" className="dropdown-item">📑 Tạm trú</Link>
                    {!user.xacThuc && (
                      <Link to="/xac-thuc" className="dropdown-item highlight">🔐 Xác thực CCCD</Link>
                    )}
                    <div className="dropdown-divider" />
                    <button type="button" onClick={handleDangXuat} className="dropdown-item danger">🚪 Đăng xuất</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/dang-nhap" className="btn btn-outline btn-sm">Đăng nhập</Link>
              <Link to="/dang-ky" className="btn btn-primary btn-sm">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
