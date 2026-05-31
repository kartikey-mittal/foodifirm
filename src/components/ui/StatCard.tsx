import { cn } from '@/lib/utils';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)} hover>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.positive ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{trend.value}% vs last week</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
