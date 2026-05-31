import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getBusinessStats, recalculateBusinessStats } from '@/services/statsService';
import { getCustomersByBusiness } from '@/services/customerService';
import { getSubscriptionsByBusiness } from '@/services/subscriptionService';
import { getInvoicesByBusiness } from '@/services/invoiceService';
import { getDailyMealOrders, generateDailyMealOrders, calculateDailyMealSummary } from '@/services/dailyMealOrderService';
import { getRequestsByBusiness } from '@/services/customerRequestService';
import { getStaffByBusiness } from '@/services/staffService';
import { getActivityLogsByBusiness } from '@/services/activityLogService';
import { updateCustomer } from '@/services/customerService';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { BusinessStats, BusinessStatsV2, Customer, DailyMealOrder, CustomerRequest, ActivityLog, DailyMealSummary } from '@/types';
import {
  IndianRupee, Users, UtensilsCrossed, AlertTriangle, Clock, Loader2,
  RefreshCw, CheckCircle, XCircle, ArrowRight, CalendarDays, UserCheck,
  PlusCircle, FileText, Bell, Package, Activity, ChefHat,
} from 'lucide-react';

export function DashboardPage() {
  const { business } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<BusinessStatsV2 | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [todayOrders, setTodayOrders] = useState<DailyMealOrder[]>([]);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [s, cust, orders, reqs, logs] = await Promise.all([
        getBusinessStats(business.id),
        getCustomersByBusiness(business.id),
        getDailyMealOrders(business.id, today),
        getRequestsByBusiness(business.id),
        getActivityLogsByBusiness(business.id),
      ]);
      if (s) setStats(s);
      setCustomers(cust);
      setTodayOrders(orders);
      setRequests(reqs);
      setActivityLogs(logs);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const summary = calculateDailyMealSummary(todayOrders);
  const pendingApprovals = customers.filter((c) => c.status === 'pending_approval');
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const handleGenerateOrders = async () => {
    if (!business?.id) return;
    setGenerating(true);
    try {
      const result = await generateDailyMealOrders(business.id, today);
      toast.success(`Generated ${result.created} orders (${result.skipped} skipped, ${result.paused} paused)`);
      await fetchData();
    } catch (err) {
      toast.error('Failed to generate orders');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveCustomer = async (customer: Customer) => {
    if (!business?.id) return;
    setApprovingId(customer.id);
    try {
      await updateCustomer(customer.id, { status: 'active' });
      toast.success(`${customer.fullName} approved`);
      await fetchData();
    } catch (err) {
      toast.error('Failed to approve customer');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectCustomer = async (customer: Customer) => {
    if (!business?.id) return;
    setApprovingId(customer.id);
    try {
      await updateCustomer(customer.id, { status: 'inactive' });
      toast.success(`${customer.fullName} rejected`);
      await fetchData();
    } catch (err) {
      toast.error('Failed to reject customer');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRecalculateStats = async () => {
    if (!business?.id) return;
    setRecalculating(true);
    try {
      const result = await recalculateBusinessStats(business.id);
      setStats(result as unknown as BusinessStatsV2);
      toast.success('Stats recalculated');
    } catch (err) {
      toast.error('Failed to recalculate stats');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Dashboard" description="Loading your business data...">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-7 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Dashboard`}
      description={`${business?.businessName || 'Business'} overview for ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
      actions={
        <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData}>
          Refresh
        </Button>
      }
    >
      {/* 1. Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeCustomers || customers.filter((c) => c.status === 'active').length}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Meals</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todaysMeals ?? todayOrders.length}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingPayments || 0}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingApprovals ?? pendingApprovals.length}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Daily Meal Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Daily Meal Summary</h2>
            <Badge variant={todayOrders.length > 0 ? 'success' : 'neutral'}>{todayOrders.length} orders</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              icon={<CalendarDays className="h-4 w-4" />}
              loading={generating}
              onClick={handleGenerateOrders}
            >
              Generate Today's Orders
            </Button>

            {todayOrders.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Breakfast</span>
                  <span className="font-medium text-gray-900">{summary.breakfast}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Lunch</span>
                  <span className="font-medium text-gray-900">{summary.lunch}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Dinner</span>
                  <span className="font-medium text-gray-900">{summary.dinner}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivered</span>
                  <Badge variant="success">{summary.delivered}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Out for Delivery</span>
                  <Badge variant="info">{summary.outForDelivery}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pending</span>
                  <Badge variant="warning">{summary.pending}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Skipped</span>
                  <Badge variant="neutral">{summary.skipped}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Failed</span>
                  <Badge variant="danger">{summary.failed}</Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <UtensilsCrossed className="h-10 w-10 mb-2" />
                <p className="text-sm">No orders generated for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. Today's Delivery Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Delivery Progress</h2>
            <Badge variant="info">{todayOrders.length} total</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayOrders.length > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">
                      {summary.delivered + summary.outForDelivery}/{summary.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${summary.total > 0 ? ((summary.delivered + summary.outForDelivery) / summary.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{summary.delivered}</p>
                    <p className="text-xs text-emerald-700">Delivered</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{summary.outForDelivery}</p>
                    <p className="text-xs text-blue-700">Out for Delivery</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
                    <p className="text-xs text-amber-700">Pending</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                    <p className="text-xs text-red-700">Failed</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Package className="h-10 w-10 mb-2" />
                <p className="text-sm">No deliveries today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3 + 4: Pending Approvals & Requests */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Pending Items</h2>
            <Badge variant="warning">{pendingApprovals.length + pendingRequests.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {pendingApprovals.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Customer Approvals</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingApprovals.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{c.area} &middot; {c.phone}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleApproveCustomer(c)}
                          disabled={approvingId === c.id}
                          className="rounded-full p-1 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          {approvingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleRejectCustomer(c)}
                          disabled={approvingId === c.id}
                          className="rounded-full p-1 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Customer Requests</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingRequests.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                        <p className="text-xs text-gray-500 truncate">{r.requestType.replace('_', ' ')}</p>
                      </div>
                      <Badge variant="warning" size="sm">pending</Badge>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate('/customer-requests')}
                  >
                    View All Requests
                  </Button>
                </div>
              </div>
            )}

            {pendingApprovals.length === 0 && pendingRequests.length === 0 && (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <CheckCircle className="h-10 w-10 mb-2" />
                <p className="text-sm">No pending items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              variant="outline"
              className="flex-col h-24 gap-2"
              icon={<CalendarDays className="h-5 w-5" />}
              loading={generating}
              onClick={handleGenerateOrders}
            >
              Generate Orders
            </Button>
            <Button
              variant="outline"
              className="flex-col h-24 gap-2"
              icon={<PlusCircle className="h-5 w-5" />}
              onClick={() => navigate('/customers')}
            >
              Add Customer
            </Button>
            <Button
              variant="outline"
              className="flex-col h-24 gap-2"
              icon={<FileText className="h-5 w-5" />}
              onClick={() => navigate('/payments')}
            >
              Create Invoice
            </Button>
            <Button
              variant="outline"
              className="flex-col h-24 gap-2"
              icon={<ChefHat className="h-5 w-5" />}
              onClick={() => navigate('/items')}
            >
              Add Food Item
            </Button>
            <Button
              variant="outline"
              className="flex-col h-24 gap-2"
              icon={<Bell className="h-5 w-5" />}
              onClick={() => navigate('/notifications')}
            >
              Send Notification
            </Button>
            <Button
              variant="outline"
              className="flex-col h-24 gap-2"
              icon={<RefreshCw className="h-5 w-5" />}
              loading={recalculating}
              onClick={handleRecalculateStats}
            >
              Recalculate Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6. Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Badge variant="neutral">{activityLogs.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {activityLogs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {activityLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="rounded-full bg-gray-100 p-2 text-gray-500 mt-0.5">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{log.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{log.actorName}</span>
                      <span className="text-gray-300">&middot;</span>
                      <Badge variant="neutral" size="sm">{log.module}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Clock className="h-10 w-10 mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </CardContent>
        {activityLogs.length > 10 && (
          <div className="px-6 py-3 border-t border-gray-100">
            <Button variant="ghost" size="sm" className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
              View All Activity
            </Button>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
