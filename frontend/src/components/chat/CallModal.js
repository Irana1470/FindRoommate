import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CallModal.css';

const formatDuration = startedAt => {
  if (!startedAt) {
    return '00:00';
  }

  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export default function CallModal({
  open,
  phase,
  callType,
  localStream,
  remoteStream,
  remoteUserName,
  remoteUserAvatar,
  startedAt,
  muted,
  cameraOff,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
}) {
  const modalRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [timerText, setTimerText] = useState('00:00');

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!open || phase !== 'active') {
      setTimerText('00:00');
      return undefined;
    }

    const tick = () => setTimerText(formatDuration(startedAt));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [open, phase, startedAt]);

  const statusText = useMemo(() => {
    if (phase === 'incoming') {
      return 'đang gọi cho bạn...';
    }
    if (phase === 'outgoing') {
      return 'đang đổ chuông...';
    }
    if (phase === 'active') {
      return timerText;
    }
    return 'đang kết nối...';
  }, [phase, timerText]);

  if (!open) {
    return null;
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await modalRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // ignore fullscreen permission issues
    }
  };

  return (
    <div className="call-overlay">
      <div ref={modalRef} className={`call-modal ${callType === 'video' ? 'video' : 'audio'}`}>
        <div className="call-hero">
          {callType === 'video' && remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="call-remote-video" />
          ) : (
            <div className="call-avatar-shell">
              <img src={remoteUserAvatar} alt={remoteUserName} className="call-avatar" />
            </div>
          )}

          <div className="call-info">
            <h3>{remoteUserName}</h3>
            <p>{statusText}</p>
          </div>

          {callType === 'video' && (
            <video ref={localVideoRef} autoPlay playsInline muted className={`call-local-video ${cameraOff ? 'hidden' : ''}`} />
          )}
        </div>

        <div className="call-controls">
          {phase === 'incoming' ? (
            <>
              <button type="button" className="call-btn accept" onClick={onAccept}>Nhận</button>
              <button type="button" className="call-btn reject" onClick={onReject}>Từ chối</button>
            </>
          ) : (
            <>
              <button type="button" className="call-btn neutral" onClick={onToggleMute}>
                {muted ? 'Bật mic' : 'Tắt mic'}
              </button>
              {callType === 'video' && (
                <>
                  <button type="button" className="call-btn neutral" onClick={onToggleCamera}>
                    {cameraOff ? 'Bật camera' : 'Tắt camera'}
                  </button>
                  <button type="button" className="call-btn neutral" onClick={onSwitchCamera}>Đổi camera</button>
                  <button type="button" className="call-btn neutral" onClick={toggleFullscreen}>Toàn màn hình</button>
                </>
              )}
              <button type="button" className="call-btn reject" onClick={onEnd}>Kết thúc</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
