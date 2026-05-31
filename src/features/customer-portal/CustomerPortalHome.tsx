import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { getCustomerByUserId, getCustomerById, getCustomersByBusiness, updateCustomer } from '@/services/customerService';
import { updateUserProfile } from '@/services/userService';
import { getActiveSubscriptionByCustomer } from '@/services/subscriptionService';
import { getInvoicesByCustomer } from '@/services/invoiceService';
import { getLatestWeeklyMenu } from '@/services/weeklyMenuService';
import { getDailyMealOrders } from '@/services/dailyMealOrderService';
import { getDeliveryAreas } from '@/services/deliveryService';
import { getServicePausesByCustomer } from '@/services/servicePauseService';
import { getRequestsByCustomer, createCustomerRequest } from '@/services/customerRequestService';
import { addMoneyToWallet, getWalletTransactions } from '@/services/walletService';
import {
  Coffee, UtensilsCrossed, Moon, ChefHat, CreditCard, Calendar,
  PauseCircle, SkipForward, FileText, Settings, Menu,
  CheckCircle, AlertTriangle, LogOut, Loader2, User, Home,
  ClipboardList, IndianRupee, X, Clock, CalendarDays, ChevronLeft, ChevronRight,
  MapPin, Pencil, Wallet, Plus,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type {
  Customer, Subscription, Invoice, WeeklyMenu, DailyMealOrder,
  ServicePause, CustomerRequest, DeliveryArea, MenuDayItemDetail, WalletTransaction,
} from '@/types';

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

const mealPlanLabels: Record<string, string> = {
  breakfast: 'Breakfast Only',
  lunch: 'Lunch Only',
  dinner: 'Dinner Only',
  breakfast_lunch: 'Breakfast + Lunch',
  lunch_dinner: 'Lunch + Dinner',
  all_meals: 'All Meals',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  scheduled: 'info',
  preparing: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  skipped: 'neutral',
  paused: 'warning',
  cancelled: 'danger',
  failed: 'danger',
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  partial: 'info',
  active: 'success',
  expired: 'danger',
  completed: 'success',
  approved: 'success',
  rejected: 'danger',
};

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayFull: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

type Tab = 'home' | 'menu' | 'requests' | 'payments' | 'profile';

export function CustomerPortalHome() {
  const { appUser, logout } = useAuth();
  const { business, businessId, storeId } = useStore();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [mealOrders, setMealOrders] = useState<DailyMealOrder[]>([]);
  const [servicePauses, setServicePauses] = useState<ServicePause[]>([]);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentViewDate, setCurrentViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewOrders, setViewOrders] = useState<DailyMealOrder[]>([]);

  const [skipModal, setSkipModal] = useState(false);
  const [pauseModal, setPauseModal] = useState(false);
  const [prefModal, setPrefModal] = useState(false);
  const [menuModal, setMenuModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);

  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', address: '', area: '', landmark: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [skipDate, setSkipDate] = useState('');
  const [skipMealType, setSkipMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [skipReason, setSkipReason] = useState('');
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [prefMealPreference, setPrefMealPreference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [addMoneyModal, setAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState(0);
  const [walletTxns, setWalletTxns] = useState<WalletTransaction[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayName = dayFull[dayNames[new Date().getDay()]];

  useEffect(() => {
    const fetchData = async () => {
      if (!appUser?.uid || !businessId) return;
      try {
        let cust = null;

        // Try by customerId (fastest, most reliable)
        if (appUser.customerId) {
          cust = await getCustomerById(appUser.customerId);
        }

        // Fallback: try by userId (for users who registered before customerId was saved)
        if (!cust) {
          cust = await getCustomerByUserId(appUser.uid);
          if (cust && appUser.customerId !== cust.id) {
            updateUserProfile(appUser.uid, { customerId: cust.id });
          }
        }

        // Final fallback: try by email
        if (!cust && appUser.email) {
          const all = await getCustomersByBusiness(businessId);
          cust = all.find((c) => c.email === appUser.email) || null;
          if (cust) {
            updateUserProfile(appUser.uid, { customerId: cust.id });
          }
        }

        setCustomer(cust);

        const [a] = await Promise.all([
          getDeliveryAreas(businessId),
        ]);
        setAreas(a.filter((ar) => ar.isActive));

        if (cust) {
          const [
            sub, inv, menu, orders, pauses, reqs, txns,
          ] = await Promise.all([
            getActiveSubscriptionByCustomer(cust.id),
            getInvoicesByCustomer(cust.id),
            getLatestWeeklyMenu(businessId),
            getDailyMealOrders(businessId, todayStr),
            getServicePausesByCustomer(cust.id),
            getRequestsByCustomer(cust.id),
            getWalletTransactions(cust.id),
          ]);

          if (sub) setSubscription(sub);
          setInvoices(inv);
          if (menu) setWeeklyMenu(menu);
          setMealOrders(orders.filter((o) => o.customerId === cust.id));
          setServicePauses(pauses);
          setRequests(reqs);
          setWalletTxns(txns);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appUser?.uid, businessId, todayStr]);

  useEffect(() => {
    const fetchViewOrders = async () => {
      if (!businessId || !customer) return;
      try {
        const orders = await getDailyMealOrders(businessId, currentViewDate);
        setViewOrders(orders.filter((o) => o.customerId === customer.id));
      } catch (err) {
        console.error(err);
      }
    };
    fetchViewOrders();
  }, [businessId, customer, currentViewDate]);

  const handleLogout = async () => {
    await logout();
    navigate(`/store/${storeId}/customer-login`);
  };

  const getDaysRemaining = (endDate: any): number => {
    if (!endDate) return 0;
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const diff = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const toDate = (val: any): Date =>
    val?.toDate ? val.toDate() : new Date(val);

  const activePause = servicePauses.find(
    (p) => p.status === 'active' && p.fromDate <= todayStr && p.toDate >= todayStr,
  );

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const handleSkipMeal = async () => {
    if (!customer || !business || !appUser) return;
    setSubmitting(true);
    try {
      await createCustomerRequest(businessId!, storeId, customer.id, appUser.uid, {
        requestType: 'skip_meal',
        title: `Skip ${mealLabels[skipMealType]} on ${skipDate}`,
        message: skipReason || 'No reason provided',
        mealType: skipMealType,
        fromDate: skipDate,
        toDate: skipDate,
      });
      setSkipModal(false);
      setSkipDate('');
      setSkipReason('');
      const reqs = await getRequestsByCustomer(customer.id);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePauseService = async () => {
    if (!customer || !business || !appUser) return;
    setSubmitting(true);
    try {
      await createCustomerRequest(businessId!, storeId, customer.id, appUser.uid, {
        requestType: 'pause_service',
        title: `Pause service from ${pauseFrom} to ${pauseTo}`,
        message: pauseReason || 'No reason provided',
        fromDate: pauseFrom,
        toDate: pauseTo,
      });
      setPauseModal(false);
      setPauseFrom('');
      setPauseTo('');
      setPauseReason('');
      const reqs = await getRequestsByCustomer(customer.id);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!customer || !business || !appUser) return;
    setSubmitting(true);
    try {
      await createCustomerRequest(businessId!, storeId, customer.id, appUser.uid, {
        requestType: 'preference_update',
        title: 'Update meal preferences',
        message: `New preference: ${prefMealPreference}`,
        metadata: { mealPreference: prefMealPreference },
      });
      setPrefModal(false);
      setPrefMealPreference('');
      const reqs = await getRequestsByCustomer(customer.id);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const orderedMealTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];

  const handleAddMoney = async () => {
    if (!customer || !businessId || addMoneyAmount <= 0) return;
    setSubmitting(true);
    try {
      await addMoneyToWallet(businessId, customer.id, addMoneyAmount, 'UPI');
      setAddMoneyModal(false);
      setAddMoneyAmount(0);
      setCustomer((prev) => prev
        ? { ...prev, walletBalance: (prev.walletBalance || 0) + addMoneyAmount }
        : prev);
      try {
        const updatedTxns = await getWalletTransactions(customer.id);
        setWalletTxns(updatedTxns);
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {business?.businessName || 'FoodiFirm'}
              </span>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center py-20 text-gray-400">
            <User className="h-16 w-16 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Welcome to FoodiFirm!</h2>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              Your profile is being set up. Please contact your restaurant manager to activate
              your subscription and start enjoying fresh, homemade meals!
            </p>
            <Badge variant="info" size="md">Pending activation</Badge>
          </div>
        </main>
      </div>
    );
  }

  const renderHomeTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xl">👋</span>
        <h1 className="text-lg font-bold text-gray-900">{customer.fullName}</h1>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                const d = new Date(currentViewDate);
                d.setDate(d.getDate() - 1);
                setCurrentViewDate(d.toISOString().split('T')[0]);
              }}
              className="rounded-lg p-2 hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-gray-900">
                {currentViewDate === todayStr ? "Today's Meals" : formatDate(currentViewDate)}
              </h2>
              <Badge variant="neutral" size="sm" className="mt-0.5">
                {dayFull[dayNames[new Date(currentViewDate).getDay()]]}
              </Badge>
            </div>
            <button
              onClick={() => {
                const d = new Date(currentViewDate);
                d.setDate(d.getDate() + 1);
                setCurrentViewDate(d.toISOString().split('T')[0]);
              }}
              className="rounded-lg p-2 hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {viewOrders.length === 0 && currentViewDate !== todayStr && (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <UtensilsCrossed className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium text-gray-500">No meal served</p>
              <p className="text-xs">No orders for this day</p>
            </div>
          )}

          {viewOrders.length === 0 && currentViewDate === todayStr && !loading && (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <UtensilsCrossed className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium text-gray-500">No meals scheduled for today</p>
              <p className="text-xs">Your subscription meals will appear here</p>
            </div>
          )}

          {viewOrders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {orderedMealTypes.map((meal) => {
                const order = viewOrders.find((o) => o.mealType === meal);
                const viewDateMenu = weeklyMenu?.days
                  ? weeklyMenu.days[dayNames[new Date(currentViewDate).getDay()] as keyof typeof weeklyMenu.days]
                  : null;
                const menuItems = viewDateMenu?.[meal] || [];
                return (
                  <div
                    key={meal}
                    className={`rounded-xl p-4 ${
                      order?.status === 'delivered'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : order?.status === 'out_for_delivery'
                        ? 'bg-blue-50 border border-blue-200'
                        : order?.status === 'skipped'
                        ? 'bg-gray-50 border border-gray-200'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        {mealIcons[meal]}
                        <span className="text-xs font-semibold text-gray-800">{mealLabels[meal]}</span>
                      </div>
                      {order && (
                        <Badge variant={statusColors[order.status] || 'neutral'} size="sm">
                          {order.status === 'out_for_delivery' ? 'Out for Delivery' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                    {menuItems.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {menuItems.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full w-1.5 h-1.5 bg-emerald-400 shrink-0" />
                              <span className="text-gray-700">{item.itemName || item}</span>
                            </div>
                            {item.quantity && (
                              <span className="font-bold text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5 text-[10px]">
                                x{item.quantity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {!order && menuItems.length === 0 && (
                      <p className="text-[11px] text-gray-400 italic mt-1">Not planned</p>
                    )}
                    {!order && menuItems.length > 0 && (
                      <p className="text-[11px] text-gray-400 italic mt-1">Scheduled</p>
                    )}
                    {order?.['items'] && (order as any).items.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate">
                        {(order as any).items.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {activePause && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 mt-0.5">
                <PauseCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Service Paused</h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your service is paused from {formatDate(activePause.fromDate)} to{' '}
                  {formatDate(activePause.toDate)}.
                </p>
                {activePause.reason && (
                  <p className="text-xs text-amber-600 mt-1">Reason: {activePause.reason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="h-4 w-4 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">Active Subscription</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs text-emerald-600 font-medium">Plan</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{subscription.planName}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-600 font-medium">Meal Plan</p>
                <p className="text-sm font-bold text-blue-700 mt-0.5">
                  {mealPlanLabels[subscription.mealPlan] || subscription.mealPlan}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-600 font-medium">Amount</p>
                <p className="text-sm font-bold text-amber-700 mt-0.5">
                  {formatCurrency(subscription.totalAmount)}/mo
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                <p className="text-xs text-purple-600 font-medium">Days Remaining</p>
                <p className="text-sm font-bold text-purple-700 mt-0.5">
                  {getDaysRemaining(subscription.endDate)} days
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={statusColors[subscription.status] || 'neutral'} size="md">
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setSkipModal(true)}
        >
          <SkipForward className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-medium">Skip Meal</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setPauseModal(true)}
        >
          <PauseCircle className="h-5 w-5 text-amber-600" />
          <span className="text-xs font-medium">Pause Service</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setPrefModal(true)}
        >
          <Settings className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-medium">Preferences</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setMenuModal(true)}
        >
          <Menu className="h-5 w-5 text-purple-600" />
          <span className="text-xs font-medium">Weekly Menu</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setInvoiceModal(true)}
        >
          <IndianRupee className="h-5 w-5 text-green-600" />
          <span className="text-xs font-medium">Payments</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setRequestModal(true)}
        >
          <ClipboardList className="h-5 w-5 text-orange-600" />
          <span className="text-xs font-medium">Requests</span>
        </Button>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Pending Requests ({pendingRequests.length})</h2>
            </div>
            <div className="space-y-2">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {toDate(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">{req.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMenuTab = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Menu className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Weekly Menu</h2>
            {weeklyMenu && (
              <span className="text-xs text-gray-400 ml-auto">
                {formatDate(weeklyMenu.weekStartDate)} - {formatDate(weeklyMenu.weekEndDate)}
              </span>
            )}
          </div>
          {weeklyMenu ? (
            <div className="space-y-4">
              {(Object.keys(dayFull) as Array<keyof typeof dayFull>).map((dayKey) => {
                const dayData = (weeklyMenu.days as any)[dayKey];
                const dayLabel = dayFull[dayKey];
                const hasMeals = dayData && (
                  (dayData.breakfast?.length ?? 0) > 0 ||
                  (dayData.lunch?.length ?? 0) > 0 ||
                  (dayData.dinner?.length ?? 0) > 0
                );
                return (
                  <div key={dayKey}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{dayLabel}</p>
                    {hasMeals ? (
                      <div className="grid grid-cols-3 gap-2">
                        {orderedMealTypes.map((mt) => {
                          const items = dayData?.[mt] || [];
                          return items.length > 0 ? (
                            <div key={mt} className="rounded-lg bg-gray-50 p-2">
                              <div className="flex items-center gap-1.5 mb-1 text-emerald-600">
                                {mealIcons[mt]}
                                <span className="text-[10px] font-medium text-gray-600">{mealLabels[mt]}</span>
                              </div>
                              {items.map((item: MenuDayItemDetail, i: number) => (
                                <p key={i} className="text-[11px] text-gray-600 truncate">• {item.itemName} ({item.quantity})</p>
                              ))}
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No meals planned</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Menu className="h-10 w-10 mb-2" />
              <p className="text-sm">No menu published for this week</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderRequestsTab = () => {
    const allReqs = requests;
    const pending = allReqs.filter((r) => r.status === 'pending');
    const history = allReqs.filter((r) => r.status !== 'pending');

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSkipModal(true)}
            className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            Skip Meal
          </button>
          <button
            onClick={() => setPauseModal(true)}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Pause Service
          </button>
        </div>

        {pending.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Pending ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map((req) => (
                  <div key={req.id} className="rounded-lg bg-amber-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{req.title}</p>
                      <Badge variant="warning" size="sm">{req.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{req.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {toDate(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-3">History ({history.length})</h2>
              <div className="space-y-2">
                {history.map((req) => (
                  <div key={req.id} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{req.title}</p>
                      <Badge variant={statusColors[req.status] || 'neutral'} size="sm">
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{req.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {toDate(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {allReqs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ClipboardList className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium text-gray-500">No requests yet</p>
            <p className="text-xs text-gray-400 mt-1">Use the buttons above to create one</p>
          </div>
        )}
      </div>
    );
  };

  const renderPaymentsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Wallet</h2>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">Credit Balance</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(customer?.walletBalance || 0)}</p>
          </div>
          <button
            onClick={() => setAddMoneyModal(true)}
            className="mt-4 w-full rounded-lg bg-emerald-600 text-white font-bold text-base py-3 flex items-center justify-center gap-2 hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Add Money
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Transaction History</h2>
          </div>
          {walletTxns.length > 0 ? (
            <div className="space-y-2">
              {walletTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                    <p className="text-xs text-gray-500">
                      {toDate(txn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(txn.amount)}</p>
                    <Badge variant={txn.type === 'credit' ? 'success' : 'danger'} size="sm">
                      {txn.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <CreditCard className="h-10 w-10 mb-2" />
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-center py-4">
            <Avatar name={customer.fullName} size="lg" />
            <h2 className="text-lg font-bold text-gray-900 mt-3">{customer.fullName}</h2>
            <Badge variant={customer.status === 'active' ? 'success' : 'warning'} size="sm" className="mt-1">
              {customer.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Account Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{customer.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-sm text-gray-900">{customer.address}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Area</p>
              <div className="mt-1">
                {customer.area ? (
                  <Badge variant="info" size="sm">
                    <MapPin className="h-3 w-3 mr-0.5" />
                    {customer.area}
                  </Badge>
                ) : (
                  <p className="text-sm text-gray-400">Not set</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full justify-center"
        icon={<Pencil className="h-4 w-4" />}
        onClick={() => {
          setEditForm({
            fullName: customer.fullName,
            phone: customer.phone,
            address: customer.address || '',
            area: customer.area || '',
            landmark: customer.landmark || '',
          });
          setEditProfileModal(true);
        }}
      >
        Edit Profile
      </Button>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Subscription</h2>
          {subscription ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-medium text-gray-900">{subscription.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Meal Plan</span>
                <span className="text-sm font-medium text-gray-900">
                  {mealPlanLabels[subscription.mealPlan] || subscription.mealPlan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(subscription.totalAmount)}/mo
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={statusColors[subscription.status] || 'neutral'} size="sm">
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Days Remaining</span>
                <span className="text-sm font-medium text-gray-900">
                  {getDaysRemaining(subscription.endDate)} days
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No active subscription</p>
          )}
        </CardContent>
      </Card>

      <div className="pb-6">
        <Button variant="danger" className="w-full" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />}>
          Logout
        </Button>
      </div>
    </div>
  );

  const tabContent: Record<Tab, () => React.ReactNode> = {
    home: renderHomeTab,
    menu: renderMenuTab,
    requests: renderRequestsTab,
    payments: renderPaymentsTab,
    profile: renderProfileTab,
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { key: 'menu', label: 'Menu', icon: <Menu className="h-5 w-5" /> },
    { key: 'requests', label: 'Requests', icon: <ClipboardList className="h-5 w-5" /> },
    { key: 'payments', label: 'Payments', icon: <IndianRupee className="h-5 w-5" /> },
    { key: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">
              {business?.businessName || 'FoodiFirm'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {customer && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">
                  {formatCurrency(customer.walletBalance || 0)}
                </span>
              </div>
            )}
            <button onClick={handleLogout} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {tabContent[activeTab]()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span className={isActive ? 'text-emerald-600' : 'text-gray-400'}>
                  {tab.icon}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Modal open={skipModal} onClose={() => setSkipModal(false)} title="Request Skip Meal">
        <div className="p-5 space-y-4">
          <Input
            label="Date"
            type="date"
            value={skipDate}
            onChange={(e) => setSkipDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Meal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {orderedMealTypes.map((mt) => (
                <button
                  key={mt}
                  onClick={() => setSkipMealType(mt)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                    skipMealType === mt
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mealIcons[mt]}
                  <span className="text-xs">{mealLabels[mt]}</span>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Reason (optional)"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="Why are you skipping?"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSkipModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSkipMeal} loading={submitting} disabled={!skipDate}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={pauseModal} onClose={() => setPauseModal(false)} title="Request Pause Service">
        <div className="p-5 space-y-4">
          <Input
            label="From Date"
            type="date"
            value={pauseFrom}
            onChange={(e) => setPauseFrom(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={pauseTo}
            onChange={(e) => setPauseTo(e.target.value)}
          />
          <Input
            label="Reason (optional)"
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            placeholder="Why are you pausing?"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPauseModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handlePauseService} loading={submitting} disabled={!pauseFrom || !pauseTo}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={prefModal} onClose={() => setPrefModal(false)} title="Update Preferences">
        <div className="p-5 space-y-4">
          <Input
            label="Meal Preference"
            value={prefMealPreference}
            onChange={(e) => setPrefMealPreference(e.target.value)}
            placeholder="e.g., Jain, Vegetarian, No onion-garlic"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPrefModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleUpdatePreferences} loading={submitting} disabled={!prefMealPreference}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={menuModal} onClose={() => setMenuModal(false)} title="Weekly Menu">
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {weeklyMenu ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                {formatDate(weeklyMenu.weekStartDate)} - {formatDate(weeklyMenu.weekEndDate)}
              </p>
              {(Object.keys(dayFull) as Array<keyof typeof dayFull>).map((dayKey) => {
                const dayData = (weeklyMenu.days as any)[dayKey];
                const hasMeals = dayData && (
                  (dayData.breakfast?.length ?? 0) > 0 ||
                  (dayData.lunch?.length ?? 0) > 0 ||
                  (dayData.dinner?.length ?? 0) > 0
                );
                return (
                  <div key={dayKey}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{dayFull[dayKey]}</p>
                    {hasMeals ? (
                      <div className="grid grid-cols-3 gap-2">
                        {orderedMealTypes.map((mt) => {
                          const items = dayData?.[mt] || [];
                          return items.length > 0 ? (
                            <div key={mt} className="rounded-lg bg-gray-50 p-2">
                              <div className="flex items-center gap-1.5 mb-1 text-emerald-600">
                                {mealIcons[mt]}
                                <span className="text-[10px] font-medium text-gray-600">{mealLabels[mt]}</span>
                              </div>
                              {items.map((item: MenuDayItemDetail, i: number) => (
                                <p key={i} className="text-[11px] text-gray-600 truncate">• {item.itemName} ({item.quantity})</p>
                              ))}
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No meals planned</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Menu className="h-10 w-10 mb-2" />
              <p className="text-sm">No menu published for this week</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={invoiceModal} onClose={() => setInvoiceModal(false)} title="Payment History">
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">
                      {toDate(inv.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</p>
                    <Badge variant={statusColors[inv.status] || 'neutral'} size="sm">
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <CreditCard className="h-10 w-10 mb-2" />
              <p className="text-sm">No invoices yet</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={editProfileModal} onClose={() => setEditProfileModal(false)} title="Edit Profile">
        <div className="p-5 space-y-4">
          <Input label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={editForm.area}
                onChange={(e) => setEditForm((f) => ({ ...f, area: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.areaName}>{a.areaName}</option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Landmark" value={editForm.landmark} onChange={(e) => setEditForm((f) => ({ ...f, landmark: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditProfileModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={savingProfile} onClick={async () => {
              if (!customer) return;
              setSavingProfile(true);
              try {
                await updateCustomer(customer.id, {
                  fullName: editForm.fullName,
                  phone: editForm.phone,
                  address: editForm.address,
                  area: editForm.area,
                  landmark: editForm.landmark,
                });
                setCustomer((prev) => prev ? { ...prev, ...editForm } : null);
                setEditProfileModal(false);
                toast.success('Profile updated!');
              } catch {
                toast.error('Failed to update profile');
              } finally {
                setSavingProfile(false);
              }
            }}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={requestModal} onClose={() => setRequestModal(false)} title="Request History">
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {requests.length > 0 ? (
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{req.title}</p>
                    <Badge variant={statusColors[req.status] || 'neutral'} size="sm">
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{req.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {toDate(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <ClipboardList className="h-10 w-10 mb-2" />
              <p className="text-sm">No requests yet</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={addMoneyModal} onClose={() => setAddMoneyModal(false)} title="Add Money">
        <div className="p-5 space-y-4">
          <Input
            label="Amount"
            type="number"
            inputMode="numeric"
            value={addMoneyAmount || ''}
            onChange={(e) => setAddMoneyAmount(Number(e.target.value))}
            placeholder="Enter amount"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddMoneyModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddMoney}
              loading={submitting}
              disabled={addMoneyAmount <= 0}
            >
              Top Up (UPI)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
