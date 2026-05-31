import { useEffect, useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getSystemAlerts, getUnreadSystemAlerts, markAlertRead, createSystemAlert, generateSubscriptionExpiryAlerts, generatePaymentDueAlerts } from '@/services/alertService';
import { getCustomersByBusiness } from '@/services/customerService';
import { getNotificationsByBusiness, createNotification } from '@/services/notificationService';
import { getSubscriptionsByBusiness } from '@/services/subscriptionService';
import { getInvoicesByBusiness } from '@/services/invoiceService';
import { toast } from 'react-hot-toast';
import { Bell, Send, Users, Loader2, Filter, CheckCheck, AlertTriangle, Info, RefreshCw, Search, CalendarDays, Clock, CheckCircle, MapPin } from 'lucide-react';
import type { SystemAlert, AppNotification, Customer } from '@/types';

type TargetType = 'all' | 'area' | 'payment_status' | 'subscription_status';

const CATEGORIES = ['payment', 'subscription', 'delivery', 'system'] as const;
const PAYMENT_STATUSES = ['paid', 'pending', 'overdue'] as const;
const SUBSCRIPTION_STATUSES = ['active', 'inactive', 'paused'] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  payment: <Info className="h-4 w-4" />,
  subscription: <CalendarDays className="h-4 w-4" />,
  delivery: <Bell className="h-4 w-4" />,
  system: <AlertTriangle className="h-4 w-4" />,
};

const CATEGORY_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  payment: 'danger',
  subscription: 'warning',
  delivery: 'info',
  system: 'neutral',
};

const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'info'> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

