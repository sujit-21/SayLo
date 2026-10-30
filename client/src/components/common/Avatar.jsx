import React from 'react';

const Avatar = ({ src, name = 'User', size = 'md', isOnline = false, className = '' }) => {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-2xl',
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-white/10`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center font-semibold border border-saylo-emerald/30`}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-saylo-lightgreen border-2 border-[#111b21] rounded-full ring-1 ring-white/20"></span>
      )}
    </div>
  );
};

export default Avatar;

