import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChatBox from '../components/chat/ChatBox';
import { chatAPI, nguoiDungAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { formatConversationTime, getAvatarUrl, sortByNewest } from '../utils/inbox';
import './TinNhan.css';

const buildAdHocConversation = profile => ({
  maNguoiKia: profile.maNguoiDung,
  tenNguoiKia: profile.hoTen,
  avatarNguoiKia: profile.avatar,
  tinNhanCuoi: 'Bắt đầu cuộc trò chuyện mới',
  thoiGian: null,
  laTinCuaToi: false,
  tamThoi: true,
});

export default function TinNhan() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const selectedId = searchParams.get('nguoiDung');

  useEffect(() => {
    let active = true;

    const loadConversations = async () => {
      try {
        const response = await chatAPI.layHoiThoai();
        if (!active) {
          return;
        }

        const data = sortByNewest(response.data.data || []);
        setConversations(current => {
          const selected = current.find(item => String(item.maNguoiKia) === selectedId && item.tamThoi);
          return selected && !data.some(item => item.maNguoiKia === selected.maNguoiKia)
            ? sortByNewest([selected, ...data])
            : data;
        });
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || 'Không tải được danh sách hội thoại');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadConversations();
    const timer = window.setInterval(loadConversations, 12000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedId]);

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

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return conversations;
    }

    return conversations.filter(item => item.tenNguoiKia?.toLowerCase().includes(keyword));
  }, [conversations, search]);

  const selectedConversation = conversations.find(item => String(item.maNguoiKia) === selectedId) || null;

  return (
    <div className="container page-wrapper">
      <div className="messages-shell">
        <aside className="messages-sidebar card">
          <div className="messages-sidebar-header">
            <div>
              <h1>Tin nhắn</h1>
              <p>Hiển thị toàn bộ cuộc trò chuyện theo kiểu hộp thư messenger.</p>
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
                    <img
                      src={getAvatarUrl(conversation.tenNguoiKia, conversation.avatarNguoiKia)}
                      alt={conversation.tenNguoiKia}
                      className="avatar avatar-md"
                    />
                    <div className="message-thread-body">
                      <div className="message-thread-top">
                        <strong>{conversation.tenNguoiKia}</strong>
                        <span>{formatConversationTime(conversation.thoiGian)}</span>
                      </div>
                      <div className="message-thread-preview">
                        {conversation.laTinCuaToi && !conversation.tamThoi ? 'Bạn: ' : ''}
                        {conversation.tinNhanCuoi || 'Chưa có tin nhắn'}
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
              <p>Danh sách hội thoại nằm bên trái để chuyển nhanh như messenger.</p>
            </div>
          ) : (
            <ChatBox
              maNguoiKia={selectedConversation.maNguoiKia}
              tenNguoiKia={selectedConversation.tenNguoiKia}
              avatarNguoiKia={selectedConversation.avatarNguoiKia}
              embedded
              fullHeight
            />
          )}
        </section>
      </div>
    </div>
  );
}
