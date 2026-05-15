import React, { useEffect, useRef, useState } from 'react';
import './ContentActionMenu.css';

const DotIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="12" r="1.9" fill="currentColor" />
    <circle cx="12" cy="12" r="1.9" fill="currentColor" />
    <circle cx="18" cy="12" r="1.9" fill="currentColor" />
  </svg>
);

export default function ContentActionMenu({ items, align = 'right', onOpenChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <div className="content-action-menu" ref={wrapRef}>
      <button
        type="button"
        className="content-action-trigger"
        onClick={event => {
          event.stopPropagation();
          setOpen(current => !current);
        }}
        aria-label="Mo menu thao tac"
      >
        <DotIcon />
      </button>

      {open && (
        <div
          className={`content-action-dropdown ${align === 'left' ? 'left' : 'right'}`}
          onClick={event => event.stopPropagation()}
        >
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              className={`content-action-item ${item.danger ? 'danger' : ''}`}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
