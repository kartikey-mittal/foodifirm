import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { loginUser } from '@/services/authService';
import { getUserProfile } from '@/services/userService';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChefHat, LogIn, Eye, EyeOff, Store, Loader2 } from 'lucide-react';

export function StoreCustomerLogin() {
  const { business, storeId, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Fill in all fields'); return; }
    setLoading(true);
    setError('');

    try {
      const cred = await loginUser(email, password);
      const profile = await getUserProfile(cred.user.uid);

      if (!profile || profile.userType !== 'customer') {
        setError('This portal is for customers only.');
        setLoading(false);
        return;
      }

      if (profile.businessId !== business?.id) {
        setError('This account is not linked with this store.');
        setLoading(false);
        return;
      }

      navigate(`/store/${storeId}/customer-portal`);
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (storeLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-bold text-gray-900">{business?.businessName || 'Store'}</h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <Button type="submit" loading={loading} className="w-full" icon={<LogIn className="h-4 w-4" />}>Sign In</Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            <Link to={`/store/${storeId}/register`} className="text-emerald-600 hover:text-emerald-700 font-medium">
              New customer? Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
