import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getCustomersByBusiness, createCustomer, updateCustomer } from '@/services/customerService';
import { getSubscriptionsByBusiness } from '@/services/subscriptionService';
import { getDeliveryAreas } from '@/services/deliveryService';
import {
  Plus, Search, RefreshCw, Loader2, UserPlus, MapPin, Phone, Mail,
  CheckCircle2, XCircle, Clock, PauseCircle, AlertTriangle,
  IndianRupee, Users, Hash, Filter, X, ChevronDown, ChevronRight, Hourglass, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer, CreateCustomerInput, DeliveryArea, Subscription } from '@/types';

const mealPlanLabels: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
  breakfast_lunch: 'Breakfast + Lunch', lunch_dinner: 'Lunch + Dinner',
  all_meals: 'All Meals',
};

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral'; icon: React.ReactNode; label: string }> = {
  active: { variant: 'success', icon: <CheckCircle2 className="h-4 w-4" />, label: '' },
  paused: { variant: 'warning', icon: <PauseCircle className="h-3.5 w-3.5" />, label: 'Paused' },
  inactive: { variant: 'danger', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Inactive' },
  pending_approval: { variant: 'neutral', icon: <Hourglass className="h-3.5 w-3.5" />, label: 'Pending' },
};

const paymentConfig: Record<string, { variant: 'success' | 'warning' | 'danger'; icon: React.ReactNode; label: string; prefix?: React.ReactNode }> = {
  paid: { variant: 'success', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Paid' },
  pending: { variant: 'warning', icon: <IndianRupee className="h-3 w-3" />, label: 'Pending' },
  partial: { variant: 'warning', icon: <IndianRupee className="h-3 w-3" />, label: 'Partial' },
  overdue: { variant: 'danger', icon: <IndianRupee className="h-3 w-3" />, label: 'Overdue' },
};

const defaultForm: CreateCustomerInput = {
  fullName: '', email: '', phone: '', address: '', area: '', landmark: '',
  mealPreference: '', weekendServiceRequired: false, specialNotes: '',
  status: 'active', subscriptionStatus: 'none', paymentStatus: 'pending', walletBalance: 0,
};

export function CustomersPage() {
  const { business } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateCustomerInput>({ ...defaultForm });

  const fetchCustomers = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [data, a, subs] = await Promise.all([
        getCustomersByBusiness(business.id),
        getDeliveryAreas(business.id),
        getSubscriptionsByBusiness(business.id),
      ]);
      setCustomers(data);
      setAreas(a.filter((ar) => ar.isActive));
      setSubscriptions(subs);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [business?.id]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || c.fullName.toLowerCase().includes(q) || c.phone.includes(q) || c.area.toLowerCase().includes(q) || (c.customerCode || '').toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || c.paymentStatus === filterPayment;
    const matchesArea = filterArea === 'all' || c.area === filterArea;
    return matchesSearch && matchesStatus && matchesPayment && matchesArea;
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ ...defaultForm });
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      fullName: customer.fullName, email: customer.email, phone: customer.phone,
      address: customer.address, area: customer.area, landmark: customer.landmark || '',
      mealPreference: customer.mealPreference || '', weekendServiceRequired: customer.weekendServiceRequired ?? false,
      specialNotes: customer.specialNotes || '', status: customer.status,
      subscriptionStatus: customer.subscriptionStatus, paymentStatus: customer.paymentStatus,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.phone || !business?.id) {
      toast.error('Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form);
        toast.success('Customer updated!');
      } else {
        await createCustomer(business.id, form);
        toast.success('Customer added!');
      }
      setModalOpen(false);
      await fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const hasActiveFilters = filterStatus !== 'all' || filterPayment !== 'all' || filterArea !== 'all';

  return (
    <PageContainer
      title="Customers"
      description="Manage your customer base."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchCustomers} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAddModal}>Add</Button>
        </div>
      }
    >
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Search + Filter Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, phone, area, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2.5 text-sm font-semibold transition-all shrink-0 ${
                hasActiveFilters
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending_approval">Pending</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</span>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Area</span>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.areaName}>{a.areaName}</option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterStatus('all'); setFilterPayment('all'); setFilterArea('all'); }}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length > 0 ? (
            /* Customer List */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((c) => {
                const st = statusConfig[c.status] || statusConfig.active;
                const pm = paymentConfig[c.paymentStatus] || paymentConfig.pending;
                const hasActiveSub = subscriptions.some((s) => s.customerId === c.id && s.status === 'active');
                const activeSub = subscriptions.find((s) => s.customerId === c.id && s.status === 'active');
                return (
                  <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
                    {/* Row 1: Avatar + Name/Code */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar name={c.fullName} size="md" className="ring-2 ring-gray-100 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm truncate">{c.fullName}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-50 rounded px-1.5 py-0.5 shrink-0">
                            <Hash className="h-2.5 w-2.5" />
                            {c.customerCode}
                          </span>
                        </div>
                        {hasActiveSub && activeSub && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 mt-1.5">
                            <CreditCard className="h-3.5 w-3.5" />
                            {mealPlanLabels[activeSub.mealPlan] || activeSub.mealPlan}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={st.variant} size={st.label ? 'sm' : 'md'} className={st.label ? 'gap-1' : 'p-1.5 rounded-full'}>
                          {st.icon}{st.label}
                        </Badge>
                        {c.status === 'pending_approval' && (
                          <Badge variant={pm.variant} size="sm" className="gap-1">
                            {pm.icon}{pm.label}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Phone + Email */}
                    <div className="flex items-center gap-3 mb-2">
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {c.phone}
                      </a>
                      {c.email && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{c.email}</span>
                        </span>
                      )}
                    </div>

                    {/* Row 3: Area + Payment + Actions */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                      <div className="flex items-center gap-2">
                        {c.area ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1 font-medium">
                            <MapPin className="h-3 w-3 text-emerald-500" />
                            {c.area}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">No area</span>
                        )}
                        <Badge variant={pm.variant} size="sm" className="gap-1">
                          {pm.icon}{pm.label}
                        </Badge>
                      </div>
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center py-20 text-gray-400">
              <div className="rounded-full bg-gray-50 p-4 mb-4">
                <Users className="h-10 w-10" />
              </div>
              <p className="text-gray-600 font-semibold mb-1">
                {search || hasActiveFilters ? 'No customers found' : 'No customers yet'}
              </p>
              <p className="text-sm mb-5">
                {search || hasActiveFilters ? 'Try different search or filters' : 'Add your first customer to get started'}
              </p>
              {!search && !hasActiveFilters && (
                <Button onClick={openAddModal} icon={<Plus className="h-4 w-4" />}>Add Customer</Button>
              )}
            </div>
          )}

          {/* Count */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {filtered.length} of {customers.length} customers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-emerald-600" />
          <span>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</span>
        </div>
      }>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {editingCustomer && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
              <Hash className="h-3.5 w-3.5" />
              {editingCustomer.customerCode} · {editingCustomer.fullName}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Full Name *" value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Input label="Address" value={form.address} onChange={(e) => updateForm('address', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Area</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={form.area}
                  onChange={(e) => updateForm('area', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.areaName}>{a.areaName}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input label="Landmark" value={form.landmark || ''} onChange={(e) => updateForm('landmark', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => updateForm('status', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Payment</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={form.paymentStatus}
                  onChange={(e) => updateForm('paymentStatus', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
