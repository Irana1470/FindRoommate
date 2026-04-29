import React, { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import { chatAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import './ChatBox.css';

const appendUniqueMessage = (currentMessages, nextMessage) => {
  if (!nextMessage) {
    return currentMessages;
  }

  if (nextMessage.maTinNhan && currentMessages.some(message => message.maTinNhan === nextMessage.maTinNhan)) {
    return currentMessages;
  }

  return [...currentMessages, nextMessage];
};

export default function ChatBox({
  maNguoiKia,
  tenNguoiKia,
  avatarNguoiKia,
  onClose,
  embedded = false,
  fullHeight = false,
}) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.maNguoiDung || !maNguoiKia) {
      setMessages([]);
      setLoadingHistory(false);
      return undefined;
    }

    let active = true;
    setLoadingHistory(true);

    const loadHistory = async (showError = true, initial = false) => {
      try {
        const response = await chatAPI.layLichSu(maNguoiKia);
        if (active) {
          setMessages(response.data.data || []);
        }
      } catch (error) {
        if (active && showError) {
          toast.error(error.response?.data?.message || 'Khong tai duoc lich su chat');
        }
      } finally {
        if (active && initial) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory(true, true);
    const timer = window.setInterval(() => loadHistory(false, false), 4000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.maNguoiDung, maNguoiKia]);

  useEffect(() => {
    if (!user?.maNguoiDung || !maNguoiKia) {
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`/ws?token=${encodeURIComponent(token)}`),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/user/queue/messages', message => {
          const data = JSON.parse(message.body);
          const isCurrentConversation =
            data.maNguoiGui === maNguoiKia || data.maNguoiNhan === maNguoiKia;

          if (isCurrentConversation) {
            setMessages(currentMessages => appendUniqueMessage(currentMessages, data));
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);
      client.deactivate();
      clientRef.current = null;
    };
  }, [user?.maNguoiDung, maNguoiKia]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (sending || !input.trim()) {
      return;
    }

    setSending(true);
    chatAPI.guiTinNhan({
      maNguoiGui: user?.maNguoiDung,
      maNguoiNhan: maNguoiKia,
      noiDung: input.trim(),
    })
      .then(response => {
        setMessages(currentMessages => appendUniqueMessage(currentMessages, response.data.data));
        setInput('');
      })
      .catch(error => {
        toast.error(error.response?.data?.message || 'Gui tin nhan that bai');
      })
      .finally(() => {
        setSending(false);
      });
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const partnerAvatar = avatarNguoiKia
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenNguoiKia || 'U')}&background=12355B&color=fff&size=48`;

  return (
    <div className={`chatbox ${embedded ? 'embedded' : ''} ${fullHeight ? 'full-height' : ''}`}>
      <div className="chatbox-header">
        <div className="chatbox-user">
          <img src={partnerAvatar} className="avatar avatar-sm" alt={tenNguoiKia} />
          <div>
            <div className="chatbox-title">{tenNguoiKia}</div>
            <div className={`chatbox-status ${connected ? 'online' : 'offline'}`}>
              {connected ? 'Dang ket noi realtime' : 'Dang dong bo tin nhan tu dong'}
            </div>
          </div>
        </div>
        {onClose && <button className="chatbox-close" onClick={onClose}>x</button>}
      </div>

      <div className="chatbox-messages">
        {loadingHistory ? (
          <div className="chatbox-empty">Dang tai lich su tro chuyen...</div>
        ) : messages.length === 0 ? (
          <div className="chatbox-empty">Bat dau cuoc tro chuyen voi {tenNguoiKia}.</div>
        ) : (
          messages.map((message, index) => {
            const isMine = message.maNguoiGui === user?.maNguoiDung;
            return (
              <div key={message.maTinNhan || `${message.thoiGian || 'msg'}-${index}`} className={`message ${isMine ? 'mine' : 'theirs'}`}>
                <div className="message-bubble">{message.noiDung}</div>
                <div className="message-time">
                  {message.thoiGian
                    ? new Date(message.thoiGian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chatbox-input">
        <textarea
          className="form-control"
          rows={2}
          placeholder="Nhap tin nhan..."
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={sending || !input.trim()}>
          {sending ? 'Dang gui' : 'Gui'}
        </button>
      </div>
    </div>
  );
}
