import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ChefHat, Eye, EyeOff, LogIn, UtensilsCrossed, Bike, User, Store } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please try again later.'
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="flex-1 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">FoodiFirm</h1>
              <p className="text-emerald-100 text-sm">Smart Tiffin & Food Service Management</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">All-in-one platform for your tiffin business</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { icon: <Store className="h-5 w-5" />, title: 'Manage Menu', desc: 'Plan weekly meals' },
              { icon: <User className="h-5 w-5" />, title: 'Track Customers', desc: 'Subscriptions & payments' },
              { icon: <Bike className="h-5 w-5" />, title: 'Delivery Ops', desc: 'Real-time tracking' },
              { icon: <UtensilsCrossed className="h-5 w-5" />, title: 'Analytics', desc: 'Business insights' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <div className="rounded-lg bg-white/20 p-2 text-white">{feature.icon}</div>
                <div>
                  <p className="text-sm font-medium text-white">{feature.title}</p>
                  <p className="text-xs text-emerald-100">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-emerald-200 text-sm">
            Join 500+ restaurants managing their tiffin business with FoodiFirm.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">FoodiFirm</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <Button type="submit" loading={loading} className="w-full" icon={<LogIn className="h-4 w-4" />}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Forgot password?
              </Link>
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Create account
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
