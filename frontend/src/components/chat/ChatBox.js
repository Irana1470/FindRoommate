import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { chatAPI } from '../../services/api';
import chatRealtime from '../../services/chatRealtime';
import useAuthStore from '../../store/authStore';
import { emitConversationRead, formatConversationTime, getAvatarUrl } from '../../utils/inbox';
import CallModal from './CallModal';
import './ChatBox.css';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '🥰', '🤝'];

const formatMessageClock = value => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const hasReceipt = (collection, userId) => Array.isArray(collection)
  ? collection.includes(userId)
  : collection instanceof Set
    ? collection.has(userId)
    : false;

const getStatusLabel = (message, isMine) => {
  if (!isMine) {
    return '';
  }

  const receiverId = Number(message.maNguoiNhan);
  if (hasReceipt(message.seenBy, receiverId) || message.trangThai === 'SEEN') {
    return 'Seen';
  }

  if (hasReceipt(message.deliveredTo, receiverId) || message.trangThai === 'DELIVERED') {
    return '✓✓ Delivered';
  }

  return '✓ Sent';
};

const buildPeerConnection = (iceServers, onIceCandidate, onTrack) => {
  const peerConnection = new RTCPeerConnection({ iceServers });
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };
  peerConnection.ontrack = event => {
    onTrack(event.streams[0]);
  };
  return peerConnection;
};

