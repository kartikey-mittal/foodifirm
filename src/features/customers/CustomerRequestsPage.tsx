import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import {
  getRequestsByBusiness,
  updateRequestStatus,
  deleteCustomerRequest,
} from '@/services/customerRequestService';
import { getCustomersByBusiness, updateCustomer } from '@/services/customerService';
import {
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  AlertTriangle,
  Info,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CustomerRequest, Customer } from '@/types';

const requestTypeLabels: Record<string, string> = {
  pause_service: 'Pause Service',
  skip_meal: 'Skip Meal',
  preference_update: 'Preference Update',
  general: 'General',
  new_registration: 'New Registration',
};

const requestTypeIcons: Record<string, React.ReactNode> = {
  pause_service: <AlertTriangle className="h-4 w-4" />,
  skip_meal: <Info className="h-4 w-4" />,
  preference_update: <Info className="h-4 w-4" />,
  general: <MessageSquare className="h-4 w-4" />,
  new_registration: <UserPlus className="h-4 w-4" />,
};

const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'neutral',
};

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type DisplayRequestType = 'pause_service' | 'skip_meal' | 'preference_update' | 'general' | 'new_registration';

interface RequestItem {
  _type: 'request';
  data: CustomerRequest;
}

interface RegistrationItem {
  _type: 'registration';
  data: Customer;
}

type DisplayItem = RequestItem | RegistrationItem;

