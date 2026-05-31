import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getCustomerById, updateCustomer } from '@/services/customerService';
import { getSubscriptionsByBusiness, createSubscription, updateSubscription, deleteSubscription } from '@/services/subscriptionService';
import { getDeliveryAreas } from '@/services/deliveryService';
import { getInvoicesByCustomer } from '@/services/invoiceService';
import {
  ArrowLeft, MapPin, Phone, Mail, CreditCard, IndianRupee,
  CheckCircle2, XCircle, Clock, PauseCircle, AlertTriangle, Hash,
  User, Loader2, Wallet, Home, UtensilsCrossed, Edit3, PhoneCall,
  Plus, Trash2, StopCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Customer, Subscription, DeliveryArea, Invoice } from '@/types';

const mealPlanLabels: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
  breakfast_lunch: 'Breakfast + Lunch', lunch_dinner: 'Lunch + Dinner',
  all_meals: 'All Meals',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success', paused: 'warning', expired: 'neutral', cancelled: 'danger',
};

function capFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Tab = 'overview' | 'subscription' | 'wallet' | 'area';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { business } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showOldSubs, setShowOldSubs] = useState(false);

  const [newSubModal, setNewSubModal] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    planName: 'Standard', mealPlan: 'all_meals',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    totalAmount: 0, billingCycle: 'monthly' as string,
  });
  const [saving, setSaving] = useState(false);

  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [editSubForm, setEditSubForm] = useState({
    planName: '', mealPlan: '', totalAmount: 0, paidAmount: 0, pendingAmount: 0,
    startDate: '', endDate: '', billingCycle: 'monthly', status: 'active',
  });

  const refreshSubs = async () => {
    if (!business?.id) return;
    const subs = await getSubscriptionsByBusiness(business.id);
    setSubscriptions(subs.filter((s) => s.customerId === id));
  };

  useEffect(() => {
    if (!business?.id || !id) return;
    (async () => {
      setLoading(true);
      try {
        const [cust, subs, a, inv] = await Promise.all([
          getCustomerById(id),
          getSubscriptionsByBusiness(business.id),
          getDeliveryAreas(business.id),
          getInvoicesByCustomer(id),
        ]);
        if (cust) setCustomer(cust);
        setSubscriptions(subs.filter((s) => s.customerId === id));
        setAreas(a.filter((ar) => ar.isActive));
        setInvoices(inv);
      } catch (err) {
        console.error('Error fetching customer:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [business?.id, id]);

  const activeSub = subscriptions.find((s) => s.status === 'active');
  const oldSubs = subscriptions.filter((s) => s.status !== 'active' && s.id !== activeSub?.id);
  const totalPaid = subscriptions.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalPending = subscriptions.reduce((sum, s) => sum + (s.pendingAmount || 0), 0);
  const walletBalance = Math.max(0, (customer?.walletBalance || 0));

  const handleCreateSub = async () => {
    if (!business?.id || !id || !customer) return;
    if (activeSub && newSubForm.startDate <= activeSub.endDate) {
      toast.error('New subscription must start after current active subscription ends');
      return;
    }
    setSaving(true);
    try {
      const total = newSubForm.totalAmount;
      const paid = Math.min(walletBalance, total);
      const pending = total - paid;
      await createSubscription(business.id, {
        customerId: id, customerName: customer.fullName,
        planName: newSubForm.planName, mealPlan: newSubForm.mealPlan as any,
        startDate: newSubForm.startDate, endDate: newSubForm.endDate,
        status: 'active', totalAmount: total, paidAmount: paid, pendingAmount: pending,
        billingCycle: newSubForm.billingCycle as any,
      });
      const newWalletBalance = Math.max(0, walletBalance - paid);
      await updateCustomer(id, { walletBalance: newWalletBalance });
      toast.success(`Subscription created! Paid ${formatCurrency(paid)} from wallet, Pending ${formatCurrency(pending)}`);
      setNewSubModal(false);
      setNewSubForm((f) => ({ ...f, totalAmount: 0 }));
      await refreshSubs();
      const updated = await getCustomerById(id);
      if (updated) setCustomer(updated);
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleStopSub = async (subId: string) => {
    if (!confirm('Stop this subscription? It will be marked as expired.')) return;
    try {
      await updateSubscription(subId, { status: 'expired' });
      toast.success('Subscription stopped');
      await refreshSubs();
    } catch (err) {
      toast.error('Failed to stop');
    }
  };

  const handleDeleteSub = async (subId: string) => {
    if (!confirm('Permanently delete this subscription? This cannot be undone.')) return;
    try {
      await deleteSubscription(subId);
      toast.success('Subscription deleted');
      await refreshSubs();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (subId: string, status: string) => {
    try {
      await updateSubscription(subId, { status: status as any });
      toast.success('Status updated!');
      await refreshSubs();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleUpdateSub = async (subId: string, data: any) => {
    try {
      await updateSubscription(subId, data);
      toast.success('Subscription updated!');
      await refreshSubs();
      setEditSub(null);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const openEditSub = (sub: Subscription) => {
    const sd = sub.startDate;
    const ed = sub.endDate;
    setEditSubForm({
      planName: sub.planName, mealPlan: sub.mealPlan,
      totalAmount: sub.totalAmount, paidAmount: sub.paidAmount || 0, pendingAmount: sub.pendingAmount || 0,
      startDate: sd ? (typeof sd === 'string' ? sd : new Date(sd.seconds * 1000).toISOString().split('T')[0]) : '',
      endDate: ed ? (typeof ed === 'string' ? ed : new Date(ed.seconds * 1000).toISOString().split('T')[0]) : '',
      billingCycle: sub.billingCycle, status: sub.status,
    });
    setEditSub(sub);
  };

  if (loading) {
    return (
      <PageContainer title="Customer">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer title="Customer">
        <div className="flex flex-col items-center py-20 text-gray-400">
          <User className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-semibold">Customer not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
          </Button>
        </div>
      </PageContainer>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
    { key: 'subscription', label: 'Subscription', icon: <CreditCard className="h-4 w-4" /> },
    { key: 'wallet', label: 'Wallet', icon: <Wallet className="h-4 w-4" /> },
    { key: 'area', label: 'Area', icon: <MapPin className="h-4 w-4" /> },
  ];

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => navigate('/customers')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="truncate">{customer.fullName}</span>
          <span className="text-sm font-mono text-gray-400 font-normal flex items-center gap-1 shrink-0">
            <Hash className="h-3.5 w-3.5" />{customer.customerCode}
          </span>
          <a
            href={`tel:${customer.phone}`}
            className="ml-auto rounded-full bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 transition-all shadow-sm shrink-0"
            title="Call customer"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      }
      description={`${customer.email || 'No email'} · ${customer.phone}`}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Profile
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <User className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{customer.fullName}</p>
                  </div>
                  <Badge variant={customer.status === 'active' ? 'success' : customer.status === 'paused' ? 'warning' : customer.status === 'pending_approval' ? 'neutral' : 'danger'} size="sm" className="ml-auto">
                    {capFirst(customer.status.replace(/_/g, ' '))}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <Mail className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Email</p>
                    <p className="text-sm text-gray-700 mt-0.5">{customer.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <Phone className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Phone</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{customer.phone}</p>
                  </div>
                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white font-bold text-sm px-4 py-2 hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <PhoneCall className="h-4 w-4" />
                    DIAL
                  </a>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Area</p>
                    <p className="text-sm text-gray-700 mt-0.5">{customer.area || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <Home className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Address</p>
                    <p className="text-sm text-gray-700 mt-0.5">{customer.address || '—'}</p>
                    {customer.landmark && <p className="text-xs text-gray-400 mt-0.5">Landmark: {customer.landmark}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <UtensilsCrossed className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Meal Preference</p>
                    <p className="text-sm text-gray-700 mt-0.5">{customer.mealPreference || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Weekend service: {customer.weekendServiceRequired ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {customer.specialNotes && (
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium">Special Notes</p>
                      <p className="text-sm text-amber-800 mt-0.5">{customer.specialNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Wallet Balance</h3>
                </div>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(walletBalance)}</span>
              </div>
            </CardContent>
          </Card>

          {activeSub && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Active Subscription
                  </h3>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Plan</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{activeSub.planName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Meals</p>
                    <p className="text-sm text-gray-700 mt-0.5">{mealPlanLabels[activeSub.mealPlan] || activeSub.mealPlan}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrency(activeSub.totalAmount)}<span className="text-xs text-gray-400 font-normal">/{activeSub.billingCycle === 'monthly' ? 'mo' : 'wk'}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Days Remaining</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-0.5">{activeSub.endDate ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / 86400000)) : '—'} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Subscriptions</h3>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setNewSubModal(true)}>New Subscription</Button>
          </div>

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-400">
                <CreditCard className="h-10 w-10 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">No subscriptions</p>
                <p className="text-sm mb-4">Create a subscription for this customer</p>
                <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setNewSubModal(true)}>New Subscription</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeSub && (
                <div className="ring-2 ring-emerald-200 rounded-2xl overflow-hidden">
                <SubscriptionCard
                  sub={activeSub}
                  onStatusChange={handleStatusChange}
                  onEdit={() => openEditSub(activeSub)}
                  isActive
                  walletBalance={walletBalance}
                />
              </div>
              )}

              {oldSubs.length > 0 && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowOldSubs(!showOldSubs)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
                  >
                    <span>Previous Subscriptions ({oldSubs.length})</span>
                    {showOldSubs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showOldSubs && (
                    <div className="divide-y divide-gray-100">
                      {oldSubs.map((sub) => (
                        <div key={sub.id} className="opacity-60">
                          <SubscriptionCard
                            sub={sub}
                            onStatusChange={handleStatusChange}
                            onEdit={() => openEditSub(sub)}
                            isActive={false}
                            walletBalance={walletBalance}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* New Subscription Modal */}
          {newSubModal && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setNewSubModal(false)}>
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    New Subscription
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center mb-2">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">Wallet Balance</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(walletBalance)}</p>
                  </div>

                  <Input label="Plan Name" value={newSubForm.planName} onChange={(e) => setNewSubForm((f) => ({ ...f, planName: e.target.value }))} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Meal Plan</label>
                    <select value={newSubForm.mealPlan} onChange={(e) => setNewSubForm((f) => ({ ...f, mealPlan: e.target.value }))} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {Object.entries(mealPlanLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Start Date" type="date" value={newSubForm.startDate} onChange={(e) => setNewSubForm((f) => ({ ...f, startDate: e.target.value }))} />
                    <Input label="End Date" type="date" value={newSubForm.endDate} onChange={(e) => setNewSubForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Total Amount (₹)" type="number" value={String(newSubForm.totalAmount)} onChange={(e) => setNewSubForm((f) => ({ ...f, totalAmount: Number(e.target.value) }))} />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                      <select value={newSubForm.billingCycle} onChange={(e) => setNewSubForm((f) => ({ ...f, billingCycle: e.target.value }))} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {newSubForm.totalAmount > 0 && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total</span>
                        <span className="font-semibold">{formatCurrency(newSubForm.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">From Wallet</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(Math.min(walletBalance, newSubForm.totalAmount))}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                        <span className="text-gray-500">Pending</span>
                        <span className="font-semibold text-amber-600">{formatCurrency(Math.max(0, newSubForm.totalAmount - walletBalance))}</span>
                      </div>
                      {newSubForm.totalAmount > walletBalance && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Wallet balance insufficient — ₹{formatCurrency(newSubForm.totalAmount - walletBalance)} pending
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setNewSubModal(false)}>Cancel</Button>
                    <Button className="flex-1" loading={saving} onClick={handleCreateSub} disabled={!newSubForm.totalAmount || !newSubForm.planName}>Add Subscription</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editSub && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditSub(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-600" />
                Edit Subscription · {editSub.planName}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Plan Name" value={editSubForm.planName} onChange={(e) => setEditSubForm((f) => ({ ...f, planName: e.target.value }))} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Meal Plan</label>
                <select value={editSubForm.mealPlan} onChange={(e) => setEditSubForm((f) => ({ ...f, mealPlan: e.target.value }))} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {Object.entries(mealPlanLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total Amount" type="number" value={String(editSubForm.totalAmount)} onChange={(e) => setEditSubForm((f) => ({ ...f, totalAmount: Number(e.target.value) }))} />
                <Input label="Paid Amount" type="number" value={String(editSubForm.paidAmount)} onChange={(e) => setEditSubForm((f) => ({ ...f, paidAmount: Number(e.target.value) }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Pending Amount" type="number" value={String(editSubForm.pendingAmount)} onChange={(e) => setEditSubForm((f) => ({ ...f, pendingAmount: Number(e.target.value) }))} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                  <select value={editSubForm.billingCycle} onChange={(e) => setEditSubForm((f) => ({ ...f, billingCycle: e.target.value }))} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Date" type="date" value={editSubForm.startDate} onChange={(e) => setEditSubForm((f) => ({ ...f, startDate: e.target.value }))} />
                <Input label="End Date" type="date" value={editSubForm.endDate} onChange={(e) => setEditSubForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={editSubForm.status} onChange={(e) => setEditSubForm((f) => ({ ...f, status: e.target.value }))} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditSub(null)}>Cancel</Button>
                <Button className="flex-1" loading={saving} onClick={() => handleUpdateSub(editSub.id, editSubForm)}>Save Changes</Button>
              </div>
              {editSub.status === 'active' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (confirm('Stop this subscription? It will be marked as expired.')) {
                        handleStopSub(editSub.id);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop This Subscription
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-1.5">Moving to expired — create a new subscription later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Wallet & Payments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">Wallet Balance</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(walletBalance)}</p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
                  <p className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold">Total Paid</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                  <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Pending</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(totalPending)}</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h4>
              {invoices.length === 0 ? (
                <p className="text-sm text-gray-400">No payment records yet</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber || 'Invoice'}</p>
                        <p className="text-xs text-gray-500">{inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(inv.totalAmount || 0)}</p>
                        <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'danger'} size="sm">
                          {inv.status ? capFirst(inv.status) : '—'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'area' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Delivery Area
              </h3>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                {customer.area ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-100 p-2.5">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{customer.area}</p>
                      <p className="text-sm text-gray-500">{customer.address || 'No address set'}</p>
                      {customer.landmark && <p className="text-xs text-gray-400">Landmark: {customer.landmark}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No delivery area assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function SubscriptionCard({ sub, onStatusChange, onEdit, isActive, walletBalance }: {
  sub: Subscription;
  onStatusChange: (id: string, status: string) => void;
  onEdit: () => void;
  isActive: boolean;
  walletBalance: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pendingAmt = sub.pendingAmount || 0;
  const startStr = sub.startDate ? formatDate(sub.startDate) : '—';
  const endStr = sub.endDate ? formatDate(sub.endDate) : '—';

  return (
    <Card className={!isActive ? 'border-gray-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className={`font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{sub.planName}</span>
            {isActive && pendingAmt > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Pending: {formatCurrency(pendingAmt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={statusColors[sub.status] || 'neutral'} size="sm">
              {capFirst(sub.status)}
            </Badge>
            <button onClick={onEdit} className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-600 transition-all" title="Edit">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Date Range Bar */}
        <div className="flex items-center gap-2 mb-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">From</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{startStr}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="mx-2 text-xs text-gray-400 font-medium">to</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">To</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{endStr}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 mb-2"
        >
          <span>More details</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <span className="text-gray-400">Meals</span>
              <p className="font-medium text-gray-700 mt-0.5">{mealPlanLabels[sub.mealPlan] || sub.mealPlan}</p>
            </div>
            <div>
              <span className="text-gray-400">Amount</span>
              <p className="font-medium text-gray-700 mt-0.5">{formatCurrency(sub.totalAmount)}</p>
            </div>
            <div>
              <span className="text-gray-400">Paid</span>
              <p className="font-medium text-emerald-600 mt-0.5">{formatCurrency(sub.paidAmount || 0)}</p>
            </div>
            <div>
              <span className="text-gray-400">Pending</span>
              <p className={`font-medium mt-0.5 ${pendingAmt > 0 ? 'text-amber-600 bg-amber-50 rounded px-1 py-0.5 inline-block' : 'text-gray-400'}`}>
                {formatCurrency(pendingAmt)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Billing</span>
              <p className="font-medium text-gray-700 mt-0.5">{capFirst(sub.billingCycle)}</p>
            </div>
            <div>
              <span className="text-gray-400">Days Left</span>
              <p className="font-medium text-emerald-600 mt-0.5">{sub.endDate ? Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000)) : '—'}</p>
            </div>
          </div>
        )}

        {isActive && pendingAmt > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 font-medium mb-3">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>₹{formatCurrency(pendingAmt)} pending — wallet has {formatCurrency(walletBalance)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <select
              value={sub.status}
              onChange={(e) => onStatusChange(sub.id, e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          {!isActive && (
            <span className="text-xs text-gray-400 italic">Expired · {endStr}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
