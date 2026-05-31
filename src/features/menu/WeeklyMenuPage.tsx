import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { getWeeklyMenuByBusinessAndDate, createWeeklyMenu, updateWeeklyMenu, getCurrentWeekStart } from '@/services/weeklyMenuService';
import { getFoodItemsByBusiness } from '@/services/foodItemService';
import {
  Plus, ChevronLeft, ChevronRight, Coffee, UtensilsCrossed, Moon, Save,
  Loader2, Calendar, X, Search, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { WeeklyMenu, FoodItem, MenuDayItemDetail } from '@/types';

const mealSlots = ['breakfast', 'lunch', 'dinner'] as const;
const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const dayFull: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};
const shortDays: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};
const mealIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <UtensilsCrossed className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
};
const mealLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );
}

export function WeeklyMenuPage() {
  const { business } = useAuth();
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [itemSearch, setItemSearch] = useState('');

  const fetchMenu = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [menuData, items] = await Promise.all([
        getWeeklyMenuByBusinessAndDate(business.id, weekStart),
        getFoodItemsByBusiness(business.id),
      ]);
      setMenu(menuData);
      setFoodItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, [business?.id, weekStart]);

  const handleCreateMenu = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      const ref = await createWeeklyMenu(business.id, weekStart);
      const newMenu = {
        id: ref.id,
        businessId: business.id,
        weekStartDate: weekStart,
        weekEndDate: '',
        days: {
          monday: { breakfast: [], lunch: [], dinner: [] },
          tuesday: { breakfast: [], lunch: [], dinner: [] },
          wednesday: { breakfast: [], lunch: [], dinner: [] },
          thursday: { breakfast: [], lunch: [], dinner: [] },
          friday: { breakfast: [], lunch: [], dinner: [] },
          saturday: { breakfast: [], lunch: [], dinner: [] },
          sunday: { breakfast: [], lunch: [], dinner: [] },
        },
        isPublished: false,
        createdAt: null,
        updatedAt: null,
      } as any;
      setMenu(newMenu);
      toast.success('Menu created!');
    } catch (err) {
      toast.error('Failed to create menu');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoPlan = async () => {
    if (!business?.id || !menu) return;
    setSaving(true);
    try {
      const maxItems = 3;
      const breakfastItems = foodItems.filter((fi) => fi.isAvailable && fi.category === 'breakfast').slice(0, maxItems);
      const lunchItems = foodItems.filter((fi) => fi.isAvailable && (fi.category === 'lunch' || fi.category === 'breakfast')).slice(0, maxItems);
      const dinnerItems = foodItems.filter((fi) => fi.isAvailable && (fi.category === 'dinner' || fi.category === 'lunch')).slice(0, maxItems);

      const updatedDays: any = {};
      for (const day of dayNames) {
        updatedDays[day] = {
          breakfast: breakfastItems.map((fi) => ({ itemId: fi.id, itemName: fi.name, quantity: 1 })),
          lunch: lunchItems.map((fi) => ({ itemId: fi.id, itemName: fi.name, quantity: 1 })),
          dinner: dinnerItems.map((fi) => ({ itemId: fi.id, itemName: fi.name, quantity: 1 })),
        };
      }
      setMenu({ ...menu, days: updatedDays });
      toast.success('Auto-planned! Max 3 items per meal slot.');
    } catch (err) {
      toast.error('Auto-plan failed');
    } finally {
      setSaving(false);
    }
  };

  const openItemModal = (day: string, meal: string) => {
    setSelectedDay(day);
    setSelectedMeal(meal);
    setItemSearch('');
    const qty: Record<string, number> = {};
    foodItems.filter((fi) => fi.isAvailable).forEach((fi) => { qty[fi.id] = 0; });
    setItemQuantities(qty);
    setItemModalOpen(true);
  };

  const handleItemClick = (itemId: string) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: prev[itemId] > 0 ? 0 : 1,
    }));
  };

  const handleAddItems = () => {
    if (!menu || !selectedDay || !selectedMeal) return;
    const updatedDays = { ...menu.days } as any;
    if (!updatedDays[selectedDay]) updatedDays[selectedDay] = { breakfast: [], lunch: [], dinner: [] };
    const existing = [...(updatedDays[selectedDay][selectedMeal] || [])];
    const existingIds = new Set(existing.map((i: MenuDayItemDetail) => i.itemId));

    foodItems
      .filter((fi) => fi.isAvailable && itemQuantities[fi.id] > 0)
      .forEach((fi) => {
        const qty = itemQuantities[fi.id];
        if (existingIds.has(fi.id)) {
          const idx = existing.findIndex((i: MenuDayItemDetail) => i.itemId === fi.id);
          if (idx >= 0) existing[idx].quantity += qty;
        } else {
          existing.push({ itemId: fi.id, itemName: fi.name, quantity: qty });
        }
      });

    updatedDays[selectedDay] = { ...updatedDays[selectedDay], [selectedMeal]: existing };
    setMenu({ ...menu, days: updatedDays });
    setItemModalOpen(false);
  };

  const handleRemoveItem = (day: string, meal: string, itemId: string) => {
    if (!menu) return;
    const updatedDays = { ...menu.days } as any;
    const items = (updatedDays[day][meal] || []).filter((i: MenuDayItemDetail) => i.itemId !== itemId);
    updatedDays[day] = { ...updatedDays[day], [meal]: items };
    setMenu({ ...menu, days: updatedDays });
  };

  const handleUpdateQuantity = (day: string, meal: string, itemId: string, delta: number) => {
    if (!menu) return;
    const updatedDays = { ...menu.days } as any;
    const items = [...(updatedDays[day][meal] || [])];
    const idx = items.findIndex((i: MenuDayItemDetail) => i.itemId === itemId);
    if (idx >= 0) {
      const newQty = Math.max(1, items[idx].quantity + delta);
      items[idx] = { ...items[idx], quantity: newQty };
      updatedDays[day] = { ...updatedDays[day], [meal]: items };
      setMenu({ ...menu, days: updatedDays });
    }
  };

  const handleSaveMenu = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      await updateWeeklyMenu(menu.id, { days: menu.days as any });
      toast.success('Menu saved!');
    } catch (err) {
      toast.error('Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      await updateWeeklyMenu(menu.id, { isPublished: !menu.isPublished });
      setMenu({ ...menu, isPublished: !menu.isPublished });
      toast.success(menu.isPublished ? 'Menu unpublished' : 'Menu published!');
    } catch (err) {
      toast.error('Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  const changeWeek = (direction: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + direction * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const filteredItems = foodItems.filter((fi) => {
    if (!fi.isAvailable) return false;
    if (!itemSearch) return true;
    return fi.name.toLowerCase().includes(itemSearch.toLowerCase());
  });

  return (
    <PageContainer
      title="Weekly Menu"
      description="Plan your weekly meals."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => changeWeek(-1)} />
          <Button variant="outline" size="sm" icon={<Calendar className="h-4 w-4" />} className="hidden sm:inline-flex">{weekStart}</Button>
          <Button variant="outline" size="sm" icon={<ChevronRight className="h-4 w-4" />} onClick={() => changeWeek(1)} />
          {menu && (
            <>
              <Button variant="outline" size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={handleAutoPlan} className="hidden sm:inline-flex">Auto Plan</Button>
              <Button variant="outline" size="sm" onClick={handlePublishToggle} className="hidden sm:inline-flex">
                {menu.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
              <Button size="sm" icon={<Save className="h-4 w-4" />} loading={saving} onClick={handleSaveMenu}>Save</Button>
            </>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : menu ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {dayNames.map((day) => {
              const dayData = (menu.days as any)[day] || { breakfast: [], lunch: [], dinner: [] };
              return (
                <Card key={day} hover>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">{dayFull[day]}</h3>
                    <Badge variant="neutral">
                      {(dayData.breakfast?.length || 0) + (dayData.lunch?.length || 0) + (dayData.dinner?.length || 0)} items
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mealSlots.map((meal) => {
                      const items: MenuDayItemDetail[] = dayData[meal] || [];
                      return (
                        <div key={meal}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase">
                              {mealIcons[meal]}
                              <span className="hidden sm:inline">{meal}</span>
                            </div>
                            <button
                              onClick={() => openItemModal(day, meal)}
                              className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                            >
                              + Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {items.length > 0 ? items.map((item: MenuDayItemDetail) => (
                              <div key={item.itemId} className="group relative inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 pl-1.5 pr-1 py-1 text-xs">
                                <span className="inline-flex items-center justify-center bg-emerald-600 text-white font-bold rounded min-w-[20px] h-5 text-[11px] shadow-sm">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-400 font-light text-[13px]">×</span>
                                <span className="text-gray-800 font-medium truncate max-w-[100px] sm:max-w-[140px]">{item.itemName}</span>
                                <button
                                  onClick={() => handleRemoveItem(day, meal, item.itemId)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )) : (
                              <span className="text-[11px] text-gray-400 italic">No items</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Calendar className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium mb-1">No menu for this week</p>
          <p className="text-sm mb-4">Create a weekly menu to plan your meals</p>
          <Button loading={saving} onClick={handleCreateMenu} icon={<Plus className="h-4 w-4" />}>Create Weekly Menu</Button>
        </div>
      )}

      <Modal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title={`Select Items`}>
        <div className="p-5 sm:p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
            {selectedDay && selectedMeal && (
              <p className="text-xs text-gray-400 mt-2">
                Adding to <span className="font-medium text-gray-600">{dayFull[selectedDay]}</span> —{' '}
                <span className="font-medium text-gray-600">{mealLabels[selectedMeal]}</span>
              </p>
            )}
          </div>

          {filteredItems.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
              {filteredItems.map((fi) => {
                const qty = itemQuantities[fi.id] || 0;
                const selected = qty > 0;
                return (
                  <div
                    key={fi.id}
                    onClick={() => handleItemClick(fi.id)}
                    className={`flex items-center justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      selected
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`rounded-full w-2.5 h-2.5 shrink-0 ${fi.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className={`text-sm font-medium truncate ${selected ? 'text-emerald-800' : 'text-gray-900'}`}>
                        {fi.name}
                      </span>
                      <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">{fi.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setItemQuantities((prev) => ({ ...prev, [fi.id]: Math.max(0, (prev[fi.id] || 0) - 1) }))}
                        className={`rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm transition-colors ${
                          selected
                            ? 'bg-white text-emerald-600 hover:bg-emerald-100 border border-emerald-300'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        −
                      </button>
                      <span className={`w-8 text-center font-bold text-sm rounded py-0.5 ${
                        selected ? 'bg-white text-emerald-700 border border-emerald-300' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {qty}
                      </span>
                      <button
                        onClick={() => setItemQuantities((prev) => ({ ...prev, [fi.id]: (prev[fi.id] || 0) + 1 }))}
                        className={`rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm transition-colors ${
                          selected
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <UtensilsCrossed className="h-10 w-10 mb-2" />
              <p className="text-sm">{itemSearch ? 'No matching items' : 'No items available'}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setItemModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddItems} disabled={filteredItems.every((fi) => !itemQuantities[fi.id])}>
              Add to Menu
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
