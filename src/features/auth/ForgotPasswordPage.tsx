import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ChefHat, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FoodiFirm</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reset password</h2>
            <p className="text-gray-500 mt-1">
              {sent
                ? 'Check your email for the reset link'
                : 'Enter your email and we\'ll send you a reset link'}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="rounded-full bg-emerald-50 p-4 inline-flex">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-600">
                If an account exists with <strong>{email}</strong>, you will receive a password reset email shortly.
              </p>
              <Button variant="outline" onClick={() => setSent(false)} className="w-full">
                Send again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full" icon={<Mail className="h-4 w-4" />}>
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