export function CustomerRequestsPage() {
  const { business } = useAuth();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [customersMap, setCustomersMap] = useState<Record<string, { fullName: string; customerCode: string }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<DisplayRequestType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [reqs, customers] = await Promise.all([
        getRequestsByBusiness(business.id),
        getCustomersByBusiness(business.id),
      ]);
      setRequests(reqs);
      setPendingCustomers(customers.filter((c) => c.status === 'pending_approval'));
      const cmap: Record<string, { fullName: string; customerCode: string }> = {};
      customers.forEach((c) => { cmap[c.id] = { fullName: c.fullName, customerCode: c.customerCode }; });
      setCustomersMap(cmap);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const getCustomerName = (customerId: string) => customersMap[customerId]?.fullName || customerId;
  const getCustomerCode = (customerId: string) => customersMap[customerId]?.customerCode || '—';

  const combinedItems: DisplayItem[] = [
    ...pendingCustomers.map((c) => ({ _type: 'registration' as const, data: c })),
    ...requests.map((r) => ({ _type: 'request' as const, data: r })),
  ];

  const filtered = combinedItems.filter((item) => {
    const q = search.toLowerCase();
    if (item._type === 'registration') {
      const c = item.data;
      const nameMatch = c.fullName.toLowerCase().includes(q);
      const codeMatch = c.customerCode.toLowerCase().includes(q);
      const matchesSearch = !q || nameMatch || codeMatch || c.phone.includes(q) || c.area.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || statusFilter === 'pending';
      const matchesType = typeFilter === 'all' || typeFilter === 'new_registration';
      return matchesSearch && matchesStatus && matchesType;
    }
    const r = item.data;
    const customerName = getCustomerName(r.customerId).toLowerCase();
    const matchesSearch = !q || customerName.includes(q) || r.title.toLowerCase().includes(q) || r.message.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.requestType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    setActionLoading(true);
    try {
      await updateRequestStatus(id, status);
      toast.success(`Request ${status}!`);
      setDetailModal(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request permanently?')) return;
    try {
      await deleteCustomerRequest(id);
      toast.success('Request deleted');
      setDetailModal(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete request');
    }
  };

  const handleApproveCustomer = async (customer: Customer) => {
    if (!business?.id) return;
    setActionLoading(true);
    try {
      await updateCustomer(customer.id, { status: 'active' });
      toast.success(`${customer.fullName} approved`);
      setDetailModal(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to approve customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCustomer = async (customer: Customer) => {
    if (!business?.id) return;
    setActionLoading(true);
    try {
      await updateCustomer(customer.id, { status: 'inactive' });
      toast.success(`${customer.fullName} rejected`);
      setDetailModal(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to reject customer');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer
      title="Customer Requests"
      description="Manage pause, skip, preference update, and other customer requests."
      actions={
        <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData}>
          Refresh
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Input
              search
              placeholder="Search by customer, title, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md w-full"
            />
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'approved', 'rejected', 'completed'].map((f) => (
                <Button
                  key={f}
                  variant={statusFilter === f ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
            {pendingCustomers.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                <UserPlus className="h-3.5 w-3.5" />
                {pendingCustomers.length} pending approvals
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', 'new_registration', 'pause_service', 'skip_meal', 'preference_update', 'general'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t !== 'all' && requestTypeIcons[t]}
                {t === 'all' ? 'All Types' : requestTypeLabels[t]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((item) => {
                if (item._type === 'registration') {
                  const c = item.data;
                  return (
                    <div
                      key={`reg-${c.id}`}
                      className="rounded-lg border border-purple-100 bg-purple-50/30 p-4 hover:bg-purple-50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedItem(item); setDetailModal(true); }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 text-purple-400 shrink-0">
                            <UserPlus className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{c.fullName}</span>
                              <Badge variant="neutral">{c.customerCode}</Badge>
                              <Badge variant="neutral">New Registration</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{c.area} &middot; {c.phone}</p>
                            {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                          </div>
                        </div>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                    </div>
                  );
                }
                const r = item.data;
                return (
                  <div
                    key={r.id}
                    className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedItem(item); setDetailModal(true); }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 text-gray-400 shrink-0">
                          {requestTypeIcons[r.requestType] || <MessageSquare className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{getCustomerName(r.customerId)}</span>
                            <Badge variant="neutral">{getCustomerCode(r.customerId)}</Badge>
                            <Badge variant="neutral">{requestTypeLabels[r.requestType] || r.requestType}</Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-800 mt-1">{r.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{r.message}</p>
                          {r.fromDate && (
                            <p className="text-xs text-gray-400 mt-1">
                              {r.requestType === 'pause_service' ? 'Pause' : 'From'}: {r.fromDate}{r.toDate ? ` → ${r.toDate}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusVariants[r.status] || 'neutral'}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p className="text-gray-600 font-medium mb-1">
                {search || typeFilter !== 'all' || statusFilter !== 'all' ? 'No requests found' : 'No requests yet'}
              </p>
              <p className="text-sm">
                {search ? 'Try a different search' : 'Customer requests will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={detailModal} onClose={() => setDetailModal(false)} title={selectedItem?._type === 'registration' ? 'New Registration' : 'Request Details'}>
        {selectedItem && selectedItem._type === 'registration' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="warning">Pending</Badge>
              <Badge variant="neutral">New Registration</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="font-medium text-gray-900">{selectedItem.data.fullName}</p>
              </div>
              <div>
                <span className="text-gray-500">Code</span>
                <p className="font-medium text-gray-900">{selectedItem.data.customerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium text-gray-900">{selectedItem.data.phone}</p>
              </div>
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium text-gray-900">{selectedItem.data.email || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Area</span>
                <p className="font-medium text-gray-900">{selectedItem.data.area}</p>
              </div>
              <div>
                <span className="text-gray-500">Address</span>
                <p className="font-medium text-gray-900">{selectedItem.data.address}</p>
              </div>
            </div>

            {selectedItem.data.specialNotes && (
              <div className="text-sm">
                <span className="text-gray-500">Special Notes</span>
                <p className="mt-1 text-gray-900 bg-gray-50 rounded-lg p-3">{selectedItem.data.specialNotes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                icon={<XCircle className="h-4 w-4" />}
                loading={actionLoading}
                onClick={() => handleRejectCustomer(selectedItem.data)}
              >
                Reject
              </Button>
              <Button
                className="flex-1"
                icon={<CheckCircle2 className="h-4 w-4" />}
                loading={actionLoading}
                onClick={() => handleApproveCustomer(selectedItem.data)}
              >
                Approve
              </Button>
            </div>
          </div>
        )}

        {selectedItem && selectedItem._type === 'request' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariants[selectedItem.data.status] || 'neutral'}>
                {selectedItem.data.status.charAt(0).toUpperCase() + selectedItem.data.status.slice(1)}
              </Badge>
              <Badge variant="neutral">
                {requestTypeLabels[selectedItem.data.requestType] || selectedItem.data.requestType}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Customer</span>
                <p className="font-medium text-gray-900">{getCustomerName(selectedItem.data.customerId)}</p>
              </div>
              <div>
                <span className="text-gray-500">Code</span>
                <p className="font-medium text-gray-900">{getCustomerCode(selectedItem.data.customerId)}</p>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">Title</span>
              <p className="mt-1 font-medium text-gray-900">{selectedItem.data.title}</p>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">Message</span>
              <p className="mt-1 text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selectedItem.data.message}</p>
            </div>

            {selectedItem.data.fromDate && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">From Date</span>
                  <p className="font-medium text-gray-900">{selectedItem.data.fromDate}</p>
                </div>
                {selectedItem.data.toDate && (
                  <div>
                    <span className="text-gray-500">To Date</span>
                    <p className="font-medium text-gray-900">{selectedItem.data.toDate}</p>
                  </div>
                )}
              </div>
            )}

            {selectedItem.data.mealType && (
              <div className="text-sm">
                <span className="text-gray-500">Meal Type</span>
                <p className="font-medium text-gray-900">{selectedItem.data.mealType}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              {selectedItem.data.createdAt && <p>Created: {selectedItem.data.createdAt}</p>}
              {selectedItem.data.updatedAt && <p>Updated: {selectedItem.data.updatedAt}</p>}
            </div>

            {selectedItem.data.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  icon={<XCircle className="h-4 w-4" />}
                  loading={actionLoading}
                  onClick={() => handleStatusChange(selectedItem.data.id, 'rejected')}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={actionLoading}
                  onClick={() => handleStatusChange(selectedItem.data.id, 'approved')}
                >
                  Approve
                </Button>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => handleDelete(selectedItem.data.id)}
              >
                Delete Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
