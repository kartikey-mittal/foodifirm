import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { X } from 'lucide-react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl animate-in">
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold">
              T
            </div>
            <span className="text-lg font-bold text-gray-900">TiffinFlow</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar mobile />
      </div>
    </div>
  );
}
