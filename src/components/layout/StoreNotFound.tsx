import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Store, ArrowLeft } from 'lucide-react';

export function StoreNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="rounded-full bg-gray-100 p-4 inline-flex mb-4">
            <Store className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Store Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">
            This store link is invalid or no longer active. Please check the URL or contact the store owner.
          </p>
          <Link to="/login">
            <Button icon={<ArrowLeft className="h-4 w-4" />}>Go to Main Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
