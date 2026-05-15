import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChatBox from '../components/chat/ChatBox';
import { banBeAPI, chatAPI, nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { emitConversationRead, formatConversationTime, getAvatarUrl, sortByNewest } from '../utils/inbox';
import './TinNhan.css';

const buildAdHocConversation = profile => ({
  maNguoiKia: profile.maNguoiDung,
  tenNguoiKia: profile.hoTen,
  avatarNguoiKia: profile.avatar,
  tinNhanCuoi: 'Bắt đầu cuộc trò chuyện mới',
  thoiGian: null,
  laTinCuaToi: false,
  online: false,
  lastActive: null,
  chuaDoc: 0,
  tamThoi: true,
});

export default function TinNhan() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [friendData, setFriendData] = useState({ banBe: [] });
  const [contactKeyword, setContactKeyword] = useState('');
  const [contactResults, setContactResults] = useState([]);
  const [searchingContacts, setSearchingContacts] = useState(false);

  const selectedId = searchParams.get('nguoiDung');

  const upsertConversation = profile => {
    setConversations(current => sortByNewest([
      buildAdHocConversation(profile),
      ...current.filter(item => String(item.maNguoiKia) !== String(profile.maNguoiDung)),
    ]));
    setSearchParams({ nguoiDung: String(profile.maNguoiDung) });
  };

  const loadFriends = async () => {
    try {
      const response = await banBeAPI.layDanhSach();
      setFriendData(response.data.data || { banBe: [] });
    } catch {
      setFriendData({ banBe: [] });
    }
  };

  const loadConversations = async () => {
    try {
      const response = await chatAPI.layHoiThoai();
      const data = sortByNewest(response.data.data || []);
      setConversations(current => {
        const selected = current.find(item => String(item.maNguoiKia) === selectedId && item.tamThoi);
        return selected && !data.some(item => String(item.maNguoiKia) === String(selected.maNguoiKia))
          ? sortByNewest([selected, ...data])
          : data;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được danh sách hội thoại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    loadFriends();
    const timer = window.setInterval(() => {
      loadConversations();
      loadFriends();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    const targetUserId = searchParams.get('nguoiDung');

    if (!targetUserId || conversations.some(item => String(item.maNguoiKia) === targetUserId)) {
      return undefined;
    }

    nguoiDungAPI.layTrangCaNhanCongKhai(targetUserId)
      .then(response => {
        if (!active) {
          return;
        }

        const profile = response.data.data;
        if (!profile || profile.maNguoiDung === user?.maNguoiDung) {
          return;
        }

        setConversations(current => sortByNewest([
          buildAdHocConversation(profile),
          ...current.filter(item => item.maNguoiKia !== profile.maNguoiDung),
        ]));
      })
      .catch(() => {
        if (active) {
          toast.error('Không mở được cuộc trò chuyện này');
        }
      });

    return () => {
      active = false;
    };
  }, [conversations, searchParams, user?.maNguoiDung]);

  useEffect(() => {
    if (loading || selectedId || !conversations.length) {
      return;
    }

    setSearchParams({ nguoiDung: String(conversations[0].maNguoiKia) }, { replace: true });
  }, [conversations, loading, selectedId, setSearchParams]);

  useEffect(() => {
    if (loading || !selectedId) {
      return;
    }

    if (!conversations.some(item => String(item.maNguoiKia) === selectedId)) {
      if (conversations.length > 0) {
        setSearchParams({ nguoiDung: String(conversations[0].maNguoiKia) }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [conversations, loading, selectedId, setSearchParams]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    setConversations(current => current.map(conversation => (
      String(conversation.maNguoiKia) === String(selectedId)
        ? { ...conversation, chuaDoc: 0 }
        : conversation
    )));
    emitConversationRead(selectedId);
  }, [selectedId]);

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return conversations;
    }

    return conversations.filter(item => item.tenNguoiKia?.toLowerCase().includes(keyword));
  }, [conversations, search]);

  const selectedConversation = conversations.find(item => String(item.maNguoiKia) === selectedId) || null;

  const handleConversationDeleted = partnerId => {
    setConversations(current => current.filter(item => String(item.maNguoiKia) !== String(partnerId)));
    setRefreshKey(value => value + 1);
  };

  const handleContactSearch = async () => {
    if (!contactKeyword.trim()) {
      setContactResults([]);
      return;
    }

    setSearchingContacts(true);
    try {
      const response = await banBeAPI.timNguoiDung(contactKeyword.trim());
      setContactResults(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tìm được người dùng');
    } finally {
      setSearchingContacts(false);
    }
  };

  const openConversationFromUser = profile => {
    if (!profile?.maNguoiDung) {
      return;
    }
    upsertConversation(profile);
  };

  const renderQuickUser = profile => (
    <button
      key={profile.maNguoiDung}
      type="button"
      className="message-quick-user"
      onClick={() => openConversationFromUser(profile)}
    >
      <img
        src={getAvatarUrl(profile.hoTen, profile.avatar)}
        alt={profile.hoTen}
        className="avatar avatar-md"
      />
      <div className="message-quick-user-body">
        <strong>{profile.hoTen}</strong>
        <span>{profile.email || 'Chưa có Gmail'}</span>
        <span>{profile.soDienThoai || 'Chưa có số điện thoại'}</span>
      </div>
    </button>
  );

  return (
    <div className="container page-wrapper">
      <div className="messages-shell messenger-surface">
        <aside className="messages-sidebar card">
          <div className="messages-sidebar-header">
            <div>
              <h1>Messenger</h1>
            </div>
          </div>

          <div className="messages-search">
            <input
              className="form-control"
              placeholder="Tìm cuộc trò chuyện..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <div className="messages-contact-search">
            <div className="messages-section-title">Tìm người dùng</div>
            <div className="messages-contact-search-row">
              <input
                className="form-control"
                placeholder="Nhập số điện thoại hoặc Gmail"
                value={contactKeyword}
                onChange={event => setContactKeyword(event.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleContactSearch} disabled={searchingContacts}>
                {searchingContacts ? 'Đang tìm...' : 'Tìm'}
              </button>
            </div>

            {contactResults.length > 0 && (
              <div className="messages-quick-list">
                {contactResults.map(renderQuickUser)}
              </div>
            )}
          </div>

          <div className="messages-friends">
            <div className="messages-section-title">Bạn bè</div>
            {friendData.banBe?.length ? (
              <div className="messages-quick-list">
                {friendData.banBe.map(renderQuickUser)}
              </div>
            ) : (
              <div className="messages-mini-empty">
                <span>Chưa có bạn bè nào.</span>
                <Link to="/ban-be" className="btn btn-outline btn-sm">Quản lý bạn bè</Link>
              </div>
            )}
          </div>

          <div className="messages-list">
            {loading ? (
              <div className="messages-empty">Đang tải cuộc trò chuyện...</div>
            ) : !filteredConversations.length ? (
              <div className="messages-empty">
                <div>Chưa có cuộc trò chuyện nào.</div>
                <Link to="/bai-dang" className="btn btn-primary btn-sm">Tìm người để nhắn tin</Link>
              </div>
            ) : (
              filteredConversations.map(conversation => {
                const active = String(conversation.maNguoiKia) === selectedId;
                return (
                  <button
                    key={conversation.maNguoiKia}
                    className={`message-thread ${active ? 'active' : ''}`}
                    onClick={() => setSearchParams({ nguoiDung: String(conversation.maNguoiKia) })}
                  >
                    <div className="thread-avatar-wrap">
                      <img
                        src={getAvatarUrl(conversation.tenNguoiKia, conversation.avatarNguoiKia)}
                        alt={conversation.tenNguoiKia}
                        className="avatar avatar-md"
                      />
                      <span className={`thread-presence ${conversation.online ? 'online' : 'offline'}`} />
                    </div>

                    <div className="message-thread-body">
                      <div className="message-thread-top">
                        <strong>{conversation.tenNguoiKia}</strong>
                        <span>{formatConversationTime(conversation.thoiGian)}</span>
                      </div>

                      <div className="message-thread-preview-row">
                        <div className="message-thread-preview">
                          {conversation.laTinCuaToi && !conversation.tamThoi ? 'Bạn: ' : ''}
                          {conversation.tinNhanCuoi || 'Chưa có tin nhắn'}
                        </div>

                        {conversation.chuaDoc > 0 && (
                          <span className="thread-unread">{conversation.chuaDoc > 9 ? '9+' : conversation.chuaDoc}</span>
                        )}
                      </div>

                      <div className="thread-status-line">
                        {conversation.online
                          ? 'Đang hoạt động'
                          : conversation.lastActive
                            ? `Hoạt động ${formatConversationTime(conversation.lastActive)}`
                            : 'Offline'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="messages-panel card">
          {!selectedConversation ? (
            <div className="messages-panel-empty">
              <div className="messages-panel-icon">💬</div>
              <h2>Chọn một cuộc trò chuyện</h2>
              <p>Danh sách hội thoại nằm bên trái để chuyển nhanh như Messenger.</p>
            </div>
          ) : (
            <ChatBox
              key={selectedConversation.maNguoiKia}
              conversation={selectedConversation}
              embedded
              fullHeight
              onConversationDeleted={handleConversationDeleted}
              onConversationRefresh={() => setRefreshKey(value => value + 1)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
