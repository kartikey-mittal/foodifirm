import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { createFoodItem, getFoodItemsByBusiness } from '@/services/foodItemService';
import { createCustomer, getCustomersByBusiness, updateCustomer, deleteCustomer } from '@/services/customerService';
import { createDeliveryArea } from '@/services/deliveryService';
import { createWeeklyMenu, updateWeeklyMenu } from '@/services/weeklyMenuService';
import {
  Loader2, CheckCircle2, XCircle, Plus, UtensilsCrossed,
  Users, MapPin, Database, FlaskConical, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

type OpStatus = 'idle' | 'running' | 'done' | 'error';

interface OpResult {
  label: string;
  status: OpStatus;
  message?: string;
  count?: number;
}

const sampleItems = [
  { name: 'Roti (Phulka)', category: 'breakfast' as const, isVeg: true },
  { name: 'Chapati', category: 'lunch' as const, isVeg: true },
  { name: 'Paratha (Aloo)', category: 'breakfast' as const, isVeg: true },
  { name: 'Paratha (Paneer)', category: 'breakfast' as const, isVeg: true },
  { name: 'Poori Bhaji', category: 'breakfast' as const, isVeg: true },
  { name: 'Rice (Steamed)', category: 'lunch' as const, isVeg: true },
  { name: 'Dal Tadka', category: 'lunch' as const, isVeg: true },
  { name: 'Paneer Butter Masala', category: 'lunch' as const, isVeg: true },
  { name: 'Mix Veg', category: 'lunch' as const, isVeg: true },
  { name: 'Dal Makhani', category: 'lunch' as const, isVeg: true },
  { name: 'Chole', category: 'lunch' as const, isVeg: true },
  { name: 'Rajma', category: 'lunch' as const, isVeg: true },
  { name: 'Kadhai Paneer', category: 'dinner' as const, isVeg: true },
  { name: 'Butter Chicken', category: 'dinner' as const, isVeg: false },
  { name: 'Chicken Curry', category: 'dinner' as const, isVeg: false },
  { name: 'Biryani (Veg)', category: 'lunch' as const, isVeg: true },
  { name: 'Biryani (Chicken)', category: 'lunch' as const, isVeg: false },
  { name: 'Raita', category: 'lunch' as const, isVeg: true },
  { name: 'Salad', category: 'lunch' as const, isVeg: true },
  { name: 'Papad', category: 'lunch' as const, isVeg: true },
  { name: 'Gulab Jamun', category: 'extra' as const, isVeg: true },
  { name: 'Kheer', category: 'extra' as const, isVeg: true },
  { name: 'Naan (Butter)', category: 'dinner' as const, isVeg: true },
  { name: 'Tandoori Roti', category: 'dinner' as const, isVeg: true },
  { name: 'Jeera Rice', category: 'dinner' as const, isVeg: true },
];

export function DataToolsPage() {
  const { business } = useAuth();
  const [results, setResults] = useState<OpResult[]>([]);
  const [runningOps, setRunningOps] = useState<Set<string>>(new Set());

  const [customItemName, setCustomItemName] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'extra'>('lunch');
  const [customItemVeg, setCustomItemVeg] = useState(true);
  const [addingCustom, setAddingCustom] = useState(false);

  const addResult = (label: string, status: OpStatus, message?: string, count?: number) => {
    setResults((prev) => [{ label, status, message, count }, ...prev]);
  };

  const runOp = async (label: string, op: () => Promise<any>) => {
    setRunningOps((prev) => new Set(prev).add(label));
    addResult(label, 'running');
    try {
      const result = await op();
      const count = result?.count ?? result?.length ?? 1;
      addResult(label, 'done', undefined, count);
      return result;
    } catch (err: any) {
      addResult(label, 'error', err.message);
      return null;
    } finally {
      setRunningOps((prev) => { const next = new Set(prev); next.delete(label); return next; });
    }
  };

  const handleAddSampleItems = async () => {
    if (!business?.id) return;
    await runOp('Add Sample Items (25)', async () => {
      let count = 0;
      for (const item of sampleItems) {
        await createFoodItem(business.id, { ...item, isAvailable: true });
        count++;
      }
      return { count };
    });
  };

  const handleAddCustomItem = async () => {
    if (!business?.id || !customItemName.trim()) return;
    setAddingCustom(true);
    try {
      await createFoodItem(business.id, {
        name: customItemName.trim(),
        category: customItemCategory,
        isVeg: customItemVeg,
        isAvailable: true,
      });
      toast.success(`"${customItemName.trim()}" added!`);
      setCustomItemName('');
    } catch (err) {
      toast.error('Failed to add item');
    } finally {
      setAddingCustom(false);
    }
  };

  const handleAddAreas = async () => {
    if (!business?.id) return;
    const areas = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'JP Nagar', 'BTM Layout', 'Marathahalli', 'Electronic City', 'Jayanagar', 'Malleshwaram'];
    await runOp('Add Delivery Areas (10)', async () => {
      let count = 0;
      for (const area of areas) {
        await createDeliveryArea(business.id, area);
        count++;
      }
      return { count };
    });
  };

  const handleCleanupCustomers = async () => {
    if (!business?.id) return;
    await runOp('Clean Up Old Test Customers', async () => {
      const customers = await getCustomersByBusiness(business.id);
      const bad = customers.filter((c) => !c.userId);
      let count = 0;
      for (const c of bad) {
        await updateCustomer(c.id, { userId: '' });
        count++;
      }
      return { count };
    });
  };

  const handleDeleteAllTestCustomers = async () => {
    if (!business?.id) return;
    await runOp('Delete All Test Customers', async () => {
      const customers = await getCustomersByBusiness(business.id);
      const test = customers.filter((c) => !c.userId);
      let count = 0;
      for (const c of test) {
        await deleteCustomer(c.id);
        count++;
      }
      return { count };
    });
  };

  const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const handleAutoPlanMenu = async () => {
    if (!business?.id) return;
    await runOp('Auto Plan Weekly Menu', async () => {
      const items = await getFoodItemsByBusiness(business.id);
      const maxItems = 3;
      const breakfast = items.filter((i) => i.isAvailable && i.category === 'breakfast').slice(0, maxItems).map((i) => ({ itemId: i.id, itemName: i.name, quantity: 1 }));
      const lunch = items.filter((i) => i.isAvailable && (i.category === 'lunch' || i.category === 'breakfast')).slice(0, maxItems).map((i) => ({ itemId: i.id, itemName: i.name, quantity: 1 }));
      const dinner = items.filter((i) => i.isAvailable && (i.category === 'dinner' || i.category === 'lunch')).slice(0, maxItems).map((i) => ({ itemId: i.id, itemName: i.name, quantity: 1 }));

      const weekStart = getWeekStart();
      const ref = await createWeeklyMenu(business.id, weekStart);
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayData: any = {};
      for (const day of days) {
        dayData[day] = { breakfast: [...breakfast], lunch: [...lunch], dinner: [...dinner] };
      }
      await updateWeeklyMenu(ref.id, { days: dayData } as any);
      return { count: items.length };
    });
  };

  const handleAddCustomers = async () => {
    if (!business?.id) return;
    await runOp('Add Sample Customers (3)', async () => {
      const customers = [
        { fullName: 'Rahul Sharma', email: 'rahul@test.com', phone: '+91 98765 43210', address: '123, 1st Main', area: 'Koramangala', userId: '', weekendServiceRequired: false, status: 'active' as const, subscriptionStatus: 'active' as const, paymentStatus: 'paid' as const },
        { fullName: 'Priya Patel', email: 'priya@test.com', phone: '+91 98765 43211', address: '456, 2nd Cross', area: 'Indiranagar', userId: '', weekendServiceRequired: false, status: 'active' as const, subscriptionStatus: 'active' as const, paymentStatus: 'paid' as const },
        { fullName: 'Amit Singh', email: 'amit@test.com', phone: '+91 98765 43212', address: '789, 3rd Block', area: 'Whitefield', userId: '', weekendServiceRequired: false, status: 'pending_approval' as const, subscriptionStatus: 'none' as const, paymentStatus: 'pending' as const },
      ];
      let count = 0;
      for (const c of customers) {
        await createCustomer(business.id, c);
        count++;
      }
      return { count };
    });
  };

  return (
    <PageContainer
      title="Data Tools"
      description="Quickly seed and test data for your business."
      actions={
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-emerald-600" />
          <Badge variant="info">Test Mode</Badge>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Operations */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                icon={<UtensilsCrossed className="h-5 w-5 text-emerald-600" />}
                loading={runningOps.has('Add Sample Items (25)')}
                onClick={handleAddSampleItems}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold">Add 25 Sample Items</p>
                  <p className="text-xs text-gray-400">Common Indian dishes — roti, paneer, biryani, etc.</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                icon={<MapPin className="h-5 w-5 text-emerald-600" />}
                loading={runningOps.has('Add Delivery Areas (10)')}
                onClick={handleAddAreas}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold">Add 10 Delivery Areas</p>
                  <p className="text-xs text-gray-400">Bangalore areas — Koramangala, Indiranagar, etc.</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                icon={<Users className="h-5 w-5 text-emerald-600" />}
                loading={runningOps.has('Add Sample Customers (3)')}
                onClick={handleAddCustomers}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold">Add 3 Sample Customers</p>
                  <p className="text-xs text-gray-400">2 active + 1 pending approval</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                icon={<Database className="h-5 w-5 text-amber-600" />}
                loading={runningOps.has('Clean Up Old Test Customers')}
                onClick={handleCleanupCustomers}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold">Clean Up Old Test Customers</p>
                  <p className="text-xs text-gray-400">Find customers missing userId — delete or set empty</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3 !border-red-200 hover:!border-red-300"
                icon={<XCircle className="h-5 w-5 text-red-600" />}
                loading={runningOps.has('Delete All Test Customers')}
                onClick={handleDeleteAllTestCustomers}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-700">Delete All Test Customers</p>
                  <p className="text-xs text-gray-400">Permanently delete all customers without a userId</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                icon={<Sparkles className="h-5 w-5 text-purple-600" />}
                loading={runningOps.has('Auto Plan Weekly Menu')}
                onClick={handleAutoPlanMenu}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold">Auto Plan Weekly Menu</p>
                  <p className="text-xs text-gray-400">Create a 7-day menu from your existing items by category</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Add Item */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Quick Add Item</h2>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Item name — e.g., Gobi Sabzi"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                  />
                </div>
                <select
                  value={customItemCategory}
                  onChange={(e) => setCustomItemCategory(e.target.value as any)}
                  className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="extra">Extra</option>
                </select>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomItemVeg(!customItemVeg)}
                    className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-all border-2 ${
                      customItemVeg
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {customItemVeg ? 'Veg' : 'Non-Veg'}
                  </button>
                  <Button loading={addingCustom} onClick={handleAddCustomItem} icon={<Plus className="h-4 w-4" />}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ask me to do work */}
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <FlaskConical className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-800">Need more data?</h3>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Just tell me what you need — "add 5 dinner items", "create 2 customers with subscriptions", etc. I'll do it for you!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Results log */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Operation Log</h2>
              <Badge variant="neutral">{results.length} ops</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {results.length > 0 ? (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      {r.status === 'running' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500 mt-0.5 shrink-0" />
                      ) : r.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : r.status === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{r.label}</p>
                        {r.status === 'done' && r.count && (
                          <p className="text-xs text-emerald-600">{r.count} items created</p>
                        )}
                        {r.status === 'error' && (
                          <p className="text-xs text-red-500">{r.message || 'Failed'}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <Database className="h-8 w-8 mb-2" />
                  <p className="text-sm">No operations yet</p>
                  <p className="text-xs">Run an operation to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
