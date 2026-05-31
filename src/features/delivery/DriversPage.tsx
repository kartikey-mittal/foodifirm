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
import { getDriversByBusiness, createDriver, updateDriver, getDeliveryAreas } from '@/services/deliveryService';
import { Bike, Users, Plus, RefreshCw, Loader2, Key, Copy, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Driver, DeliveryArea } from '@/types';

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `DRV-${code}`;
}

const defaultForm = { driverName: '', phone: '', email: '', accessCode: '' };

export function DriversPage() {
  const { business } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ name: string; phone: string; code: string } | null>(null);

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [d, a] = await Promise.all([
        getDriversByBusiness(business.id),
        getDeliveryAreas(business.id),
      ]);
      setDrivers(d);
      setAreas(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const activeDrivers = drivers.filter((d) => d.isActive).length;

  const toggleArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  };

  const openAdd = () => {
    setEditingDriver(null);
    setForm({ driverName: '', phone: '', email: '', accessCode: generateAccessCode() });
    setSelectedAreas([]);
    setCreatedInfo(null);
    setModalOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditingDriver(d);
    setForm({ driverName: d.driverName, phone: d.phone, email: d.email || '', accessCode: d.accessCode || '' });
    setSelectedAreas(d.assignedAreas || []);
    setCreatedInfo(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.driverName || !form.phone || !form.accessCode || !business?.id) {
      toast.error('Name, phone, and access code are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { driverName: form.driverName, phone: form.phone, email: form.email, accessCode: form.accessCode, assignedAreas: selectedAreas };
      if (editingDriver) {
        await updateDriver(editingDriver.id, payload);
        toast.success('Driver updated!');
        setModalOpen(false);
      } else {
        await createDriver(business.id, payload);
        setCreatedInfo({ name: form.driverName, phone: form.phone, code: form.accessCode });
        toast.success('Driver added!');
      }
      await fetchData();
    } catch (err) {
      toast.error('Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (driver: Driver) => {
    try {
      await updateDriver(driver.id, { isActive: !driver.isActive });
      toast.success(`Driver ${driver.isActive ? 'deactivated' : 'activated'}!`);
      await fetchData();
    } catch (err) {
      toast.error('Failed to update driver');
    }
  };

  const getAreaNames = (areaIds?: string[]) =>
    areaIds?.map((id) => areas.find((a) => a.id === id)?.areaName).filter(Boolean).join(', ') || '—';

  return (
    <PageContainer
      title="Delivery Drivers"
      description="Add drivers with an access code. Drivers login at /store/:storeId/driver using phone + access code."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Driver</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Drivers" value={drivers.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Active" value={activeDrivers} icon={<Bike className="h-5 w-5" />} />
        <StatCard title="Inactive" value={drivers.length - activeDrivers} icon={<Users className="h-5 w-5" />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : drivers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <Card key={driver.id} hover>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={driver.driverName} size="md" />
                    <div>
                      <h3 className="font-medium text-gray-900">{driver.driverName}</h3>
                      <p className="text-sm text-gray-500">{driver.phone}</p>
                    </div>
                  </div>
                  <Badge variant={driver.isActive ? 'success' : 'neutral'} size="sm">
                    {driver.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Key className="h-3 w-3 text-gray-400" />
                  <span className="font-mono text-gray-500">{driver.accessCode || '—'}</span>
                </div>
                {driver.assignedAreas && driver.assignedAreas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {driver.assignedAreas.map((aid) => {
                      const area = areas.find((a) => a.id === aid);
                      return area ? (
                        <Badge key={aid} variant="info" size="sm">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          {area.areaName}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(driver)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleActive(driver)}
                  >
                    {driver.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Bike className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium mb-1">No drivers added yet</p>
          <p className="text-sm mb-4">Add drivers to manage deliveries</p>
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add Driver</Button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDriver ? 'Edit Driver' : 'Add Driver'}>
        <div className="p-6 space-y-4">
          {createdInfo ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm">
                <p className="font-semibold text-emerald-800 mb-2">Driver added successfully!</p>
                <div className="mt-3 bg-white rounded p-3 space-y-1">
                  <p><span className="text-gray-500">Name:</span> {createdInfo.name}</p>
                  <p><span className="text-gray-500">Phone:</span> {createdInfo.phone}</p>
                  <p><span className="text-gray-500">Access Code:</span> <span className="font-mono font-bold text-emerald-700">{createdInfo.code}</span></p>
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  Share this access code with the driver.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" icon={<Copy className="h-4 w-4" />} onClick={() => { navigator.clipboard.writeText(`Phone: ${createdInfo.phone}\nCode: ${createdInfo.code}`); toast.success('Copied!'); }}>
                  Copy Info
                </Button>
                <Button className="flex-1" onClick={() => setModalOpen(false)}>Done</Button>
              </div>
            </div>
          ) : (
            <>
              <Input label="Driver Name *" value={form.driverName} onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))} />
              <Input label="Phone *" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="optional" />
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Code *</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono">
                      {form.accessCode}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setForm((f) => ({ ...f, accessCode: generateAccessCode() }));
                      toast.success('New code generated');
                    }}>
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Driver uses phone + this code to login</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Areas</label>
                  <p className="text-xs text-gray-400 mb-2">Select which areas this driver will cover. They'll only see orders from these areas.</p>
                  {areas.filter((a) => a.isActive).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {areas.filter((a) => a.isActive).map((area) => {
                        const isSelected = selectedAreas.includes(area.id);
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => toggleArea(area.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border-2 ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {area.areaName}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No active areas found. Add areas first.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button className="flex-1" loading={saving} onClick={handleSave}>
                  {editingDriver ? 'Update Driver' : 'Add Driver'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
}
