import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getStaffByBusiness, createStaffMember, updateStaffMember } from '@/services/staffService';
import { Users, Plus, RefreshCw, Loader2, UserPlus, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { StaffMember, StaffType } from '@/types';

const staffTypes: StaffType[] = ['manager', 'delivery', 'kitchen', 'support', 'other'];
const staffTypeLabels: Record<StaffType, string> = {
  manager: 'Manager',
  delivery: 'Delivery',
  kitchen: 'Kitchen',
  support: 'Support',
  other: 'Other',
};

const defaultForm = { fullName: '', email: '', phone: '', staffType: 'other' as StaffType, notes: '' };

export function StaffPage() {
  const { business } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<StaffType | 'all'>('all');

  const fetchStaff = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const data = await getStaffByBusiness(business.id);
      setStaff(data);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, [business?.id]);

  const activeStaff = staff.filter((s) => s.isActive).length;

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || s.staffType === typeFilter;
    return matchesSearch && matchesType;
  });

  const openAdd = () => {
    setEditingStaff(null);
    setForm({ ...defaultForm });
    setModalOpen(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setForm({ fullName: s.fullName, email: s.email, phone: s.phone, staffType: s.staffType, notes: s.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !business?.id) {
      toast.error('Full name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingStaff) {
        await updateStaffMember(editingStaff.id, {
          fullName: form.fullName, email: form.email, phone: form.phone,
          staffType: form.staffType, notes: form.notes,
        });
        toast.success('Staff member updated!');
        setModalOpen(false);
      } else {
        await createStaffMember(business.id, form);
        toast.success('Staff member added!');
        setModalOpen(false);
      }
      await fetchStaff();
    } catch {
      toast.error('Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    try {
      await updateStaffMember(member.id, { isActive: !member.isActive });
      toast.success(`Staff member ${member.isActive ? 'deactivated' : 'activated'}!`);
      await fetchStaff();
    } catch {
      toast.error('Failed to update staff member');
    }
  };

  const badgeVariant = (type: StaffType) => {
    const map: Record<StaffType, 'default' | 'success' | 'warning' | 'info' | 'neutral'> = {
      manager: 'default',
      delivery: 'info',
      kitchen: 'warning',
      support: 'success',
      other: 'neutral',
    };
    return map[type];
  };

  return (
    <PageContainer
      title="Staff Management"
      description="Manage your team members and their roles"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchStaff} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Staff</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Staff" value={staff.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Active" value={activeStaff} icon={<UserPlus className="h-5 w-5" />} />
        <StatCard title="Inactive" value={staff.length - activeStaff} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            search
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={typeFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          {staffTypes.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {staffTypeLabels[type]}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <Card key={member.id} hover>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.fullName} size="md" />
                    <div>
                      <h3 className="font-medium text-gray-900">{member.fullName}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.isActive ? 'success' : 'neutral'} size="sm">
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={badgeVariant(member.staffType)} size="sm">
                    {staffTypeLabels[member.staffType]}
                  </Badge>
                </div>
                {member.phone && (
                  <p className="mt-2 text-sm text-gray-500">{member.phone}</p>
                )}
                {member.notes && (
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">{member.notes}</p>
                )}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(member)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    icon={member.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    onClick={() => toggleActive(member)}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Users className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium mb-1">
            {staff.length === 0 ? 'No staff added yet' : 'No staff match your search'}
          </p>
          <p className="text-sm mb-4">
            {staff.length === 0 ? 'Add team members to manage your business' : 'Try adjusting your filters'}
          </p>
          {staff.length === 0 && (
            <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add Staff</Button>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}>
        <div className="p-6 space-y-4">
          <Input label="Full Name *" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Staff Type</label>
            <select
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={form.staffType}
              onChange={(e) => setForm((f) => ({ ...f, staffType: e.target.value as StaffType }))}
            >
              {staffTypes.map((type) => (
                <option key={type} value={type}>{staffTypeLabels[type]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editingStaff ? 'Update' : 'Add Staff'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
