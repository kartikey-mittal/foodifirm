import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { registerUser } from '@/services/authService';
import { createUserProfile, updateUserProfile } from '@/services/userService';
import { createCustomer } from '@/services/customerService';
import { getDeliveryAreas } from '@/services/deliveryService';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChefHat, UserPlus, ArrowLeft, Loader2, Store, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DeliveryArea } from '@/types';

export function StoreCustomerRegister() {
  const { business, businessId, storeId, loading: storeLoading } = useStore();
  const navigate = useNavigate();

  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '',
    address: '', area: '', landmark: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  useEffect(() => {
    const fetchAreas = async () => {
      if (!businessId) return;
      try {
        const data = await getDeliveryAreas(businessId);
        setAreas(data.filter((a) => a.isActive));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAreas(false);
      }
    };
    fetchAreas();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessId || !business) {
      setError('Store not found');
      return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (!form.area) { setError('Please select your area'); return; }

    setLoading(true);
    try {
      const cred = await registerUser(form.email, form.password);

      await createUserProfile(cred.user.uid, {
        uid: cred.user.uid,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        userType: 'customer',
        businessId,
        businessSlug: storeId,
      });

      const { id: customerId } = await createCustomer(businessId, {
        userId: cred.user.uid,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        area: form.area,
        landmark: form.landmark,
        weekendServiceRequired: false,
        status: 'pending_approval',
        subscriptionStatus: 'none',
        paymentStatus: 'pending',
      });

      await updateUserProfile(cred.user.uid, { customerId });

      toast.success('Registration submitted for approval!');
      navigate(`/store/${storeId}/customer-portal`);
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.code === 'auth/weak-password' ? 'Password is too weak'
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (storeLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Branding Side */}
      <div className="lg:w-1/3 bg-gradient-to-br from-emerald-700 to-emerald-500 p-8 lg:p-12 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{business?.businessName || 'Store'}</h1>
            <p className="text-emerald-100 text-sm">Join our tiffin service</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Start enjoying fresh, homemade meals</h2>
        <p className="text-emerald-100 text-sm leading-relaxed">
          Get delicious, hygienic meals delivered to your doorstep. Choose from our carefully planned menus and enjoy the taste of home.
        </p>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6">
              <Link to={`/store/${storeId}/customer-login`} className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-4">
                <ArrowLeft className="h-4 w-4" /> Already have an account? Sign in
              </Link>
              <h2 className="text-2xl font-bold text-gray-900">Register with {business?.businessName}</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name *" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="John Doe" />
                <Input label="Email *" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
                <Input label="Password *" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Min 6 characters" />
                <Input label="Confirm Password *" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
                <Input label="Phone *" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Area *</label>
                  {loadingAreas ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading areas...
                    </div>
                  ) : areas.length > 0 ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={form.area}
                        onChange={(e) => update('area', e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select your area</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.areaName}>{a.areaName}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                      No delivery areas available yet
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="123, Main Street, Layout" />
                </div>
                <Input label="Landmark (optional)" value={form.landmark} onChange={(e) => update('landmark', e.target.value)} placeholder="Near..." />
              </div>

              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

              <Button type="submit" loading={loading} className="w-full" icon={<UserPlus className="h-4 w-4" />}>
                Submit Registration
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
