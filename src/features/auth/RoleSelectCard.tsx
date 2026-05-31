import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChefHat, Store, User, Bike } from 'lucide-react';

interface RoleSelectCardProps {
  role: 'admin' | 'restaurant' | 'customer' | 'driver';
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const roleConfig: Record<string, RoleSelectCardProps> = {
  admin: {
    role: 'admin',
    title: 'Admin',
    description: 'Full system access and management control',
    icon: <ChefHat className="h-8 w-8" />,
    route: '/dashboard',
  },
  restaurant: {
    role: 'restaurant',
    title: 'Restaurant / Store Owner',
    description: 'Manage kitchen, menu, and daily operations',
    icon: <Store className="h-8 w-8" />,
    route: '/dashboard',
  },
  customer: {
    role: 'customer',
    title: 'Customer',
    description: 'View subscriptions, meals, and preferences',
    icon: <User className="h-8 w-8" />,
    route: '/customer-portal',
  },
  driver: {
    role: 'driver',
    title: 'Delivery Agent',
    description: 'View assigned deliveries and update status',
    icon: <Bike className="h-8 w-8" />,
    route: '/driver',
  },
};

export function RoleSelectCard({ roleKey }: { roleKey: string }) {
  const navigate = useNavigate();
  const config = roleConfig[roleKey];
  if (!config) return null;

  return (
    <Card
      hover
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
      onClick={() => navigate(config.route)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            {config.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{config.description}</p>
          </div>
          <Button
            variant="outline"
            className="w-full mt-2 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              navigate(config.route);
            }}
          >
            Continue as {config.title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
