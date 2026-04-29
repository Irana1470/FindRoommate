import React, { useState } from 'react';
import ChatBox from './ChatBox';
import './FloatingChat.css';

export default function FloatingChat({ maNguoiKia, tenNguoiKia }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="floating-chat">
      {open && (
        <div className="floating-chat-window">
          <ChatBox
            maNguoiKia={maNguoiKia}
            tenNguoiKia={tenNguoiKia}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
      <button className="floating-chat-btn" onClick={() => setOpen(!open)} title="Chat ngay">
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
