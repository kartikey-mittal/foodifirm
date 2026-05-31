import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/context/StoreContext';
import { getDriversByBusiness, getDeliveriesByDriver, markDeliveryDelivered, getDeliveryAreas } from '@/services/deliveryService';
import {
  Bike, CheckCircle, Clock, MapPin, Phone, Navigation, ChefHat, LogOut, Loader2, User, Key, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Driver, Delivery, DeliveryArea } from '@/types';

const SESSION_KEY = 'foodifirm_driver';

interface DriverSession {
  driverId: string;
  driverName: string;
  businessId: string;
  phone: string;
}

function getSession(): DriverSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSession(s: DriverSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function DriverHome() {
  const { business, businessId, storeId } = useStore();
  const [session, setSessionState] = useState<DriverSession | null>(getSession);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [driver, setDriver] = useState<Driver | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch driver data when session is available
  useEffect(() => {
    if (!session?.driverId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const [allDrivers, dels, allAreas] = await Promise.all([
          getDriversByBusiness(session.businessId),
          getDeliveriesByDriver(session.driverId),
          getDeliveryAreas(session.businessId),
        ]);
        const match = allDrivers.find((d) => d.id === session.driverId);
        setDriver(match || null);
        setAreas(allAreas.filter((a) => a.isActive));

        // Filter deliveries to assigned areas only (if driver has assignedAreas)
        if (match?.assignedAreas && match.assignedAreas.length > 0) {
          setDeliveries(dels.filter((d) => d.areaId && match.assignedAreas!.includes(d.areaId)));
        } else {
          setDeliveries(dels);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [session?.driverId]);

  const handleLogin = async () => {
    if (!phone || !code) { setLoginError('Enter phone and access code'); return; }
    if (!businessId) { setLoginError('Store not found'); return; }
    setLoggingIn(true);
    setLoginError('');
    try {
      const drivers = await getDriversByBusiness(businessId);
      const match = drivers.find(
        (d) => d.phone === phone && d.accessCode === code && d.isActive
      );
      if (match) {
        const s: DriverSession = { driverId: match.id, driverName: match.driverName, businessId, phone: match.phone };
        setSession(s);
        setSessionState(s);
        setDriver(match);
        toast.success(`Welcome, ${match.driverName}!`);
      } else {
        setLoginError('Invalid phone or access code, or driver is inactive');
      }
    } catch (err) {
      setLoginError('Something went wrong. Try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSessionState(null);
    setDriver(null);
    setDeliveries([]);
    setPhone('');
    setCode('');
  };

  const handleMarkDelivered = async (deliveryId: string) => {
    try {
      await markDeliveryDelivered(deliveryId);
      setDeliveries((prev) => prev.map((d) => d.id === deliveryId ? { ...d, status: 'delivered' as const } : d));
      toast.success('Delivery marked as delivered!');
    } catch (err) {
      toast.error('Failed to update delivery');
    }
  };

  const delivered = deliveries.filter((d) => d.status === 'delivered').length;
  const pending = deliveries.filter((d) => d.status !== 'delivered').length;

  // ---- LOGIN SCREEN ----
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold text-gray-900">FoodiFirm</h1>
                  <p className="text-xs text-gray-500">Delivery Agent</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Driver Login</h2>
              <p className="text-gray-500 text-sm mt-1">{business?.businessName || 'Store'}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              <Input label="Access Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="DRV-XXXXXX" />
              {loginError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{loginError}</div>}
              <Button type="submit" loading={loggingIn} className="w-full" icon={<Shield className="h-4 w-4" />}>Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- LOADING SCREEN ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ---- DASHBOARD SCREEN ----
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-600 text-white sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">FoodiFirm</h1>
              <p className="text-xs text-emerald-100">{business?.businessName || 'Store'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="rounded-lg p-2 hover:bg-white/10" title="Logout">
              <LogOut className="h-5 w-5" />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{session.driverName}</p>
              <p className="text-xs text-emerald-100">Delivery Agent</p>
              {driver?.assignedAreas && driver.assignedAreas.length > 0 && (
                <div className="flex gap-1 mt-1 justify-end">
                  {driver.assignedAreas.map((aid) => {
                    const area = areas.find((a) => a.id === aid);
                    return area ? (
                      <Badge key={aid} variant="info" size="sm" className="text-[10px] bg-emerald-700 text-white">
                        {area.areaName}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <Avatar name={session.driverName} size="sm" className="border-2 border-white/50" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{deliveries.length}</p>
              <p className="text-xs text-gray-500 mt-1">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{pending}</p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{delivered}</p>
              <p className="text-xs text-gray-500 mt-1">Delivered</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Today's Deliveries</h2>
            <Badge variant="info">{pending} remaining</Badge>
          </div>

          {deliveries.length > 0 ? (
            deliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'rounded-full p-2.5 flex-shrink-0',
                      delivery.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                      delivery.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    )}>
                      {delivery.status === 'delivered' ? <CheckCircle className="h-5 w-5" /> :
                       delivery.status === 'in_progress' ? <Navigation className="h-5 w-5" /> :
                       <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{delivery.customerName || delivery.customerId}</h3>
                        <Badge variant={delivery.status === 'delivered' ? 'success' : delivery.status === 'in_progress' ? 'info' : 'warning'} size="sm">
                          {delivery.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {delivery.addressSnapshot && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{delivery.addressSnapshot}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-sm">
                        <span className="font-medium text-gray-700 capitalize">{delivery.mealType}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500">{delivery.deliveryDate}</span>
                      </div>
                    </div>
                  </div>
                  {delivery.status !== 'delivered' && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Button size="sm" icon={<CheckCircle className="h-4 w-4" />} className="flex-1" onClick={() => handleMarkDelivered(delivery.id)}>
                        Mark Delivered
                      </Button>
                      <Button variant="outline" size="sm" icon={<Phone className="h-4 w-4" />}>Call</Button>
                      <Button variant="outline" size="sm" icon={<Navigation className="h-4 w-4" />}>Navigate</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Bike className="h-12 w-12 mb-3" />
              <p className="text-gray-600 font-medium">No deliveries assigned for today</p>
              <p className="text-sm mt-1">Check back later for new deliveries</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
