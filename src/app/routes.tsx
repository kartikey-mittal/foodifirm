import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StoreResolverLayout } from '@/components/layout/StoreResolverLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DailyTrackingPage } from '@/features/daily-tracking/DailyTrackingPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { CustomerDetailPage } from '@/features/customers/CustomerDetailPage';
import { CustomerRequestsPage } from '@/features/customers/CustomerRequestsPage';
import { WeeklyMenuPage } from '@/features/menu/WeeklyMenuPage';
import { ItemsPage } from '@/features/menu/ItemsPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { DeliveryPage } from '@/features/delivery/DeliveryPage';
import { AreasPage } from '@/features/delivery/AreasPage';
import { BatchesPage } from '@/features/delivery/BatchesPage';
import { DriversPage } from '@/features/delivery/DriversPage';
import { SubscriptionsPage } from '@/features/subscriptions/SubscriptionsPage';
import { PaymentsInvoicesPage } from '@/features/payments/PaymentsInvoicesPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { ReportsAnalyticsPage } from '@/features/reports/ReportsAnalyticsPage';
import { StaffPage } from '@/features/staff/StaffPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { DataToolsPage } from '@/features/data-tools/DataToolsPage';
import { CustomerPortalHome } from '@/features/customer-portal/CustomerPortalHome';
import { StoreCustomerRegister } from '@/features/customer-portal/StoreCustomerRegister';
import { StoreCustomerLogin } from '@/features/customer-portal/StoreCustomerLogin';
import { DriverHome } from '@/features/driver/DriverHome';

const adminTypes = ['admin', 'restaurant'] as const;

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedUserTypes={[...adminTypes]}>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  // Public auth routes
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
  { path: '/forgot-password', element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },

  // Store-specific public routes — /store/:storeId/...
  {
    path: '/store/:storeId/register',
    element: (
      <StoreResolverLayout>
        <StoreCustomerRegister />
      </StoreResolverLayout>
    ),
  },
  {
    path: '/store/:storeId/customer-login',
    element: (
      <StoreResolverLayout>
        <StoreCustomerLogin />
      </StoreResolverLayout>
    ),
  },
  {
    path: '/store/:storeId/customer-portal',
    element: (
      <StoreResolverLayout>
        <CustomerPortalHome />
      </StoreResolverLayout>
    ),
  },
  {
    path: '/store/:storeId/driver',
    element: (
      <StoreResolverLayout>
        <DriverHome />
      </StoreResolverLayout>
    ),
  },

  // Admin/Restaurant routes
  {
    path: '/',
    element: <AdminRoute><AppLayout /></AdminRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'daily-tracking', element: <DailyTrackingPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'customer-requests', element: <CustomerRequestsPage /> },
      { path: 'weekly-menu', element: <WeeklyMenuPage /> },
      { path: 'items', element: <ItemsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'delivery', element: <DeliveryPage /> },
      { path: 'delivery/areas', element: <AreasPage /> },
      { path: 'delivery/batches', element: <BatchesPage /> },
      { path: 'delivery/drivers', element: <DriversPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'payments', element: <PaymentsInvoicesPage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'reports', element: <ReportsAnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'data-tools', element: <DataToolsPage /> },
    ],
  },
]);
