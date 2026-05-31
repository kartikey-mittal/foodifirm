import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { Bell, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getUnreadAlertCount } from '@/services/notificationService';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { appUser, business, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (business?.id) {
      getUnreadAlertCount(business.id).then(setAlertCount).catch(() => {});
    }
  }, [business?.id]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl px-4 lg:px-8">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden sm:block flex-1 max-w-md">
        <Input search placeholder="Search customers, orders, meals..." />
      </div>

      <div className="flex-1 sm:flex-none" />

      <div className="hidden sm:block text-sm text-gray-500">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </div>

      <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
        <Bell className="h-5 w-5" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 pl-2 border-l border-gray-200 hover:bg-gray-50 rounded-lg pr-2 py-1 transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
              {business?.businessName || appUser?.fullName || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{appUser?.userType?.replace('_', ' ')}</p>
          </div>
          <Avatar name={appUser?.fullName} size="md" />
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', dropdownOpen && 'rotate-180')} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-50 animate-in">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{appUser?.fullName}</p>
              <p className="text-xs text-gray-500">{appUser?.email}</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => { setDropdownOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
