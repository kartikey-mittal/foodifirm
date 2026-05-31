import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-gray-100 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
              activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
