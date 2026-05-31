import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryAreas, createDeliveryArea, updateDeliveryArea } from '@/services/deliveryService';
import { MapPin, Plus, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DeliveryArea } from '@/types';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

export function AreasPage() {
  const { business } = useAuth();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAreas = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const data = await getDeliveryAreas(business.id);
      setAreas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAreas(); }, [business?.id]);

  const handleAdd = async () => {
    if (!areaName || !business?.id) {
      toast.error('Enter area name');
      return;
    }
    setSaving(true);
    try {
      await createDeliveryArea(business.id, areaName);
      toast.success('Area added!');
      setModalOpen(false);
      setAreaName('');
      await fetchAreas();
    } catch (err) {
      toast.error('Failed to add area');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (area: DeliveryArea) => {
    try {
      await updateDeliveryArea(area.id, { isActive: !area.isActive });
      setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, isActive: !a.isActive } : a));
      toast.success(`${area.areaName} ${area.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update area');
    }
  };

  return (
    <PageContainer
      title="Delivery Areas"
      description="Manage delivery coverage areas."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchAreas} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Area</Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : areas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Card key={area.id} hover>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{area.areaName}</h3>
                    <p className="text-sm text-gray-500">{area.customerCount || 0} customers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToggleSwitch checked={area.isActive} onChange={() => handleToggleActive(area)} />
                    <span className={`text-xs font-medium ${area.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {area.isActive ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <MapPin className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium mb-1">No delivery areas</p>
          <p className="text-sm mb-4">Add areas you deliver to</p>
          <Button onClick={() => setModalOpen(true)} icon={<Plus className="h-4 w-4" />}>Add Area</Button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Delivery Area">
        <div className="p-6 space-y-4">
          <Input label="Area Name" value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="e.g. Koramangala" />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
