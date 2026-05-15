import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import { banBeAPI, chatAPI, danhGiaAPI, nguoiDungAPI, phongAPI, thanhToanAPI, yeuCauAPI } from '../../services/api';
import { formatConversationTime, getTimestamp, sortByNewest, subscribeConversationRead } from '../../utils/inbox';
import brandLogo from '../../assets/findroommate-logo.svg';
import './Navbar.css';

const STORAGE_KEY = 'frm_notifications_seen_at';
const ACCOUNT_STATUS_EVENT_KEY = 'frm_account_status_events';
const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

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

function ThemeIcon({ theme }) {
  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 3.2a8.8 8.8 0 1 0 6.3 14.9A9.4 9.4 0 0 1 14.5 3.2Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
      <path d="M12 1.8v2.6M12 19.6v2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M1.8 12h2.6M19.6 12h2.6M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AdminPanelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Zm0 4.1L8 8.7v2.1c0 3.4 1.9 5.6 4 6.9 2.1-1.3 4-3.5 4-6.9V8.7l-4-1.6Z" fill="currentColor" />
    </svg>
  );
}

const readAccountStatusEvents = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNT_STATUS_EVENT_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeAccountStatusEvents = value => {
  localStorage.setItem(ACCOUNT_STATUS_EVENT_KEY, JSON.stringify(value));
};

const syncAccountStatusEvent = (key, signature) => {
  const current = readAccountStatusEvents();

  if (!signature) {
    if (current[key]) {
      delete current[key];
      writeAccountStatusEvents(current);
    }
    return null;
  }

  if (current[key]?.signature === signature) {
    return current[key].time;
  }

  current[key] = { signature, time: Date.now() };
  writeAccountStatusEvents(current);
  return current[key].time;
};

const getRestrictionScopeText = account => {
  const scopes = [];
  if (account.hanCheDangBai) scopes.push('đăng bài');
  if (account.hanCheTaoPhong) scopes.push('tạo phòng');
  if (account.hanCheGuiYeuCauPhong) scopes.push('gửi yêu cầu tham gia phòng');

  if (scopes.length === 0) {
    return 'một số hoạt động';
  }

  return scopes.join(', ');
};

const buildAccountStatusNotifications = account => {
  if (!account?.maNguoiDung) {
    return [];
  }

  const items = [];
  const lockSignature = account.taiKhoanBiKhoa
    ? `lock:${account.lyDoKhoaTaiKhoan || ''}`
    : null;
  const lockTime = syncAccountStatusEvent('lock', lockSignature);

  if (lockTime) {
    items.push({
      id: `account-lock-${account.maNguoiDung}`,
      type: 'account',
      title: 'Tài khoản của bạn đã bị khóa',
      description: account.lyDoKhoaTaiKhoan || 'Vui lòng liên hệ quản trị viên để biết thêm chi tiết.',
      href: '/ho-so',
      thoiGian: lockTime,
    });
  }

  const restrictSignature = account.biHanCheHoatDong
    ? `restrict:${account.lyDoHanCheHoatDong || ''}:${account.hanCheDangBai}:${account.hanCheTaoPhong}:${account.hanCheGuiYeuCauPhong}:${account.thoiGianHanCheDen || ''}`
    : null;
  const restrictTime = syncAccountStatusEvent('restrict', restrictSignature);

  if (restrictTime) {
    const denHan = account.thoiGianHanCheDen
      ? ` đến ${new Date(account.thoiGianHanCheDen).toLocaleString('vi-VN')}`
      : '';
    items.push({
      id: `account-restrict-${account.maNguoiDung}`,
      type: 'account',
      title: 'Tài khoản của bạn đang bị hạn chế',
      description: `${getRestrictionScopeText(account)}${denHan}${account.lyDoHanCheHoatDong ? ` • ${account.lyDoHanCheHoatDong}` : ''}`,
      href: '/ho-so',
      thoiGian: restrictTime,
    });
  }

  const warningSignature = account.canhBaoTaiKhoan
    ? `warning:${account.canhBaoTaiKhoan}`
    : null;
  const warningTime = syncAccountStatusEvent('warning', warningSignature);

  if (warningTime) {
    items.push({
      id: `account-warning-${account.maNguoiDung}`,
      type: 'account',
      title: 'Tài khoản của bạn nhận được cảnh báo',
      description: account.canhBaoTaiKhoan,
      href: '/ho-so',
      thoiGian: warningTime,
    });
  }

  return items;
};

