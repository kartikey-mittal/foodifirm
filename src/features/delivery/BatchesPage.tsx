import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryBatchesByBusiness, createDeliveryBatch, updateDeliveryBatch, getDeliveryAreas } from '@/services/deliveryService';
import { Layers, Plus, RefreshCw, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DeliveryBatch, DeliveryArea, BatchStatus } from '@/types';

const statusColors: Record<string, 'info' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  planned: 'info',
  assigned: 'warning',
  in_progress: 'info',
  completed: 'success',
  hold: 'danger',
};

export function BatchesPage() {
  const { business } = useAuth();
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ batchName: '', areaId: '', deliveryTime: '', routeNote: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [b, a] = await Promise.all([
        getDeliveryBatchesByBusiness(business.id),
        getDeliveryAreas(business.id),
      ]);
      setBatches(b);
      setAreas(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const openAdd = () => {
    setForm({ batchName: '', areaId: '', deliveryTime: '', routeNote: '' });
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!form.batchName || !business?.id) {
      toast.error('Batch name is required');
      return;
    }
    setSaving(true);
    try {
      await createDeliveryBatch(business.id, {
        batchName: form.batchName,
        areaId: form.areaId,
        deliveryTime: form.deliveryTime,
        routeNote: form.routeNote,
      });
      toast.success('Batch created!');
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to create batch');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHold = async (batch: DeliveryBatch) => {
    const newStatus: BatchStatus = batch.status === 'hold' ? 'planned' : 'hold';
    try {
      await updateDeliveryBatch(batch.id, { status: newStatus });
      setBatches((prev) => prev.map((b) => b.id === batch.id ? { ...b, status: newStatus } : b));
      toast.success(`Batch ${newStatus === 'hold' ? 'on hold' : 'released'}`);
    } catch (err) {
      toast.error('Failed to update batch');
    }
  };

  const getAreaName = (areaId: string) => areas.find((a) => a.id === areaId)?.areaName || '—';

  return (
    <PageContainer
      title="Delivery Batches"
      description="Manage delivery batches."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Create Batch</Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : batches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <Card key={batch.id} hover>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${
                      batch.status === 'hold' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{batch.batchName}</h3>
                      {batch.areaId && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {getAreaName(batch.areaId)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusColors[batch.status] || 'neutral'}>
                    {batch.status === 'hold' ? 'On Hold' : batch.status.replace('_', ' ')}
                  </Badge>
                </div>
                {batch.deliveryTime && (
                  <p className="text-sm text-gray-600 mt-2">🕐 {batch.deliveryTime}</p>
                )}
                {batch.routeNote && (
                  <p className="text-xs text-gray-400 mt-1">{batch.routeNote}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{batch.customerIds?.length || 0} customers</span>
                  <Button
                    variant={batch.status === 'hold' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleHold(batch)}
                  >
                    {batch.status === 'hold' ? 'Release' : 'Hold'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Layers className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium mb-1">No batches created yet</p>
          <p className="text-sm mb-4">Create delivery batches to organize deliveries</p>
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Create Batch</Button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Delivery Batch">
        <div className="p-6 space-y-4">
          <Input label="Batch Name *" value={form.batchName} onChange={(e) => setForm((f) => ({ ...f, batchName: e.target.value }))} placeholder="e.g. Morning Route A" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Area</label>
            <select value={form.areaId} onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Select area (optional)</option>
              {areas.filter((a) => a.isActive).map((a) => (
                <option key={a.id} value={a.id}>{a.areaName}</option>
              ))}
            </select>
          </div>
          <Input label="Delivery Time" type="time" value={form.deliveryTime} onChange={(e) => setForm((f) => ({ ...f, deliveryTime: e.target.value }))} />
          <Input label="Route Note" value={form.routeNote} onChange={(e) => setForm((f) => ({ ...f, routeNote: e.target.value }))} placeholder="Optional notes" />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
