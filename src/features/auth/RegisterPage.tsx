import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { RegisterPayload } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ChefHat, UserPlus, Store } from 'lucide-react';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    city: '',
    area: '',
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.email || !form.fullName || !form.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...form,
        userType: 'restaurant',
      } as RegisterPayload);
      toast.success('Account created successfully!');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.code === 'auth/weak-password'
        ? 'Password is too weak'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FoodiFirm</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create your restaurant account</h2>
            <p className="text-gray-500 mt-1">Join FoodiFirm and start managing your tiffin business</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 mb-4">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Restaurant / Store Owner</p>
                <p className="text-xs text-emerald-600">Manage your tiffin service, customers, and deliveries</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name *" placeholder="John Doe" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
              <Input label="Email *" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
              <Input label="Password *" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => update('password', e.target.value)} />
              <Input label="Confirm Password *" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
              <Input label="Phone *" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Business Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Business Name" placeholder="My Tiffin Service" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
                <Input label="Business Phone" placeholder="+91 98765 43210" value={form.businessPhone} onChange={(e) => update('businessPhone', e.target.value)} />
                <Input label="Business Address" placeholder="123, Main Street" value={form.businessAddress} onChange={(e) => update('businessAddress', e.target.value)} className="sm:col-span-2" />
                <Input label="City" placeholder="Bangalore" value={form.city} onChange={(e) => update('city', e.target.value)} />
                <Input label="Area" placeholder="Koramangala" value={form.area} onChange={(e) => update('area', e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" icon={<UserPlus className="h-4 w-4" />}>
              Create Account
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
