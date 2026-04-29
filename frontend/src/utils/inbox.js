export const getAvatarUrl = (name, avatar, size = 64) => (
  avatar
  || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=12355B&color=fff&size=${size}`
);

export const parseDateValue = value => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTimestamp = value => parseDateValue(value)?.getTime() || 0;

export const formatConversationTime = value => {
  const date = parseDateValue(value);
  if (!date) {
    return '';
  }

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  return date.toLocaleDateString('vi-VN');
};

export const sortByNewest = items => [...items].sort((a, b) => getTimestamp(b.thoiGian) - getTimestamp(a.thoiGian));