export default function Navbar() {
  const { user, dangXuat, layThongTinToi } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [conversations, setConversations] = useState([]);
  const menuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const unreadMessageCount = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.chuaDoc || 0), 0),
    [conversations]
  );

  const handleDangXuat = () => {
    dangXuat();
    navigate('/dang-nhap');
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
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
      return undefined;
    }

    return subscribeConversationRead(partnerId => {
      if (!partnerId) {
        return;
      }

      setConversations(current => current.map(conversation => (
        String(conversation.maNguoiKia) === String(partnerId)
          ? { ...conversation, chuaDoc: 0 }
          : conversation
      )));

      setNotifications(current => current.filter(item => item.id !== `message-${partnerId}`));
    });
  }, [user?.maNguoiDung]);

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

        const [
          accountResponse,
          friendResponse,
          conversationResponse,
          ratingResponse,
          roomResponse,
          invoiceResponse,
          sentRequestResponse,
          ownerInvoiceResponse,
        ] = await Promise.all([
          nguoiDungAPI.layThongTinToi().catch(async () => ({ data: { data: await layThongTinToi() } })),
          banBeAPI.layDanhSach().catch(() => ({ data: { data: { loiMoiDaNhan: [] } } })),
          chatAPI.layHoiThoai(),
          danhGiaAPI.layNhanDuoc(),
          phongAPI.layPhongCuaToi().catch(() => ({ data: { data: [] } })),
          thanhToanAPI.layHoaDon().catch(() => ({ data: { data: [] } })),
          yeuCauAPI.layCuaToi().catch(() => ({ data: { data: [] } })),
          thanhToanAPI.layHoaDonPhongCuaToi().catch(() => ({ data: { data: [] } })),
        ]);

        const conversationData = sortByNewest(conversationResponse.data.data || []);
        const accountInfo = accountResponse.data?.data || user;
        const loiMoiKetBan = friendResponse.data?.data?.loiMoiDaNhan || [];
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
            title: `${request.tenNguoiDung} vừa gửi yêu cầu vào phòng`,
            description: request.tenPhong || 'Có yêu cầu tham gia mới',
            href: '/yeu-cau',
            thoiGian: request.ngayYeuCau,
          }));

        const approvedRequestItems = (sentRequestResponse.data.data || [])
          .filter(request => request.trangThai === 'Chap nhan')
          .map(request => ({
            id: `request-approved-${request.maYeuCau}`,
            type: 'request',
            title: `Yêu cầu vào phòng ${request.tenPhong} đã được chấp nhận`,
            description: 'Bạn đã được chấp nhận vào phòng',
            href: '/yeu-cau',
            thoiGian: request.ngayYeuCau,
          }));

        const messageItems = conversationData
          .filter(conversation => (conversation.chuaDoc || 0) > 0)
          .map(conversation => ({
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
            description: `${invoice.tenPhong} • ${invoice.tongTien ? currencyFormatter.format(invoice.tongTien) : ''}`,
            href: '/hoa-don',
            thoiGian: invoice.ngayTao,
          }));

        const ownerPaidInvoiceItems = (ownerInvoiceResponse.data.data || [])
          .filter(invoice => invoice.trangThai === 'Da thanh toan' && invoice.ngayThanhToan)
          .map(invoice => ({
            id: `owner-paid-invoice-${invoice.maHoaDon}`,
            type: 'invoice',
            title: `${invoice.tenNguoiDung} đã thanh toán hóa đơn`,
            description: `${invoice.tenPhong} • ${invoice.tongTien ? currencyFormatter.format(invoice.tongTien) : ''}`,
            href: '/hoa-don',
            thoiGian: invoice.ngayThanhToan,
          }));

        const accountStatusItems = buildAccountStatusNotifications(accountInfo);
        const friendItems = loiMoiKetBan.map(item => ({
          id: `friend-${item.maBanBe}`,
          type: 'friend',
          title: `${item.nguoiGui?.hoTen || 'Người dùng'} muốn kết bạn với bạn`,
          description: item.nguoiGui?.email || item.nguoiGui?.soDienThoai || 'Mở để xem chi tiết lời mời',
          href: '/ban-be',
          thoiGian: item.ngayTao,
          maBanBe: item.maBanBe,
          nguoiGui: item.nguoiGui,
        }));

        setNotifications(sortByNewest([
          ...friendItems,
          ...accountStatusItems,
          ...requestItems,
          ...approvedRequestItems,
          ...messageItems,
          ...ratingItems,
          ...invoiceItems,
          ...ownerPaidInvoiceItems,
        ]).slice(0, 12));
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

  const handleFriendNotificationAction = async (maBanBe, chapNhan) => {
    try {
      await banBeAPI.phanHoiLoiMoi(maBanBe, chapNhan);
      setNotifications(current => current.filter(item => item.maBanBe !== maBanBe));
      toast.success(chapNhan ? 'Đã chấp nhận lời mời kết bạn' : 'Đã từ chối lời mời kết bạn');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý lời mời kết bạn');
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src={brandLogo} alt="FindRoomMate" className="navbar-brand-logo" />
          <span>FindRoomMate</span>
        </Link>

        <div className="navbar-links">
          <Link to="/bai-dang" className="nav-link">Tìm phòng</Link>
          <Link to="/tim-phong" className="nav-link">Lọc phòng</Link>
          {user && <Link to="/tao-bai-dang" className="nav-link">Đăng tin</Link>}
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="action-icon-button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            <ThemeIcon theme={theme} />
          </button>

          {user ? (
            <>
              <div className="notification-area" ref={notificationRef}>
                <Link to="/tin-nhan" className="action-icon-button" title="Tin nhắn">
                  <MessageIcon />
                  {unreadMessageCount > 0 && <span className="action-badge">{Math.min(unreadMessageCount, 9)}</span>}
                </Link>

                <button type="button" className="action-icon-button" onClick={handleToggleNotifications} title="Thông báo">
                  <BellIcon />
                  {unreadCount > 0 && <span className="action-badge">{Math.min(unreadCount, 9)}</span>}
                </button>

                {notificationsOpen && (
                  <div className="dropdown-menu notifications-menu">
                    <div className="dropdown-title-row">
                      <strong>Thông báo</strong>
                      <Link to="/tin-nhan" className="dropdown-link" onClick={() => setNotificationsOpen(false)}>
                        Mở hộp thư
                      </Link>
                    </div>

                    {loadingNotifications ? (
                      <div className="dropdown-empty">Đang tải thông báo...</div>
                    ) : notifications.length === 0 ? (
                      <div className="dropdown-empty">Chưa có thông báo mới.</div>
                    ) : (
                      notifications.map(item => (
                        item.type === 'friend' ? (
                          <div key={item.id} className="notification-item notification-item-friend">
                            <span className={`notification-dot ${item.type}`} />
                            <div className="notification-body">
                              <strong>{item.title}</strong>
                              <span>{item.description}</span>
                              <div className="notification-actions">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleFriendNotificationAction(item.maBanBe, true)}
                                >
                                  Chấp nhận
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleFriendNotificationAction(item.maBanBe, false)}
                                >
                                  Từ chối
                                </button>
                              </div>
                            </div>
                            <time>{formatConversationTime(item.thoiGian)}</time>
                          </div>
                        ) : (
                          <Link key={item.id} to={item.href} className="notification-item" onClick={() => setNotificationsOpen(false)}>
                            <span className={`notification-dot ${item.type}`} />
                            <div className="notification-body">
                              <strong>{item.title}</strong>
                              <span>{item.description}</span>
                            </div>
                            <time>{formatConversationTime(item.thoiGian)}</time>
                          </Link>
                        )
                      ))
                    )}
                  </div>
                )}
              </div>

              {user.role === 'ADMIN' && (
                <div className="admin-system-menu" ref={adminMenuRef}>
                  <button
                    type="button"
                    className={`admin-system-trigger ${adminMenuOpen ? 'active' : ''}`}
                    onClick={() => setAdminMenuOpen(current => !current)}
                    title="Quản lý hệ thống"
                  >
                    <AdminPanelIcon />
                    <span>Quản lý hệ thống</span>
                  </button>

                  {adminMenuOpen && (
                    <div className="dropdown-menu admin-system-dropdown">
                      <div className="dropdown-group-title">Quản lý hệ thống</div>
                      <Link to="/admin/bao-cao-chat" className="dropdown-item" onClick={() => setAdminMenuOpen(false)}>
                        🛡 Quản lý báo cáo chat
                      </Link>
                      <Link to="/admin/bao-cao-noi-dung" className="dropdown-item" onClick={() => setAdminMenuOpen(false)}>
                        📣 Quản lý báo cáo nội dung
                      </Link>
                      <Link to="/admin/nguoi-dung" className="dropdown-item" onClick={() => setAdminMenuOpen(false)}>
                        👥 Quản lý người dùng
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() => setMenuOpen(current => !current)}
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen)}&background=12355B&color=fff`}
                    alt={user.hoTen}
                    className="avatar avatar-sm"
                  />
                  <span className="user-name">{user.hoTen}</span>
                  {user.xacThuc && <span className="verified-badge">✓</span>}
                </button>

                {menuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/ho-so" className="dropdown-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <Link to="/quan-ly-bai-dang" className="dropdown-item" onClick={() => setMenuOpen(false)}>📝 Quản lý bài đăng</Link>
                    <Link to="/quan-ly-phong" className="dropdown-item" onClick={() => setMenuOpen(false)}>🏠 Quản lý phòng</Link>
                    <Link to="/yeu-cau" className="dropdown-item" onClick={() => setMenuOpen(false)}>📋 Yêu cầu</Link>
                    <Link to="/ban-be" className="dropdown-item" onClick={() => setMenuOpen(false)}>🤝 Bạn bè</Link>
                    <Link to="/tin-nhan" className="dropdown-item" onClick={() => setMenuOpen(false)}>💬 Tin nhắn</Link>
                    <Link to="/thanh-toan" className="dropdown-item" onClick={() => setMenuOpen(false)}>💰 Ví tiền</Link>
                    <Link to="/hoa-don" className="dropdown-item" onClick={() => setMenuOpen(false)}>📄 Hóa đơn của tôi</Link>
                    <Link to="/tam-tru" className="dropdown-item" onClick={() => setMenuOpen(false)}>📑 Tạm trú</Link>

                    {!user.xacThuc && (
                      <Link to="/xac-thuc" className="dropdown-item highlight" onClick={() => setMenuOpen(false)}>
                        🔐 Xác thực CCCD
                      </Link>
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
