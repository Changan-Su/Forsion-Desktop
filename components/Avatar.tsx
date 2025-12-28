import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import type { User } from '../types/shared';
import AvatarService from '../services/avatarService';

interface AvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '',
  showBadge = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = AvatarService.getAvatarUrl(user);
  const initials = AvatarService.getUserInitials(user);

  // 如果是默认头像（DiceBear API）或图片加载失败，显示SVG
  const isDefaultAvatar = avatarUrl.includes('dicebear.com') || imageError;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {isDefaultAvatar ? (
        // 显示默认头像或首字母
        <div className="w-full h-full rounded-2xl bg-accent flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
          {avatarUrl.includes('dicebear.com') ? (
            <img 
              src={avatarUrl} 
              alt={user?.username || 'User'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      ) : (
        // 显示用户上传的头像
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg bg-white/10">
          <img
            src={avatarUrl}
            alt={user?.username || 'User'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* 在线状态徽章（可选） */}
      {showBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

export default Avatar;



