import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const getInitial = (name?: string) => {
    if (!name) return <User className="h-5 w-5" />;
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium',
        sizes[size],
        className
      )}
    >
      {getInitial(name)}
    </div>
  );
}
