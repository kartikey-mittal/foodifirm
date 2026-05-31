import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Calendar,
  UtensilsCrossed,
  Package,
  Truck,
  MapPin,
  Layers,
  UserCog,
  Bell,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChefHat,
  FlaskConical,
} from 'lucide-react';
import { useState } from 'react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/dashboard' },
  { label: 'Daily Tracking', icon: <ClipboardList className="h-5 w-5" />, path: '/daily-tracking' },
  { label: 'Customers', icon: <Users className="h-5 w-5" />, path: '/customers' },
  { label: 'Customer Requests', icon: <ClipboardList className="h-5 w-5" />, path: '/customer-requests' },
  { label: 'Weekly Menu', icon: <Calendar className="h-5 w-5" />, path: '/weekly-menu' },
  { label: 'Items', icon: <UtensilsCrossed className="h-5 w-5" />, path: '/items' },
  { label: 'Inventory', icon: <Package className="h-5 w-5" />, path: '/inventory' },
  {
    label: 'Delivery',
    icon: <Truck className="h-5 w-5" />,
    children: [
      { label: 'Areas', path: '/delivery/areas' },
      { label: 'Batches', path: '/delivery/batches' },
      { label: 'Drivers', path: '/delivery/drivers' },
    ],
  },
  { label: 'Subscriptions', icon: <CreditCard className="h-5 w-5" />, path: '/subscriptions' },
  { label: 'Payments & Invoices', icon: <FileText className="h-5 w-5" />, path: '/payments' },
  { label: 'Staff', icon: <UserCog className="h-5 w-5" />, path: '/staff' },
  { label: 'Notifications', icon: <Bell className="h-5 w-5" />, path: '/notifications' },
  { label: 'Reports & Analytics', icon: <BarChart3 className="h-5 w-5" />, path: '/reports' },
  { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
  { label: 'Data Tools', icon: <FlaskConical className="h-5 w-5" />, path: '/data-tools' },
];

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Delivery']);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white ${mobile ? '' : 'hidden lg:block'}`}>
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">TiffinFlow</h1>
          <p className="text-xs text-gray-500">Smart Tiffin Management</p>
        </div>
      </div>

      <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          if (item.children) {
            const isExpanded = expandedMenus.includes(item.label);
            const hasActiveChild = item.children.some((child) => location.pathname === child.path);
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    hasActiveChild
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-4">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                          )
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
