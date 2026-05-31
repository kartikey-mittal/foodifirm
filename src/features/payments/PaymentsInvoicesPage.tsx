import { useEffect, useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getInvoicesByBusiness, createInvoice } from '@/services/invoiceService';
import { getPaymentsByBusiness, createPayment } from '@/services/paymentService';
import { getCustomersByBusiness } from '@/services/customerService';
import {
  Search, Plus, RefreshCw, Loader2, IndianRupee,
  CreditCard, AlertTriangle, Eye, Banknote,
  Receipt, FileText, Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Invoice, Payment, PaymentMode, Customer } from '@/types';

const statusBadge: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  partial: 'info',
  overdue: 'danger',
};

const paymentModeLabels: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
};

function toDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val === 'object' && val.toDate) return val.toDate();
  return new Date(val);
}

function computeStatus(inv: Invoice): Invoice['status'] {
  if (inv.pendingAmount <= 0) return 'paid';
  if (inv.paidAmount > 0 && inv.pendingAmount > 0) return 'partial';
  const due = toDate(inv.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today && inv.pendingAmount > 0) return 'overdue';
  return 'pending';
}

function formatDate(val: any): string {
  return toDate(val).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function PaymentsInvoicesPage() {
  const { business } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'create'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultForm = {
    customerId: '',
    customerName: '',
    subscriptionId: '',
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    status: 'pending' as const,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  };
  const [form, setForm] = useState({ ...defaultForm });

  const [payForm, setPayForm] = useState({
    amount: 0,
    paymentMode: 'cash' as PaymentMode,
    paymentDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [inv, pay, custs] = await Promise.all([
        getInvoicesByBusiness(business.id),
        getPaymentsByBusiness(business.id),
        getCustomersByBusiness(business.id),
      ]);
      setInvoices(inv);
      setPayments(pay);
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const getCustomerName = (id: string) =>
    customers.find((c) => c.id === id)?.fullName || id;

  const invoicesWithStatus = useMemo(
    () => invoices.map((inv) => ({ ...inv, status: computeStatus(inv) })),
    [invoices],
  );

  const filtered = invoicesWithStatus.filter((inv) => {
    const q = search.toLowerCase();
    const name = (inv.customerName || getCustomerName(inv.customerId)).toLowerCase();
    const num = (inv.invoiceNumber || '').toLowerCase();
    return (
      (!q || name.includes(q) || num.includes(q)) &&
      (statusFilter === 'all' || inv.status === statusFilter)
    );
  });

  const totalRevenue = invoicesWithStatus.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = invoicesWithStatus.reduce((s, i) => s + i.pendingAmount, 0);
  const overdueInvoices = invoicesWithStatus.filter((i) => i.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.pendingAmount, 0);

  const handleViewDetail = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoicePayments(payments.filter((p) => p.invoiceId === inv.id));
    setDetailModalOpen(true);
  };

  const handleAddPayment = () => {
    if (!selectedInvoice) return;
    setPayForm({
      amount: selectedInvoice.pendingAmount,
      paymentMode: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      note: '',
    });
    setPayModalOpen(true);
  };

  const handlePaySubmit = async () => {
    if (!selectedInvoice || !business?.id || payForm.amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await createPayment(business.id, {
        customerId: selectedInvoice.customerId,
        invoiceId: selectedInvoice.id,
        amount: payForm.amount,
        paymentMode: payForm.paymentMode,
        paymentDate: payForm.paymentDate,
        note: payForm.note || undefined,
      });
      toast.success('Payment recorded!');
      setPayModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!business?.id || !form.customerId || form.totalAmount <= 0) {
      toast.error('Fill required fields');
      return;
    }
    setSaving(true);
    try {
      await createInvoice(business.id, {
        customerId: form.customerId,
        customerName: form.customerName,
        subscriptionId: form.subscriptionId || undefined,
        totalAmount: form.totalAmount,
        paidAmount: form.paidAmount,
        pendingAmount: form.totalAmount - form.paidAmount,
        status: form.paidAmount >= form.totalAmount ? 'paid' : 'pending',
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
      });
      toast.success('Invoice created!');
      setCreateModalOpen(false);
      setForm({ ...defaultForm });
      setActiveTab('invoices');
      await fetchData();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  const tabs = [
    { key: 'invoices' as const, label: 'All Invoices' },
    { key: 'payments' as const, label: 'Payments' },
    { key: 'create' as const, label: 'Create Invoice' },
  ];

  if (loading) {
    return (
      <PageContainer title="Payments & Invoices" description="Track payments and invoices.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Payments & Invoices"
      description="Track payments and invoices."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateModalOpen(true)}>
            New Invoice
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-emerald-50 p-3">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-amber-50 p-3">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-red-50 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOverdue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Invoices */}
      {activeTab === 'invoices' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                search
                placeholder="Search by customer or invoice number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md w-full"
              />
              <div className="flex gap-2 flex-wrap">
                {['all', 'paid', 'pending', 'partial', 'overdue'].map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Receipt className="h-12 w-12 mb-3" />
                <p className="text-gray-600 font-medium mb-1">No invoices found</p>
                <p className="text-sm">Try changing filters or create a new invoice</p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden space-y-3">
                  {filtered.map((inv) => (
                    <Card key={inv.id} hover>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{inv.invoiceNumber}</span>
                          <Badge variant={statusBadge[inv.status]}>{inv.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {inv.customerName || getCustomerName(inv.customerId)}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div>
                            <p className="text-gray-400">Total</p>
                            <p className="font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Paid</p>
                            <p className="font-medium text-emerald-600">{formatCurrency(inv.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Pending</p>
                            <p className="font-medium text-amber-600">{formatCurrency(inv.pendingAmount)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Due: {formatDate(inv.dueDate)}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(inv)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Invoice</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Total</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Paid</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Pending</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Due Date</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((inv) => (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3 text-gray-600">
                            {inv.customerName || getCustomerName(inv.customerId)}
                          </td>
                          <td className="py-3 px-3 font-medium text-gray-900">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="py-3 px-3 text-emerald-600 font-medium">
                            {formatCurrency(inv.paidAmount)}
                          </td>
                          <td className="py-3 px-3 text-amber-600 font-medium">
                            {formatCurrency(inv.pendingAmount)}
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-xs">
                            {formatDate(inv.dueDate)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={statusBadge[inv.status]}>{inv.status}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(inv)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <Card>
          <CardContent className="p-6">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Banknote className="h-12 w-12 mb-3" />
                <p className="text-gray-600 font-medium mb-1">No payments recorded</p>
                <p className="text-sm">Payments will appear here once recorded</p>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="sm:hidden space-y-3">
                  {payments.map((p) => (
                    <Card key={p.id} hover>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                          <Badge variant="success">{paymentModeLabels[p.paymentMode] || p.paymentMode}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{getCustomerName(p.customerId)}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(p.paymentDate)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Amount</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Mode</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-3 text-gray-600 text-xs">{formatDate(p.paymentDate)}</td>
                          <td className="py-3 px-3 text-gray-600">{getCustomerName(p.customerId)}</td>
                          <td className="py-3 px-3 font-medium text-emerald-600">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-3">
                            <Badge variant="success" size="sm">
                              {paymentModeLabels[p.paymentMode] || p.paymentMode}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-gray-400 text-xs">{p.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Create Invoice */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Create New Invoice</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <select
                  value={form.customerId}
                  onChange={(e) => {
                    const c = customers.find((c) => c.id === e.target.value);
                    updateForm('customerId', e.target.value);
                    updateForm('customerName', c?.fullName || '');
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Subscription / Reference"
                placeholder="e.g. SUB-001"
                value={form.subscriptionId}
                onChange={(e) => updateForm('subscriptionId', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Total Amount"
                  type="number"
                  value={form.totalAmount || ''}
                  onChange={(e) => {
                    const total = Number(e.target.value);
                    updateForm('totalAmount', total);
                    updateForm('pendingAmount', total - form.paidAmount);
                  }}
                />
                <Input
                  label="Paid Amount"
                  type="number"
                  value={form.paidAmount || ''}
                  onChange={(e) => {
                    const paid = Number(e.target.value);
                    updateForm('paidAmount', paid);
                    updateForm('pendingAmount', form.totalAmount - paid);
                  }}
                />
                <Input
                  label="Invoice Date"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => updateForm('invoiceDate', e.target.value)}
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateForm('dueDate', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setActiveTab('invoices');
                    setForm({ ...defaultForm });
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" loading={saving} onClick={handleCreateInvoice}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : ''}
        className="max-w-2xl"
      >
        {selectedInvoice && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Customer</p>
                <p className="font-medium text-gray-900">
                  {selectedInvoice.customerName || getCustomerName(selectedInvoice.customerId)}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={statusBadge[selectedInvoice.status]}>{selectedInvoice.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Invoice Date</p>
                <p className="text-sm text-gray-700">{formatDate(selectedInvoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Due Date</p>
                <p className="text-sm text-gray-700">{formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Paid</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedInvoice.paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Pending</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(selectedInvoice.pendingAmount)}</p>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h4>
              {invoicePayments.length === 0 ? (
                <p className="text-sm text-gray-400">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoicePayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-50 p-2">
                          <Banknote className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-gray-400">
                            {paymentModeLabels[p.paymentMode] || p.paymentMode}
                            {' · '}
                            {formatDate(p.paymentDate)}
                          </p>
                        </div>
                      </div>
                      {p.note && <span className="text-xs text-gray-400 max-w-[120px] truncate">{p.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedInvoice.pendingAmount > 0 && (
              <Button className="w-full" onClick={handleAddPayment}>
                <Plus className="h-4 w-4 mr-1" /> Add Payment
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment"
      >
        <div className="p-6 space-y-4">
          {selectedInvoice && (
            <>
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invoice</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pending Amount</span>
                  <span className="font-medium text-amber-600">{formatCurrency(selectedInvoice.pendingAmount)}</span>
                </div>
              </div>

              <Input
                label="Amount"
                type="number"
                value={payForm.amount || ''}
                onChange={(e) => setPayForm((p) => ({ ...p, amount: Number(e.target.value) }))}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                <select
                  value={payForm.paymentMode}
                  onChange={(e) => setPayForm((p) => ({ ...p, paymentMode: e.target.value as PaymentMode }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <Input
                label="Payment Date"
                type="date"
                value={payForm.paymentDate}
                onChange={(e) => setPayForm((p) => ({ ...p, paymentDate: e.target.value }))}
              />

              <Input
                label="Note (optional)"
                value={payForm.note}
                onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="e.g. Paid via Google Pay"
              />

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setPayModalOpen(false)}>Cancel</Button>
                <Button className="flex-1" loading={saving} onClick={handlePaySubmit}>Record Payment</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Create Invoice Modal (triggered by header button) */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="New Invoice"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => {
                const c = customers.find((c) => c.id === e.target.value);
                updateForm('customerId', e.target.value);
                updateForm('customerName', c?.fullName || '');
              }}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>

          <Input
            label="Subscription / Reference"
            value={form.subscriptionId}
            onChange={(e) => updateForm('subscriptionId', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Amount"
              type="number"
              value={form.totalAmount || ''}
              onChange={(e) => {
                const total = Number(e.target.value);
                updateForm('totalAmount', total);
                updateForm('pendingAmount', total - form.paidAmount);
              }}
            />
            <Input
              label="Paid Amount"
              type="number"
              value={form.paidAmount || ''}
              onChange={(e) => {
                const paid = Number(e.target.value);
                updateForm('paidAmount', paid);
                updateForm('pendingAmount', form.totalAmount - paid);
              }}
            />
            <Input
              label="Invoice Date"
              type="date"
              value={form.invoiceDate}
              onChange={(e) => updateForm('invoiceDate', e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => updateForm('dueDate', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreateInvoice}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
