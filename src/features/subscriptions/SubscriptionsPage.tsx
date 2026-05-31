import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getSubscriptionsByBusiness, createSubscription, updateSubscription } from '@/services/subscriptionService';
import { getCustomersByBusiness } from '@/services/customerService';
import { Search, Plus, RefreshCw, Loader2, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Subscription, CreateSubscriptionInput, Customer } from '@/types';

const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success', paused: 'warning', expired: 'neutral', cancelled: 'danger',
};

export function SubscriptionsPage() {
  const { business } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateSubscriptionInput>({
    customerId: '', customerName: '', planName: 'Standard', mealPlan: 'all_meals',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: 'active', totalAmount: 0, paidAmount: 0, pendingAmount: 0, billingCycle: 'monthly',
  });

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [subs, custs] = await Promise.all([
        getSubscriptionsByBusiness(business.id),
        getCustomersByBusiness(business.id),
      ]);
      setSubscriptions(subs);
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.fullName || id;

  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    const name = getCustomerName(s.customerId).toLowerCase();
    return (!q || name.includes(q)) && (statusFilter === 'all' || s.status === statusFilter);
  });

  const handleSave = async () => {
    if (!business?.id || !form.customerId) {
      toast.error('Select a customer');
      return;
    }
    setSaving(true);
    try {
      await createSubscription(business.id, form);
      toast.success('Subscription created!');
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (subId: string, status: string) => {
    try {
      await updateSubscription(subId, { status: status as any });
      toast.success('Status updated!');
      await fetchData();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const updateForm = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <PageContainer
      title="Subscriptions"
      description="Manage subscriptions."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Subscription</Button>
        </div>
      }
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input search placeholder="Search by customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md w-full" />
            <div className="flex gap-2">
              {['all', 'active', 'paused', 'expired', 'cancelled'].map((s) => (
                <Button key={s} variant={statusFilter === s ? 'primary' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Plan</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Meals</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Period</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{getCustomerName(s.customerId)}</td>
                      <td className="py-3 px-3 text-gray-600">{s.planName}</td>
                      <td className="py-3 px-3"><Badge variant="neutral">{s.mealPlan.replace('_', ' + ')}</Badge></td>
                      <td className="py-3 px-3 font-medium text-gray-900">{formatCurrency(s.totalAmount)}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {s.startDate?.toDate ? s.startDate.toDate().toLocaleDateString() : s.startDate} - {s.endDate?.toDate ? s.endDate.toDate().toLocaleDateString() : s.endDate}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s.id, e.target.value)}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <CreditCard className="h-12 w-12 mb-3" />
              <p className="text-gray-600 font-medium mb-1">No subscriptions</p>
              <p className="text-sm">Create subscriptions for your customers</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Subscription">
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select value={form.customerId} onChange={(e) => {
              const cust = customers.find(c => c.id === e.target.value);
              updateForm('customerId', e.target.value);
              updateForm('customerName', cust?.fullName || '');
            }} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Select customer...</option>
              {customers.filter(c => c.status === 'active').map((c) => (
                <option key={c.id} value={c.id}>{c.fullName} ({c.customerCode})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Plan Name" value={form.planName} onChange={(e) => updateForm('planName', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Meal Plan</label>
              <select value={form.mealPlan} onChange={(e) => updateForm('mealPlan', e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="breakfast_lunch">Breakfast + Lunch</option>
                <option value="lunch_dinner">Lunch + Dinner</option>
                <option value="all_meals">All Meals</option>
              </select>
            </div>
            <Input label="Total Amount" type="number" value={form.totalAmount || ''} onChange={(e) => updateForm('totalAmount', Number(e.target.value))} />
            <Input label="Paid Amount" type="number" value={form.paidAmount || ''} onChange={(e) => updateForm('paidAmount', Number(e.target.value))} />
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
              <select value={form.billingCycle} onChange={(e) => updateForm('billingCycle', e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Create</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
