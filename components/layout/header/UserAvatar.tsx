import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth';

interface UserAvatarProps {
  user: AuthUser;
  size?: 'sm' | 'md' | 'lg';
  showLink?: boolean;
  onClick?: () => void;
  className?: string;
}

export function UserAvatar({
  user,
  size = 'md',
  showLink = true,
  onClick,
  className,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const avatarContent = (
    <div className="flex items-center gap-3">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ?? 'Avatar'}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className={`${sizeClasses[size]} rounded-full`}
        />
      ) : (
        <div
          className={`flex ${sizeClasses[size]} items-center justify-center rounded-full bg-muted`}
        >
          <span className={size === 'sm' ? 'text-xs' : 'text-sm font-medium'}>
            {user.name?.charAt(0) ?? user.email?.charAt(0)}
          </span>
        </div>
      )}
      {size !== 'sm' && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link
        href="/settings"
        onClick={onClick}
        className={cn('rounded-full p-1 ring-primary/20 transition-all hover:ring-2', className)}
      >
        {avatarContent}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={className}>
      {avatarContent}
    </div>
  );
}
