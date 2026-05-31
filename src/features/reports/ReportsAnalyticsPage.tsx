import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getCustomersByBusiness } from '@/services/customerService';
import { getSubscriptionsByBusiness } from '@/services/subscriptionService';
import { getInvoicesByBusiness } from '@/services/invoiceService';
import { getDriversByBusiness, getDeliveryAreas } from '@/services/deliveryService';
import { getDailyMealOrders } from '@/services/dailyMealOrderService';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import {
  IndianRupee, Users, ClipboardList, Truck, Utensils,
  TrendingUp, AlertCircle, BarChart3,
} from 'lucide-react';

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

type DateRange = { from: string; to: string };

export function ReportsAnalyticsPage() {
  const { business } = useAuth();
  const businessId = business?.id;

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const [dateRange, setDateRange] = useState<DateRange>({ from: thirtyDaysAgo, to: today });

  const [customers, setCustomers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [mealOrders, setMealOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    Promise.all([
      getCustomersByBusiness(businessId),
      getSubscriptionsByBusiness(businessId),
      getInvoicesByBusiness(businessId),
      getDriversByBusiness(businessId),
      getDeliveryAreas(businessId),
      getDailyMealOrders(businessId, new Date().toISOString().split('T')[0]),
    ]).then(([c, s, i, d, a, m]) => {
      setCustomers(c);
      setSubscriptions(s);
      setInvoices(i);
      setDrivers(d);
      setDeliveryAreas(a);
      setMealOrders(m);
    }).finally(() => setLoading(false));
  }, [businessId]);

  const filteredInvoices = useMemo(() => {
    const from = dateRange.from ? new Date(dateRange.from) : new Date(0);
    const to = dateRange.to ? new Date(dateRange.to + 'T23:59:59') : new Date();
    return invoices.filter((inv) => {
      const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
      return d >= from && d <= to;
    });
  }, [invoices, dateRange]);

  const revenueAnalytics = useMemo(() => {
    let paid = 0, pending = 0, overdue = 0;
    let paidAmt = 0, pendingAmt = 0, overdueAmt = 0;
    filteredInvoices.forEach((inv) => {
      const amt = inv.paidAmount || inv.amount || 0;
      if (inv.status === 'paid') { paid++; paidAmt += amt; }
      else if (inv.status === 'overdue') { overdue++; overdueAmt += amt; }
      else { pending++; pendingAmt += amt; }
    });
    const total = paidAmt + pendingAmt + overdueAmt;

    const monthlyMap: Record<string, number> = {};
    filteredInvoices.forEach((inv) => {
      const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (inv.paidAmount || inv.amount || 0);
    });
    const monthlyRevenue = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    return { total, paidAmt, pendingAmt, overdueAmt, paid, pending, overdue, monthlyRevenue };
  }, [filteredInvoices]);

  const customerAnalytics = useMemo(() => {
    let active = 0, paused = 0, inactive = 0, pendingApproval = 0;
    customers.forEach((c) => {
      const status = c.status?.toLowerCase();
      if (status === 'active') active++;
      else if (status === 'paused') paused++;
      else if (status === 'inactive') inactive++;
      else pendingApproval++;
    });
    const now = new Date();
    const newThisMonth = customers.filter((c) => {
      const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const pieData = [
      { name: 'Active', value: active, color: '#10B981' },
      { name: 'Paused', value: paused, color: '#F59E0B' },
      { name: 'Inactive', value: inactive, color: '#EF4444' },
      { name: 'Pending', value: pendingApproval, color: '#6B7280' },
    ].filter((d) => d.value > 0);

    return { active, paused, inactive, pendingApproval, newThisMonth, pieData };
  }, [customers]);

  const subscriptionAnalytics = useMemo(() => {
    let active = 0, expired = 0, paused = 0, cancelled = 0;
    const planCount: Record<string, number> = {};
    subscriptions.forEach((s) => {
      const status = s.status?.toLowerCase();
      if (status === 'active') active++;
      else if (status === 'expired') expired++;
      else if (status === 'paused') paused++;
      else cancelled++;
      const plan = s.mealPlanName || s.planName || 'Unknown';
      planCount[plan] = (planCount[plan] || 0) + 1;
    });
    const mostPopular = Object.entries(planCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const planData = Object.entries(planCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

    return { active, expired, paused, cancelled, mostPopular, planData };
  }, [subscriptions]);

  const deliveryAnalytics = useMemo(() => {
    const todayStr = today;
    const todayOrders = mealOrders.filter((o) => {
      const d = o.date?.toDate ? o.date.toDate() : new Date(o.date);
      return d.toISOString().slice(0, 10) === todayStr;
    });
    const total = todayOrders.length;
    let delivered = 0, failed = 0, pending = 0;
    todayOrders.forEach((o) => {
      const s = o.status?.toLowerCase();
      if (s === 'delivered') delivered++;
      else if (s === 'failed') failed++;
      else pending++;
    });

    const driverMap: Record<string, number> = {};
    todayOrders.forEach((o) => {
      const name = o.driverName || o.driver || 'Unassigned';
      driverMap[name] = (driverMap[name] || 0) + 1;
    });
    const driverData = Object.entries(driverMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

    const areaMap: Record<string, number> = {};
    todayOrders.forEach((o) => {
      const area = o.area || o.areaName || 'Unknown';
      areaMap[area] = (areaMap[area] || 0) + 1;
    });
    const areaData = Object.entries(areaMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    return { total, delivered, failed, pending, driverData, areaData };
  }, [mealOrders, today]);

  const mealAnalytics = useMemo(() => {
    const todayStr = today;
    const todayMeals = mealOrders.filter((o) => {
      const d = o.date?.toDate ? o.date.toDate() : new Date(o.date);
      return d.toISOString().slice(0, 10) === todayStr;
    });
    let breakfast = 0, lunch = 0, dinner = 0;
    todayMeals.forEach((o) => {
      const t = o.mealType?.toLowerCase() || o.type?.toLowerCase();
      if (t === 'breakfast') breakfast++;
      else if (t === 'lunch') lunch++;
      else if (t === 'dinner') dinner++;
    });
    const pieData = [
      { name: 'Breakfast', value: breakfast, color: '#F59E0B' },
      { name: 'Lunch', value: lunch, color: '#10B981' },
      { name: 'Dinner', value: dinner, color: '#3B82F6' },
    ].filter((d) => d.value > 0);
    return { breakfast, lunch, dinner, pieData };
  }, [mealOrders, today]);

  if (loading) {
    return (
      <PageContainer title="Reports & Analytics" description="Loading your analytics...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Reports & Analytics" description="View detailed reports, trends, and insights about your business.">
      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <Button
          variant="outline"
          className="mt-auto"
          onClick={() => setDateRange({ from: thirtyDaysAgo, to: today })}
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* A. Revenue Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Revenue Analytics</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              {formatCurrency(revenueAnalytics.total)}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Paid</div>
                <div className="text-sm font-semibold text-emerald-700">{formatCurrency(revenueAnalytics.paidAmt)}</div>
                <Badge variant="success" className="mt-1">{revenueAnalytics.paid} inv.</Badge>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Pending</div>
                <div className="text-sm font-semibold text-amber-700">{formatCurrency(revenueAnalytics.pendingAmt)}</div>
                <Badge variant="warning" className="mt-1">{revenueAnalytics.pending} inv.</Badge>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Overdue</div>
                <div className="text-sm font-semibold text-red-700">{formatCurrency(revenueAnalytics.overdueAmt)}</div>
                <Badge variant="danger" className="mt-1">{revenueAnalytics.overdue} inv.</Badge>
              </div>
            </div>

            {revenueAnalytics.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueAnalytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">No revenue data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* B. Customer Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Customer Analytics</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-emerald-700">{customerAnalytics.active}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-amber-700">{customerAnalytics.paused}</div>
                <div className="text-xs text-gray-500">Paused</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-red-700">{customerAnalytics.inactive}</div>
                <div className="text-xs text-gray-500">Inactive</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-700">{customerAnalytics.pendingApproval}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <TrendingUp className="inline h-4 w-4 mr-1 text-emerald-600" />
              <span className="font-medium">{customerAnalytics.newThisMonth}</span> new customers this month
            </div>

            {customerAnalytics.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customerAnalytics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {customerAnalytics.pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">No customer data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* C. Subscription Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Subscription Analytics</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-emerald-700">{subscriptionAnalytics.active}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-red-700">{subscriptionAnalytics.expired}</div>
                <div className="text-xs text-gray-500">Expired</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-amber-700">{subscriptionAnalytics.paused}</div>
                <div className="text-xs text-gray-500">Paused</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-700">{subscriptionAnalytics.cancelled}</div>
                <div className="text-xs text-gray-500">Cancelled</div>
              </div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Most popular plan:</span>{' '}
              <Badge variant="info">{subscriptionAnalytics.mostPopular}</Badge>
            </div>

            {subscriptionAnalytics.planData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subscriptionAnalytics.planData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {subscriptionAnalytics.planData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">No subscription data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* D. Delivery Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Delivery Analytics</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {deliveryAnalytics.total} <span className="text-sm font-normal text-gray-500">deliveries today</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-700">{deliveryAnalytics.delivered}</div>
                <div className="text-xs text-gray-500">Delivered</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-700">{deliveryAnalytics.failed}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-700">{deliveryAnalytics.pending}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-700 mb-2">Driver Completion</h4>
            {deliveryAnalytics.driverData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={deliveryAnalytics.driverData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {deliveryAnalytics.driverData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No driver data for today</p>
            )}

            <h4 className="text-sm font-semibold text-gray-700 mb-2">Area-wise Delivery</h4>
            {deliveryAnalytics.areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={deliveryAnalytics.areaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400">No area data for today</p>
            )}
          </CardContent>
        </Card>

        {/* E. Meal Analytics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-pink-600" />
              <h3 className="text-lg font-semibold">Meal Analytics</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{mealAnalytics.breakfast}</div>
                <div className="text-sm text-gray-500">Breakfast</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">{mealAnalytics.lunch}</div>
                <div className="text-sm text-gray-500">Lunch</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{mealAnalytics.dinner}</div>
                <div className="text-sm text-gray-500">Dinner</div>
              </div>
            </div>

            {mealAnalytics.pieData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mealAnalytics.pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {mealAnalytics.pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">No meal orders for today</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </PageContainer>
  );
}
