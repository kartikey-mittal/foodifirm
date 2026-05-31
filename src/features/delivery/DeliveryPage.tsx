import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getDeliveriesByBusiness } from '@/services/deliveryService';
import { Truck, Bike, CheckCircle, Clock, Search, Loader2 } from 'lucide-react';
import type { Delivery } from '@/types';

export function DeliveryPage() {
  const { business } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!business?.id) return;
      setLoading(true);
      try {
        const data = await getDeliveriesByBusiness(business.id);
        setDeliveries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [business?.id]);

  const delivered = deliveries.filter((d) => d.status === 'delivered').length;
  const inTransit = deliveries.filter((d) => d.status === 'in_progress').length;
  const pending = deliveries.filter((d) => d.status === 'pending').length;

  const filtered = deliveries.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.customerName || '').toLowerCase().includes(q);
  });

  return (
    <PageContainer title="Delivery Management" description="Monitor all deliveries.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Delivered" value={delivered} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="In Transit" value={inTransit} icon={<Truck className="h-5 w-5" />} />
        <StatCard title="Pending" value={pending} icon={<Clock className="h-5 w-5" />} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">All Deliveries</h3>
            <Input search placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Meal</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{d.customerName || d.customerId}</td>
                      <td className="py-3 px-3 capitalize text-gray-600">{d.mealType}</td>
                      <td className="py-3 px-3 text-gray-500">{d.deliveryDate}</td>
                      <td className="py-3 px-3">
                        <Badge variant={d.status === 'delivered' ? 'success' : d.status === 'in_progress' ? 'info' : 'warning'}>
                          {d.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Bike className="h-10 w-10 mb-2" />
              <p className="text-sm">No deliveries found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