const MessageItem = memo(function MessageItem({
  message,
  isMine,
  onReply,
  onEdit,
  onRecall,
  onDelete,
  onReact,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactions = Object.values(message.reactions || {});
  const reactionSummary = [...new Set(reactions)];
  const statusLabel = getStatusLabel(message, isMine);

  return (
    <div
      className={`message-row ${isMine ? 'mine' : 'theirs'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      <div className="message-stack">
        {showReactionPicker && (
          <div className={`reaction-picker-inline ${isMine ? 'mine' : 'theirs'}`}>
            {EMOJI_OPTIONS.map(emoji => (
              <button key={emoji} type="button" className="emoji-option" onClick={() => onReact(message, emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        {message.replyTo && (
          <div className="message-reply-preview">
            <strong>{message.replyTo.tenNguoiGui}</strong>
            <span>{message.replyTo.noiDung}</span>
          </div>
        )}

        <div className={`message-bubble ${message.loaiTinNhan === 'IMAGE' ? 'media' : ''} ${message.recalled ? 'recalled' : ''}`}>
          {message.loaiTinNhan === 'IMAGE' && message.tepUrl && (
            <a href={message.tepUrl} target="_blank" rel="noreferrer" className="message-image-link">
              <img src={message.tepUrl} alt={message.tepTenGoc || 'attachment'} loading="lazy" className="message-image" />
            </a>
          )}

          {message.loaiTinNhan === 'FILE' && message.tepUrl && (
            <a href={message.tepUrl} target="_blank" rel="noreferrer" className="message-file-card">
              <span className="message-file-icon">📎</span>
              <span>
                <strong>{message.tepTenGoc || 'Tệp đính kèm'}</strong>
                <small>{message.tepMimeType || 'File'}</small>
              </span>
            </a>
          )}

          {message.noiDung && <div className="message-text">{message.noiDung}</div>}
          {message.edited && !message.recalled && <div className="message-edited">(đã chỉnh sửa)</div>}
        </div>

        {!!reactionSummary.length && (
          <div className="message-reactions">
            {reactionSummary.map(emoji => (
              <span key={`${message.maTinNhan}-${emoji}`} className="reaction-chip">{emoji}</span>
            ))}
          </div>
        )}

        <div className="message-meta">
          <span>{formatMessageClock(message.thoiGian)}</span>
          {statusLabel && <span className="message-status">{statusLabel}</span>}
        </div>
      </div>

      {showActions && !message.recalled && (
        <div className="message-actions">
          <button type="button" className="icon-btn" onClick={() => setShowReactionPicker(value => !value)}>🙂</button>
          <button type="button" className="icon-btn" onClick={() => onReply(message)}>↩</button>
          {isMine && <button type="button" className="icon-btn" onClick={() => onEdit(message)}>✎</button>}
          {isMine && <button type="button" className="icon-btn" onClick={() => onRecall(message)}>↺</button>}
          {isMine && <button type="button" className="icon-btn" onClick={() => onDelete(message)}>🗑</button>}
        </div>
      )}

    </div>
  );
});

export default function ChatBox({
  maNguoiKia,
  tenNguoiKia,
  avatarNguoiKia,
  conversation,
  onConversationRefresh,
  onClose,
  onConversationDeleted,
  embedded = false,
  fullHeight = false,
}) {
  const { user } = useAuthStore();
  const partnerId = conversation?.maNguoiKia || maNguoiKia;
  const partnerName = conversation?.tenNguoiKia || tenNguoiKia;
  const partnerAvatar = getAvatarUrl(partnerName, conversation?.avatarNguoiKia || avatarNguoiKia, 64);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [fileDraft, setFileDraft] = useState(null);
  const [replyDraft, setReplyDraft] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState({
    online: conversation?.online || false,
    lastActive: conversation?.lastActive || null,
  });
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [iceServers, setIceServers] = useState([{ urls: ['stun:stun.l.google.com:19302'] }]);
  const [callState, setCallState] = useState({
    open: false,
    phase: 'idle',
    callId: null,
    callType: 'audio',
    remoteStream: null,
    localStream: null,
    peerConnection: null,
    incomingOffer: null,
    startedAt: null,
    muted: false,
    cameraOff: false,
    remoteUserName: partnerName,
    remoteUserAvatar: partnerAvatar,
  });

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);
  const deliveredRef = useRef(new Set());
  const seenRef = useRef(new Set());
  const conversationMenuRef = useRef(null);

  const loadMessages = async ({ before = null, append = false } = {}) => {
    if (!partnerId) {
      return;
    }

    const setLoading = append ? setLoadingMore : setLoadingHistory;
    setLoading(true);

    try {
      const response = await chatAPI.layLichSu(partnerId, { before, limit: 30 });
      const payload = response.data.data;
      const items = payload?.items || [];
      setMessages(current => append ? [...items, ...current] : items);
      setHasMore(Boolean(payload?.hasMore));
      setPartnerPresence(current => ({
        online: payload?.partner?.online ?? current.online,
        lastActive: payload?.partner?.lastActive ?? current.lastActive,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được lịch sử chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.maNguoiDung) {
      return undefined;
    }

    chatRealtime.connect();
    const unsubChat = chatRealtime.subscribe('chat', payload => {
      if (!partnerId) {
        return;
      }

      if (payload.event === 'typing' && Number(payload.userId) === Number(partnerId)) {
        setPartnerTyping(true);
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => setPartnerTyping(false), 2200);
        return;
      }

      if (payload.event === 'stop_typing' && Number(payload.userId) === Number(partnerId)) {
        setPartnerTyping(false);
        return;
      }

      const message = payload.message;
      if (!message) {
        return;
      }

      const belongsToConversation =
        (Number(message.maNguoiGui) === Number(partnerId) && Number(message.maNguoiNhan) === Number(user.maNguoiDung))
        || (Number(message.maNguoiGui) === Number(user.maNguoiDung) && Number(message.maNguoiNhan) === Number(partnerId));

      if (!belongsToConversation) {
        return;
      }

      setMessages(current => {
        const index = current.findIndex(item => item.maTinNhan === message.maTinNhan);
        if (index === -1) {
          return [...current, message];
        }

        const next = [...current];
        next[index] = { ...next[index], ...message };
        return next;
      });

      if (payload.event === 'receive_message' && Number(message.maNguoiNhan) === Number(user.maNguoiDung)) {
        if (!deliveredRef.current.has(message.maTinNhan)) {
          deliveredRef.current.add(message.maTinNhan);
          chatRealtime.publish('/app/chat.delivered', { messageId: message.maTinNhan });
        }
      }

      if (onConversationRefresh) {
        onConversationRefresh();
      }
    });

    const unsubPresence = chatRealtime.subscribe('presence', payload => {
      if (Number(payload.userId) === Number(partnerId)) {
        setPartnerPresence({
          online: Boolean(payload.online),
          lastActive: payload.lastActive || null,
        });
      }
    });

    const unsubCall = chatRealtime.subscribe('call', async payload => {
      if (Number(payload.fromUserId) !== Number(partnerId)) {
        return;
      }

      if (payload.event === 'incoming_call') {
        setCallState(current => ({
          ...current,
          open: true,
          phase: 'incoming',
          callId: payload.callId,
          callType: payload.callType || 'audio',
          incomingOffer: payload.payload?.offer || null,
          remoteUserName: payload.fromName || partnerName,
          remoteUserAvatar: payload.fromAvatar || partnerAvatar,
        }));
        return;
      }

      if (payload.event === 'accept_call' && callState.peerConnection && payload.payload?.answer) {
        await callState.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
        setCallState(current => ({ ...current, phase: 'active', startedAt: Date.now() }));
        return;
      }

      if (payload.event === 'ice_candidate' && callState.peerConnection && payload.payload?.candidate) {
        try {
          await callState.peerConnection.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
        } catch {
          // ignore transient ICE ordering issues
        }
        return;
      }

      if (payload.event === 'reject_call') {
        toast('Cuộc gọi đã bị từ chối');
        cleanupCall();
        return;
      }

      if (payload.event === 'end_call') {
        cleanupCall();
      }
    });

    return () => {
      unsubChat();
      unsubPresence();
      unsubCall();
      window.clearTimeout(typingTimeoutRef.current);
      window.clearTimeout(stopTypingTimeoutRef.current);
    };
  }, [partnerAvatar, partnerId, partnerName, user?.maNguoiDung, callState.peerConnection, onConversationRefresh]);

  useEffect(() => {
    let active = true;
    if (!partnerId) {
      setMessages([]);
      setLoadingHistory(false);
      return undefined;
    }

    loadMessages({ append: false });
    chatAPI.layWebRtcConfig()
      .then(response => {
        if (active) {
          setIceServers(response.data.data?.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }]);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      setReplyDraft(null);
      setEditingMessage(null);
      setFileDraft(null);
      setPartnerTyping(false);
    };
  }, [partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (conversationMenuRef.current && !conversationMenuRef.current.contains(event.target)) {
        setShowConversationMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const undeliveredIncoming = messages.filter(
      message => Number(message.maNguoiGui) === Number(partnerId)
        && Number(message.maNguoiNhan) === Number(user?.maNguoiDung)
        && !hasReceipt(message.deliveredTo, Number(user?.maNguoiDung))
    );

    undeliveredIncoming.forEach(message => {
      if (!deliveredRef.current.has(message.maTinNhan)) {
        deliveredRef.current.add(message.maTinNhan);
        chatRealtime.publish('/app/chat.delivered', { messageId: message.maTinNhan });
      }
    });
  }, [messages, onConversationRefresh, partnerId, user?.maNguoiDung]);

  useEffect(() => {
    const unseenIncoming = messages.filter(
      message => Number(message.maNguoiGui) === Number(partnerId)
        && Number(message.maNguoiNhan) === Number(user?.maNguoiDung)
        && !hasReceipt(message.seenBy, Number(user?.maNguoiDung))
    );

    unseenIncoming.forEach(message => {
      if (!seenRef.current.has(message.maTinNhan) && document.visibilityState === 'visible') {
        seenRef.current.add(message.maTinNhan);
        chatRealtime.publish('/app/chat.seen', { messageId: message.maTinNhan });
      }
    });

    if (unseenIncoming.length > 0) {
      emitConversationRead(partnerId);
      if (onConversationRefresh) {
        window.setTimeout(() => onConversationRefresh(), 250);
      }
    }
  }, [messages, partnerId, user?.maNguoiDung]);

  const groupedMessages = useMemo(() => messages.map((message, index) => ({
    ...message,
    showAvatar: index === messages.length - 1
      || Number(messages[index + 1]?.maNguoiGui) !== Number(message.maNguoiGui),
  })), [messages]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !messages.length) {
      return;
    }

    const oldest = messages[0];
    await loadMessages({ before: oldest.thoiGian, append: true });
  };

  const handleScroll = event => {
    if (event.currentTarget.scrollTop < 60) {
      handleLoadMore();
    }
  };

  const handleInputChange = event => {
    const value = event.target.value;
    setInput(value);

    if (!partnerId) {
      return;
    }

    chatRealtime.publish('/app/chat.typing', { maNguoiNhan: partnerId, dangNhap: true });
    window.clearTimeout(stopTypingTimeoutRef.current);
    stopTypingTimeoutRef.current = window.setTimeout(() => {
      chatRealtime.publish('/app/chat.typing', { maNguoiNhan: partnerId, dangNhap: false });
    }, 900);
  };

  const handleSend = async () => {
    if (sending || !partnerId || (!input.trim() && !fileDraft)) {
      return;
    }

    setSending(true);
    try {
      if (editingMessage) {
        const response = await chatAPI.suaTinNhan(editingMessage.maTinNhan, input.trim());
        setMessages(current => current.map(item => (
          item.maTinNhan === editingMessage.maTinNhan ? response.data.data : item
        )));
        setEditingMessage(null);
        setInput('');
      } else {
        let payload;
        if (fileDraft) {
          payload = new FormData();
          payload.append('maNguoiNhan', partnerId);
          if (input.trim()) {
            payload.append('noiDung', input.trim());
          }
          if (replyDraft?.maTinNhan) {
            payload.append('replyTo', replyDraft.maTinNhan);
          }
          payload.append('file', fileDraft);
        } else {
          payload = {
            maNguoiNhan: partnerId,
            noiDung: input.trim(),
            replyTo: replyDraft?.maTinNhan || null,
          };
        }

        const response = await chatAPI.guiTinNhan(payload);
        const message = response.data.data;
        setMessages(current => [...current, message]);
        if (onConversationRefresh) {
          onConversationRefresh();
        }
        setInput('');
        setReplyDraft(null);
        setFileDraft(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleReaction = async (message, emoji) => {
    const myReaction = message.reactions?.[String(user?.maNguoiDung)];
    const action = myReaction === emoji ? 'remove' : 'add';
    try {
      const response = await chatAPI.reactionTinNhan(message.maTinNhan, { emoji, action });
      setMessages(current => current.map(item => (
        item.maTinNhan === message.maTinNhan ? response.data.data : item
      )));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không cập nhật được reaction');
    }
  };

  const handleRecall = async message => {
    try {
      const response = await chatAPI.thuHoiTinNhan(message.maTinNhan);
      setMessages(current => current.map(item => (
        item.maTinNhan === message.maTinNhan ? response.data.data : item
      )));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thu hồi tin nhắn');
    }
  };

  const handleDelete = async message => {
    try {
      await chatAPI.xoaTinNhan(message.maTinNhan);
      setMessages(current => current.filter(item => item.maTinNhan !== message.maTinNhan));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tin nhắn');
    }
  };

  const handleDeleteConversation = async () => {
    if (!partnerId || !window.confirm(`Xóa cuộc trò chuyện với ${partnerName}? Bạn sẽ không còn thấy lịch sử hiện tại trong hộp thư của mình.`)) {
      return;
    }

    try {
      await chatAPI.xoaHoiThoai(partnerId);
      setMessages([]);
      setShowConversationMenu(false);
      onConversationDeleted?.(partnerId);
      onConversationRefresh?.();
      toast.success('Đã xóa cuộc trò chuyện khỏi hộp thư của bạn');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa cuộc trò chuyện');
    }
  };

  const handleReportConversation = async () => {
    if (!partnerId) {
      return;
    }

    const lyDo = window.prompt(`Nhập lý do báo cáo cuộc trò chuyện với ${partnerName}`);
    if (lyDo === null) {
      return;
    }

    if (!lyDo.trim()) {
      toast.error('Vui lòng nhập lý do báo cáo');
      return;
    }

    const chiTiet = window.prompt('Thêm chi tiết nếu cần (có thể bỏ trống)') ?? '';

    try {
      await chatAPI.baoCaoHoiThoai(partnerId, { lyDo: lyDo.trim(), chiTiet: chiTiet.trim() });
      setShowConversationMenu(false);
      toast.success('Đã gửi báo cáo tới admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi báo cáo');
    }
  };

  const cleanupCall = () => {
    setCallState(current => {
      current.peerConnection?.close();
      current.localStream?.getTracks().forEach(track => track.stop());
      current.remoteStream?.getTracks?.().forEach(track => track.stop());
      return {
        ...current,
        open: false,
        phase: 'idle',
        callId: null,
        remoteStream: null,
        localStream: null,
        peerConnection: null,
        incomingOffer: null,
        startedAt: null,
      };
    });
  };

  const createLocalStream = async callType => {
    const constraints = {
      audio: true,
      video: callType === 'video',
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  };

  const startCall = async callType => {
    try {
      const localStream = await createLocalStream(callType);
      const callId = `${user?.maNguoiDung}-${partnerId}-${Date.now()}`;
      const peerConnection = buildPeerConnection(
        iceServers,
        candidate => chatRealtime.publish('/app/chat.call', {
          event: 'ice_candidate',
          callId,
          callType,
          toUserId: partnerId,
          payload: { candidate },
        }),
        remoteStream => setCallState(current => ({ ...current, remoteStream }))
      );

      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      setCallState(current => ({
        ...current,
        open: true,
        phase: 'outgoing',
        callId,
        callType,
        localStream,
        peerConnection,
        remoteUserName: partnerName,
        remoteUserAvatar: partnerAvatar,
      }));

      chatRealtime.publish('/app/chat.call', {
        event: 'incoming_call',
        callId,
        callType,
        toUserId: partnerId,
        payload: { offer },
      });
    } catch {
      toast.error('Không thể khởi tạo thiết bị gọi');
    }
  };

  const acceptCall = async () => {
    try {
      const localStream = await createLocalStream(callState.callType);
      const peerConnection = buildPeerConnection(
        iceServers,
        candidate => chatRealtime.publish('/app/chat.call', {
          event: 'ice_candidate',
          callId: callState.callId,
          callType: callState.callType,
          toUserId: partnerId,
          payload: { candidate },
        }),
        remoteStream => setCallState(current => ({ ...current, remoteStream }))
      );

      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      await peerConnection.setRemoteDescription(new RTCSessionDescription(callState.incomingOffer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      setCallState(current => ({
        ...current,
        phase: 'active',
        localStream,
        peerConnection,
        startedAt: Date.now(),
      }));

      chatRealtime.publish('/app/chat.call', {
        event: 'accept_call',
        callId: callState.callId,
        callType: callState.callType,
        toUserId: partnerId,
        payload: { answer },
      });
    } catch {
      toast.error('Không thể nhận cuộc gọi');
      cleanupCall();
    }
  };

  const rejectCall = () => {
    chatRealtime.publish('/app/chat.call', {
      event: 'reject_call',
      callId: callState.callId,
      callType: callState.callType,
      toUserId: partnerId,
      payload: {},
    });
    cleanupCall();
  };

  const endCall = () => {
    if (callState.callId) {
      chatRealtime.publish('/app/chat.call', {
        event: 'end_call',
        callId: callState.callId,
        callType: callState.callType,
        toUserId: partnerId,
        payload: {},
      });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    setCallState(current => {
      current.localStream?.getAudioTracks().forEach(track => {
        track.enabled = current.muted;
      });
      return { ...current, muted: !current.muted };
    });
  };

  const toggleCamera = () => {
    setCallState(current => {
      current.localStream?.getVideoTracks().forEach(track => {
        track.enabled = current.cameraOff;
      });
      return { ...current, cameraOff: !current.cameraOff };
    });
  };

  const switchCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      if (videoDevices.length < 2 || !callState.localStream || !callState.peerConnection) {
        toast('Không có camera khác để chuyển');
        return;
      }

      const currentDeviceId = callState.localStream.getVideoTracks?.()[0]?.getSettings?.().deviceId;
      const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
      const nextDevice = videoDevices[(currentIndex + 1) % videoDevices.length];
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
      });

      const nextTrack = nextStream.getVideoTracks()[0];
      const currentTrack = callState.localStream.getVideoTracks()[0];
      const sender = callState.peerConnection.getSenders().find(item => item.track?.kind === 'video');

      if (sender && nextTrack) {
        await sender.replaceTrack(nextTrack);
      }

      if (currentTrack) {
        callState.localStream.removeTrack(currentTrack);
        currentTrack.stop();
      }

      if (nextTrack) {
        callState.localStream.addTrack(nextTrack);
      }

      setCallState(current => ({ ...current, localStream: callState.localStream }));
    } catch {
      toast.error('Không thể chuyển camera');
    }
  };

  const handleReply = message => {
    setReplyDraft(message);
    setEditingMessage(null);
  };

  const handleEdit = message => {
    setEditingMessage(message);
    setReplyDraft(null);
    setInput(message.noiDung || '');
  };

  const composerTitle = editingMessage
    ? 'Chỉnh sửa tin nhắn'
    : replyDraft
      ? `Đang trả lời ${replyDraft.tenNguoiGui || (Number(replyDraft.maNguoiGui) === Number(user?.maNguoiDung) ? 'bạn' : partnerName)}`
      : '';

  return (
    <div className={`chatbox ${embedded ? 'embedded' : ''} ${fullHeight ? 'full-height' : ''}`}>
      <div className="chatbox-header">
        <div className="chatbox-user">
          <div className="avatar-wrap">
            <img src={partnerAvatar} className="avatar avatar-md" alt={partnerName} />
            <span className={`presence-dot ${partnerPresence.online ? 'online' : 'offline'}`} />
          </div>
          <div>
            <div className="chatbox-title">{partnerName}</div>
            <div className={`chatbox-status ${partnerPresence.online ? 'online' : 'offline'}`}>
              {partnerTyping
                ? `${partnerName} đang nhập...`
                : partnerPresence.online
                  ? 'Đang hoạt động'
                  : partnerPresence.lastActive
                    ? `Hoạt động ${formatConversationTime(partnerPresence.lastActive)}`
                    : 'Offline'}
            </div>
          </div>
        </div>

        <div className="chatbox-header-actions">
          <button type="button" className="chatbox-call-btn phone" onClick={() => startCall('audio')} aria-label="Gọi thoại">
            <svg viewBox="0 0 48 48" className="chatbox-action-icon" aria-hidden="true">
              <defs>
                <linearGradient id="headerPhoneGradient" x1="8" y1="6" x2="38" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#3fc3ff" />
                  <stop offset="1" stopColor="#1584d8" />
                </linearGradient>
              </defs>
              <path
                d="M15.4 8.8c2.4-1.6 5.4-.6 6.4 2.2l1.6 4.2c.6 1.6.2 3.4-1 4.5l-2.4 2.2c2.3 4.2 5.8 7.7 10 10l2.2-2.4c1.1-1.2 2.9-1.6 4.5-1l4.2 1.6c2.8 1 3.8 4 2.2 6.4l-1.5 2.3c-1.4 2.1-3.9 3.1-6.3 2.5C22.1 38 10 25.9 6.6 12.6c-.6-2.4.4-4.9 2.5-6.3l2.3-1.5Z"
                fill="url(#headerPhoneGradient)"
              />
              <path
                d="M18.8 13.1c.5-1.1 2.1-1.1 2.6 0l1.2 3.1c.3.8.1 1.7-.5 2.3l-1.7 1.5c-.6.5-.7 1.4-.2 2.1 1.8 2.5 4 4.7 6.5 6.5.7.5 1.6.4 2.1-.2l1.5-1.7c.6-.6 1.5-.8 2.3-.5l3.1 1.2c1.1.5 1.1 2.1 0 2.6l-1.4.6c-1.4.7-3.1.7-4.5.1-5.9-2.7-10.6-7.4-13.3-13.3-.6-1.4-.6-3.1.1-4.5l.6-1.4Z"
                fill="rgba(255,255,255,0.24)"
              />
            </svg>
          </button>
          <button type="button" className="chatbox-call-btn video" onClick={() => startCall('video')} aria-label="Gọi video">
            <svg viewBox="0 0 48 48" className="chatbox-action-icon" aria-hidden="true">
              <rect x="5" y="5" width="38" height="38" rx="14" fill="#ffffff" />
              <circle cx="24" cy="24" r="16" fill="#1877f2" />
              <rect x="15.5" y="18" width="14" height="12" rx="3.8" fill="#ffffff" />
              <path d="M30.5 21.2 35 17.5c1-.8 2.5-.1 2.5 1.2v10.6c0 1.3-1.5 2-2.5 1.2l-4.5-3.7v-5.6Z" fill="#ffffff" />
            </svg>
          </button>
          <div className="chatbox-menu-wrap" ref={conversationMenuRef}>
            <button
              type="button"
              className="chatbox-menu-btn"
              aria-label="Tùy chọn cuộc trò chuyện"
              onClick={() => setShowConversationMenu(value => !value)}
            >
              ⋯
            </button>

            {showConversationMenu && (
              <div className="chatbox-menu-dropdown">
                <button type="button" className="chatbox-menu-item" onClick={handleDeleteConversation}>Xóa cuộc trò chuyện</button>
                <button type="button" className="chatbox-menu-item danger" onClick={handleReportConversation}>Báo cáo cuộc trò chuyện</button>
              </div>
            )}
          </div>
          {onClose && <button type="button" className="chatbox-close" onClick={onClose}>✕</button>}
        </div>
      </div>

      <div className="chatbox-messages" onScroll={handleScroll}>
        {loadingMore && <div className="chatbox-inline-loader">Đang tải thêm tin nhắn...</div>}

        {loadingHistory ? (
          <div className="chatbox-empty">Đang tải lịch sử trò chuyện...</div>
        ) : groupedMessages.length === 0 ? (
          <div className="chatbox-empty">Bắt đầu cuộc trò chuyện với {partnerName}.</div>
        ) : (
          groupedMessages.map(message => {
            const isMine = Number(message.maNguoiGui) === Number(user?.maNguoiDung);
            return (
              <MessageItem
                key={message.maTinNhan}
                message={message}
                isMine={isMine}
                onReply={handleReply}
                onEdit={handleEdit}
                onRecall={handleRecall}
                onDelete={handleDelete}
                onReact={toggleReaction}
              />
            );
          })
        )}

        {partnerTyping && <div className="typing-indicator"><span /><span /><span /></div>}
        <div ref={bottomRef} />
      </div>

      <div className="chatbox-composer">
        {composerTitle && (
          <div className="composer-context">
            <div>
              <strong>{composerTitle}</strong>
              <span>{editingMessage ? editingMessage.noiDung : replyDraft?.noiDung}</span>
            </div>
            <button type="button" className="icon-btn" onClick={() => {
              setReplyDraft(null);
              setEditingMessage(null);
              setInput('');
            }}>
              ✕
            </button>
          </div>
        )}

        {fileDraft && (
          <div className="composer-attachment">
            <span>{fileDraft.name}</span>
            <button type="button" className="icon-btn" onClick={() => setFileDraft(null)}>✕</button>
          </div>
        )}

        <div className="chatbox-input">
          <div className="composer-tools">
            <button type="button" className="icon-btn large" onClick={() => setShowEmojiPicker(value => !value)}>😊</button>
            <label className="icon-btn large upload-btn" title="Tải ảnh hoặc file">
              📎
              <input
                type="file"
                hidden
                onChange={event => setFileDraft(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <textarea
            className="form-control"
            rows={2}
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          <button className="btn btn-primary send-btn" onClick={handleSend} disabled={sending || (!input.trim() && !fileDraft)}>
            {sending ? 'Đang gửi' : editingMessage ? 'Lưu' : 'Gửi'}
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker">
              {EMOJI_OPTIONS.map(emoji => (
                <button key={emoji} type="button" className="emoji-option" onClick={() => setInput(current => `${current}${emoji}`)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CallModal
        open={callState.open}
        phase={callState.phase}
        callType={callState.callType}
        localStream={callState.localStream}
        remoteStream={callState.remoteStream}
        remoteUserName={callState.remoteUserName}
        remoteUserAvatar={callState.remoteUserAvatar}
        startedAt={callState.startedAt}
        muted={callState.muted}
        cameraOff={callState.cameraOff}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onSwitchCamera={switchCamera}
      />
    </div>
  );
}
