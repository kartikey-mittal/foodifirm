import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getFoodItemsByBusiness, createFoodItem, updateFoodItem, toggleFoodItemAvailability } from '@/services/foodItemService';
import { Plus, Search, RefreshCw, UtensilsCrossed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { FoodItem, CreateFoodItemInput } from '@/types';

const categoryVariants: Record<string, 'info' | 'success' | 'warning' | 'neutral' | 'default'> = {
  breakfast: 'info',
  lunch: 'success',
  dinner: 'warning',
  snack: 'neutral',
  extra: 'default',
};

const defaultForm: CreateFoodItemInput = {
  name: '',
  category: 'lunch',
  description: '',
  isAvailable: true,
  isVeg: true,
};

function VegSymbol({ isVeg, size = 'sm' }: { isVeg: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 22 : size === 'md' ? 18 : 14;
  const color = isVeg ? '#16a34a' : '#dc2626';
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" fill={color} />
      {isVeg ? (
        <path d="M12 6L18 18H6L12 6Z" fill="white" />
      ) : (
        <path d="M12 6L18 18H6L12 6Z" fill="white" />
      )}
      {!isVeg && (
        <text x="12" y="16" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
          !
        </text>
      )}
    </svg>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

export function ItemsPage() {
  const { business } = useAuth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateFoodItemInput>({ ...defaultForm });

  const fetchItems = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const data = await getFoodItemsByBusiness(business.id);
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [business?.id]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setForm({ ...defaultForm });
    setModalOpen(true);
  };

  const openEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      price: item.price,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg,
    });
    setModalOpen(true);
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      await toggleFoodItemAvailability(item.id, !item.isAvailable);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
      toast.success(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`);
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const handleSave = async () => {
    if (!form.name || !business?.id) {
      toast.error('Item name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateFoodItem(editingItem.id, form);
        toast.success('Item updated!');
      } else {
        await createFoodItem(business.id, form);
        toast.success('Item added!');
      }
      setModalOpen(false);
      await fetchItems();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <PageContainer
      title="Menu Items"
      description="Manage your food items."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchItems} />
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAddModal}>Add Item</Button>
        </div>
      }
    >
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Input search placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:max-w-md" />
            <div className="flex flex-wrap gap-2">
              {['all', 'breakfast', 'lunch', 'dinner', 'snack', 'extra'].map((cat) => (
                <Button key={cat} variant={categoryFilter === cat ? 'primary' : 'outline'} size="sm" onClick={() => setCategoryFilter(cat)}>
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((item) => (
                <Card key={item.id} hover>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('rounded-lg p-2 shrink-0', item.isVeg ? 'bg-emerald-50' : 'bg-red-50')}>
                          <VegSymbol isVeg={item.isVeg} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant={categoryVariants[item.category]} size="sm">{item.category}</Badge>
                            {!item.isAvailable && <Badge variant="danger" size="sm">Unavailable</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <ToggleSwitch checked={item.isAvailable} onChange={() => handleToggleAvailability(item)} />
                        <span className="text-[10px] text-gray-400">{item.isAvailable ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <UtensilsCrossed className="h-12 w-12 mb-3" />
              <p className="text-gray-600 font-medium mb-1">{search ? 'No items found' : 'No menu items yet'}</p>
              <p className="text-sm mb-4">{search ? 'Try a different search' : 'Add your first menu item'}</p>
              {!search && <Button onClick={openAddModal} icon={<Plus className="h-4 w-4" />}>Add Item</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'}>
        <div className="p-5 sm:p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name *</label>
              <input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g., Roti, Paneer, Dal"
                className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <input
                value={form.description || ''}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Optional — e.g., Freshly made, Spicy"
                className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {['breakfast', 'lunch', 'dinner', 'snack', 'extra'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateForm('category', cat)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                      form.category === cat
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400'
                        : 'bg-gray-50 text-gray-500 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateForm('isVeg', true)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all border-2 ${
                    form.isVeg
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <VegSymbol isVeg={true} size="md" />
                  Vegetarian
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('isVeg', false)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all border-2 ${
                    !form.isVeg
                      ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <VegSymbol isVeg={false} size="md" />
                  Non-Veg
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 border-2 border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Available</p>
                <p className="text-xs text-gray-400">Show this item in weekly menu</p>
              </div>
              <ToggleSwitch checked={form.isAvailable} onChange={() => updateForm('isAvailable', !form.isAvailable)} />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{editingItem ? 'Update' : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
