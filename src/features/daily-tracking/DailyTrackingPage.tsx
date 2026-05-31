import { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import {
  getDailyMealOrders,
  getDailyMealOrdersByMealType,
  generateDailyMealOrders,
  updateDailyMealOrderStatus,
  markMealDelivered,
  markMealSkipped,
  assignDriverToOrder,
  calculateDailyMealSummary,
  calculateAreaWiseBreakdown,
} from '@/services/dailyMealOrderService';
import { getDriversByBusiness } from '@/services/deliveryService';
import type { DailyMealOrder, Driver } from '@/types';
import {
  Calendar, RefreshCw, ChefHat, Coffee, UtensilsCrossed,
  Moon, Truck, CheckCircle, XCircle, SkipForward, Search,
  Plus, Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const MEAL_TYPES = ['all', 'breakfast', 'lunch', 'dinner'] as const;
const STATUS_TABS = ['all', 'scheduled', 'preparing', 'out_for_delivery', 'delivered', 'skipped', 'paused', 'failed'] as const;

const mealIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <UtensilsCrossed className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  preparing: { label: 'Preparing', variant: 'warning' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  skipped: { label: 'Skipped', variant: 'neutral' },
  paused: { label: 'Paused', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  failed: { label: 'Failed', variant: 'danger' },
};

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn('rounded-lg p-3', color)}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyTrackingPage() {
  const { business } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [orders, setOrders] = useState<DailyMealOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConfirm, setShowConfirm] = useState(false);

  const businessId = business?.id;

  const fetchOrders = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await getDailyMealOrdersByMealType(businessId, date, mealType);
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [businessId, date, mealType]);

  const fetchDrivers = useCallback(async () => {
    if (!businessId) return;
    try {
      const data = await getDriversByBusiness(businessId);
      setDrivers(data);
    } catch (err) {
      console.error(err);
    }
  }, [businessId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  async function handleGenerate() {
    if (!businessId) return;
    setShowConfirm(false);
    setGenerating(true);
    try {
      const result = await generateDailyMealOrders(businessId, date);
      toast.success(`Created ${result.created} orders (${result.skipped} skipped, ${result.paused} paused)`);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate orders');
    } finally {
      setGenerating(false);
    }
  }

  async function handleStatusUpdate(orderId: string, status: DailyMealOrder['status']) {
    try {
      await updateDailyMealOrderStatus(orderId, status);
      toast.success(`Order marked as ${statusConfig[status]?.label || status}`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  }

  async function handleDriverAssign(orderId: string, driverId: string) {
    try {
      await assignDriverToOrder(orderId, driverId);
      toast.success('Driver assigned');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, driverId } : o)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign driver');
    }
  }

  const filtered = orders.filter((o) => {
    if (search) {
      const q = search.toLowerCase();
      if (!o.customerName.toLowerCase().includes(q) && !o.customerCode.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const summary = calculateDailyMealSummary(orders);
  const isToday = date === todayStr();

  return (
    <PageContainer
      title="Daily Tracking"
      description={isToday ? "Today's meal preparations and deliveries" : `Tracking for ${date}`}
      actions={
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('tracking-date-input') as HTMLInputElement | null;
              if (el) {
                if (el.showPicker) el.showPicker();
                else el.click();
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            {date}
          </button>
          <input
            id="tracking-date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="hidden"
          />
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} loading={generating} onClick={() => setShowConfirm(true)}>
            Generate
          </Button>
          <Button variant="ghost" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchOrders}>
            Refresh
          </Button>
        </div>
      }
    >
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Generate Orders">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            This will generate daily meal orders for <strong>{date}</strong> based on active subscriptions. Orders for customers with approved skips or pauses will be marked accordingly.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleGenerate}>Confirm & Generate</Button>
          </div>
        </div>
      </Modal>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard label="Total" value={summary.total} icon={<ChefHat className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
        <SummaryCard label="Breakfast" value={summary.breakfast} icon={<Coffee className="h-5 w-5 text-orange-600" />} color="bg-orange-50" />
        <SummaryCard label="Lunch" value={summary.lunch} icon={<UtensilsCrossed className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
        <SummaryCard label="Dinner" value={summary.dinner} icon={<Moon className="h-5 w-5 text-indigo-600" />} color="bg-indigo-50" />
        <SummaryCard label="Out for Delivery" value={summary.outForDelivery} icon={<Truck className="h-5 w-5 text-cyan-600" />} color="bg-cyan-50" />
        <SummaryCard label="Delivered" value={summary.delivered} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
        <SummaryCard label="Skipped" value={summary.skipped} icon={<SkipForward className="h-5 w-5 text-gray-600" />} color="bg-gray-100" />
        <SummaryCard label="Paused" value={summary.paused} icon={<Clock className="h-5 w-5 text-amber-600" />} color="bg-amber-50" />
        <SummaryCard label="Failed" value={summary.failed} icon={<XCircle className="h-5 w-5 text-red-600" />} color="bg-red-50" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                mealType === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type !== 'all' && mealIcons[type]}
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Input
            search
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label || status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Search className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium text-gray-600">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">
                {orders.length === 0
                  ? 'No meal orders for this date. Click Generate to create them.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status] || { label: order.status, variant: 'default' as const };
            return (
              <Card key={order.id} hover>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-gray-100 p-2.5 text-gray-500">
                        {mealIcons[order.mealType] || <ChefHat className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{order.customerName}</p>
                          <span className="text-xs text-gray-400">#{order.customerCode}</span>
                        </div>
                        <p className="text-sm text-gray-500">{order.customerPhone}</p>
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-400 text-xs">Meal Type</span>
                      <p className="capitalize text-gray-700">{order.mealType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Area</span>
                      <p className="text-gray-700">{order.deliveryAreaName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Payment</span>
                      <Badge
                        variant={
                          order.paymentStatusSnapshot === 'paid' ? 'success'
                          : order.paymentStatusSnapshot === 'overdue' ? 'danger'
                          : 'warning'
                        }
                        size="sm"
                      >
                        {order.paymentStatusSnapshot}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Driver</span>
                      <select
                        value={order.driverId || ''}
                        onChange={(e) => handleDriverAssign(order.id, e.target.value)}
                        className="block w-full mt-0.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Unassigned</option>
                        {drivers.filter((d) => d.isActive).map((d) => (
                          <option key={d.id} value={d.id}>{d.driverName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                    {order.status === 'scheduled' && (
                      <>
                        <Button size="sm" variant="outline" icon={<ChefHat className="h-3.5 w-3.5" />} onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                          Preparing
                        </Button>
                        <Button size="sm" variant="ghost" icon={<SkipForward className="h-3.5 w-3.5" />} onClick={() => handleStatusUpdate(order.id, 'skipped')}>
                          Skip
                        </Button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <>
                        <Button size="sm" variant="outline" icon={<Truck className="h-3.5 w-3.5" />} onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}>
                          Out for Delivery
                        </Button>
                        <Button size="sm" variant="ghost" icon={<SkipForward className="h-3.5 w-3.5" />} onClick={() => handleStatusUpdate(order.id, 'skipped')}>
                          Skip
                        </Button>
                      </>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <>
                        <Button size="sm" variant="primary" icon={<CheckCircle className="h-3.5 w-3.5" />} onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                          Delivered
                        </Button>
                        <Button size="sm" variant="ghost" icon={<SkipForward className="h-3.5 w-3.5" />} onClick={() => handleStatusUpdate(order.id, 'skipped')}>
                          Skip
                        </Button>
                      </>
                    )}
                    {(order.status === 'delivered' || order.status === 'skipped' || order.status === 'failed') && (
                      <span className="text-xs text-gray-400 italic py-1.5 px-1">No further actions</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