export function NotificationsPage() {
  const { business } = useAuth();
  const businessId = business?.id;

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<'expiry' | 'payment' | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetType: 'all' as TargetType,
    targetValue: '',
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlerts = async () => {
    if (!businessId) return;
    setLoadingAlerts(true);
    try {
      const data = await getSystemAlerts(businessId);
      setAlerts(data);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchNotifications = async () => {
    if (!businessId) return;
    setLoadingNotifications(true);
    try {
      const data = await getNotificationsByBusiness(businessId);
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchCustomers = async () => {
    if (!businessId) return;
    try {
      const data = await getCustomersByBusiness(businessId);
      setCustomers(data);
    } catch {
      console.error('Failed to load customers');
    }
  };

  const fetchAll = () => {
    fetchAlerts();
    fetchNotifications();
    fetchCustomers();
  };

  useEffect(() => {
    fetchAll();
  }, [businessId]);

  const areas = useMemo(() => {
    const unique = new Set(customers.map((c) => c.area).filter(Boolean));
    return Array.from(unique).sort();
  }, [customers]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (readFilter === 'read' && !a.isRead) return false;
      if (readFilter === 'unread' && a.isRead) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [alerts, categoryFilter, readFilter, searchQuery]);

  const resetForm = () => {
    setForm({ title: '', message: '', targetType: 'all', targetValue: '' });
  };

  const handleSendNotification = async () => {
    if (!businessId) return;
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: 'customer',
        status: 'sent',
        targetType: form.targetType === 'all' ? 'all' : 'selected',
      };

      if (form.targetType === 'area') {
        payload.targetArea = form.targetValue || 'all';
      } else if (form.targetType === 'payment_status') {
        payload.targetPaymentStatus = form.targetValue || 'all';
      } else if (form.targetType === 'subscription_status') {
        payload.targetSubscriptionStatus = form.targetValue || 'all';
      }

      await createNotification(businessId, payload);
      toast.success('Notification sent!');
      setSendModalOpen(false);
      resetForm();
      fetchNotifications();
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
    } catch {
      toast.error('Failed to mark alert as read');
    }
  };

  const handleGenerateExpiryAlerts = async () => {
    if (!businessId) return;
    setGenerating('expiry');
    try {
      const subscriptions = await getSubscriptionsByBusiness(businessId);
      const count = await generateSubscriptionExpiryAlerts(businessId, subscriptions);
      toast.success(`Created ${count} expiry alert(s)`);
      fetchAlerts();
    } catch {
      toast.error('Failed to generate expiry alerts');
    } finally {
      setGenerating(null);
    }
  };

  const handleGeneratePaymentAlerts = async () => {
    if (!businessId) return;
    setGenerating('payment');
    try {
      const invoices = await getInvoicesByBusiness(businessId);
      const count = await generatePaymentDueAlerts(businessId, invoices);
      toast.success(`Created ${count} payment alert(s)`);
      fetchAlerts();
    } catch {
      toast.error('Failed to generate payment alerts');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <PageContainer
      title="Notifications"
      description="Send notifications and monitor system alerts."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchAll} />
          <Button icon={<Send className="h-4 w-4" />} onClick={() => setSendModalOpen(true)}>
            Send Notification
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              <p className="text-sm text-gray-500">Total Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {loadingNotifications ? '-' : notifications.length}
              </p>
              <p className="text-sm text-gray-500">Sent Notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Quick Actions:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<CalendarDays className="h-4 w-4" />}
                loading={generating === 'expiry'}
                onClick={handleGenerateExpiryAlerts}
              >
                Check Expiring Subscriptions
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Clock className="h-4 w-4" />}
                loading={generating === 'payment'}
                onClick={handleGeneratePaymentAlerts}
              >
                Check Payment Due Alerts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Notification History</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-56"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <Filter className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!categoryFilter ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${categoryFilter === cat ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {CATEGORY_ICONS[cat]}
                {cat}
              </button>
            ))}
            <span className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => setReadFilter(readFilter === 'all' ? 'unread' : 'all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${readFilter !== 'all' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {readFilter === 'unread' ? 'Unread' : readFilter === 'read' ? 'Read' : 'All Status'}
            </button>
          </div>

          {/* Alerts List */}
          {loadingAlerts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-2.5 shrink-0 ${
                        alert.priority === 'high' ? 'bg-red-50 text-red-600' :
                        alert.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {CATEGORY_ICONS[alert.category] || <Bell className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!alert.isRead && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                          )}
                          <p className="text-sm font-semibold text-gray-900 truncate">{alert.title}</p>
                          <Badge variant={CATEGORY_BADGE[alert.category] || 'neutral'} size="sm">
                            {alert.category}
                          </Badge>
                          <Badge variant={PRIORITY_BADGE[alert.priority] || 'info'} size="sm">
                            {alert.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.createdAt?.toDate
                              ? alert.createdAt.toDate().toLocaleString()
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            className="rounded-lg p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Mark as read"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <div className="rounded-full bg-gray-50 p-4 mb-3">
                <Bell className="h-10 w-10" />
              </div>
              <p className="text-gray-600 font-medium">
                {alerts.length === 0 ? 'No alerts yet' : 'No matching alerts'}
              </p>
              <p className="text-sm">
                {alerts.length === 0
                  ? 'All clear! System alerts will appear here.'
                  : 'Try changing the filters above.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Modal */}
      <Modal open={sendModalOpen} onClose={() => { resetForm(); setSendModalOpen(false); }} title="Send Notification">
        <div className="p-6 space-y-5">
          <Input
            label="Title"
            placeholder="Notification title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="Write your notification message..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Target</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'all', label: 'All Customers', icon: <Users className="h-4 w-4" /> },
                { value: 'area', label: 'By Area', icon: <MapPin className="h-4 w-4" /> },
                { value: 'payment_status', label: 'By Payment Status', icon: <CheckCircle className="h-4 w-4" /> },
                { value: 'subscription_status', label: 'By Subscription Status', icon: <CalendarDays className="h-4 w-4" /> },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, targetType: opt.value, targetValue: '' })}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                    form.targetType === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.targetType === 'area' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Select Area</label>
              <select
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {areas.length === 0 && (
                <p className="text-xs text-gray-400">No customer areas found</p>
              )}
            </div>
          )}

          {form.targetType === 'payment_status' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Payment Status</label>
              <select
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          )}

          {form.targetType === 'subscription_status' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Subscription Status</label>
              <select
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { resetForm(); setSendModalOpen(false); }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              icon={<Send className="h-4 w-4" />}
              loading={saving}
              onClick={handleSendNotification}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
