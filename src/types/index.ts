export type UserType = 'admin' | 'restaurant' | 'customer' | 'delivery_agent';

export interface AppUser {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  userType: UserType;
  businessId?: string;
  businessSlug?: string;
  customerId?: string;
  driverId?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt?: any;
}

export interface Business {
  id: string;
  ownerId: string;
  businessName: string;
  slug: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  city: string;
  area: string;
  logoUrl?: string;
  currency: string;
  timezone: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Customer {
  id: string;
  businessId: string;
  userId?: string;
  customerCode: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  landmark?: string;
  status: CustomerStatus;
  subscriptionStatus: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  walletBalance: number;
  mealPreference?: string;
  weekendServiceRequired: boolean;
  specialNotes?: string;
  createdAt: any;
  updatedAt: any;
}

export type CustomerStatus = 'active' | 'paused' | 'inactive' | 'pending_approval';
export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'none';
export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'overdue';

export interface Subscription {
  id: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  planName: string;
  mealPlan: MealPlan;
  startDate: any;
  endDate: any;
  status: SubscriptionPlanStatus;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  billingCycle: BillingCycle;
  createdAt: any;
  updatedAt: any;
}

export type MealPlan = 'breakfast' | 'lunch' | 'dinner' | 'breakfast_lunch' | 'lunch_dinner' | 'all_meals';
export type SubscriptionPlanStatus = 'active' | 'paused' | 'expired' | 'cancelled';
export type BillingCycle = 'weekly' | 'monthly';

export interface FoodItem {
  id: string;
  businessId: string;
  name: string;
  category: FoodCategory;
  description?: string;
  price?: number;
  isAvailable: boolean;
  isVeg: boolean;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export type FoodCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'extra';

export interface MenuDayItemDetail {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface WeeklyMenuDay {
  breakfast: MenuDayItemDetail[];
  lunch: MenuDayItemDetail[];
  dinner: MenuDayItemDetail[];
}

export interface WeeklyMenu {
  id: string;
  businessId: string;
  weekStartDate: string;
  weekEndDate: string;
  days: {
    monday: WeeklyMenuDay;
    tuesday: WeeklyMenuDay;
    wednesday: WeeklyMenuDay;
    thursday: WeeklyMenuDay;
    friday: WeeklyMenuDay;
    saturday: WeeklyMenuDay;
    sunday: WeeklyMenuDay;
  };
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface DeliveryArea {
  id: string;
  businessId: string;
  areaName: string;
  deliveryTimeSlot?: string;
  customerCount: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface DeliveryBatch {
  id: string;
  businessId: string;
  areaId: string;
  batchName: string;
  assignedDriverId?: string;
  customerIds: string[];
  deliveryTime?: string;
  routeNote?: string;
  status: BatchStatus;
  createdAt: any;
  updatedAt: any;
}

export type BatchStatus = 'planned' | 'assigned' | 'in_progress' | 'completed' | 'hold';

export interface Driver {
  id: string;
  businessId: string;
  userId?: string;
  driverName: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  accessCode?: string;
  assignedAreas?: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Delivery {
  id: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  driverId?: string;
  areaId?: string;
  batchId?: string;
  deliveryDate: string;
  mealType: MealType;
  status: DeliveryStatus;
  addressSnapshot?: string;
  deliveredAt?: any;
  createdAt: any;
  updatedAt: any;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type DeliveryStatus = 'pending' | 'in_progress' | 'delivered' | 'failed';

export interface Invoice {
  id: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  subscriptionId?: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceStatus;
  invoiceDate: any;
  dueDate: any;
  createdAt: any;
  updatedAt: any;
}

export type InvoiceStatus = 'paid' | 'pending' | 'partial' | 'overdue';

export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentStatus: 'success' | 'pending' | 'failed';
  paymentDate: any;
  note?: string;
  createdAt: any;
  updatedAt: any;
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';

export interface AppNotification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetIds?: string[];
  status: NotificationStatus;
  scheduledAt?: any;
  createdAt: any;
  updatedAt: any;
}

export type NotificationType = 'customer' | 'payment' | 'subscription' | 'delivery' | 'system';
export type NotificationTargetType = 'all' | 'selected' | 'area' | 'subscription_plan';
export type NotificationStatus = 'draft' | 'sent' | 'scheduled';

export interface SystemAlert {
  id: string;
  businessId: string;
  title: string;
  message: string;
  category: AlertCategory;
  isRead: boolean;
  priority: AlertPriority;
  createdAt: any;
}

export type AlertCategory = 'payment' | 'subscription' | 'delivery' | 'system';
export type AlertPriority = 'low' | 'medium' | 'high';

export interface ActivityLog {
  id: string;
  businessId: string;
  actorId: string;
  actorName: string;
  action: string;
  module: string;
  description: string;
  createdAt: any;
}

export interface BusinessStats {
  businessId: string;
  totalRevenue: number;
  activeCustomers: number;
  newCustomersThisWeek: number;
  activeSubscriptions: number;
  pendingPayments: number;
  deliveriesToday: number;
  activeDrivers: number;
  areasCovered: number;
  updatedAt: any;
}

// Input types
export interface CreateCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  landmark?: string;
  userId?: string;
  walletBalance?: number;
  mealPreference?: string;
  weekendServiceRequired: boolean;
  specialNotes?: string;
  status: CustomerStatus;
  subscriptionStatus: SubscriptionStatus;
  paymentStatus: PaymentStatus;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CreateFoodItemInput {
  name: string;
  category: FoodCategory;
  description?: string;
  price?: number;
  isAvailable: boolean;
  isVeg: boolean;
}

export interface CreateSubscriptionInput {
  customerId: string;
  customerName?: string;
  planName: string;
  mealPlan: MealPlan;
  startDate: any;
  endDate: any;
  status: SubscriptionPlanStatus;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  billingCycle: BillingCycle;
}

export interface CustomerRequest {
  id: string;
  businessId: string;
  businessSlug: string;
  customerId: string;
  userId: string;
  requestType: 'pause_service' | 'skip_meal' | 'preference_update' | 'general';
  title: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedDate: any;
  mealType?: string;
  fromDate?: string;
  toDate?: string;
  metadata?: Record<string, any>;
  createdAt: any;
  updatedAt: any;
}

export interface CreateInvoiceInput {
  customerId: string;
  customerName?: string;
  subscriptionId?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceStatus;
  invoiceDate: any;
  dueDate: any;
}

export interface CreateCustomerRequestInput {
  requestType: CustomerRequest['requestType'];
  title: string;
  message: string;
  mealType?: string;
  fromDate?: string;
  toDate?: string;
  metadata?: Record<string, any>;
}

// Phase 4 Types

export interface DailyMealOrder {
  id: string;
  businessId: string;
  businessSlug: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCode: string;
  subscriptionId: string;
  deliveryAreaId: string;
  deliveryAreaName: string;
  batchId?: string;
  driverId?: string;
  deliveryDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  mealItems: string[];
  mealPlan: MealPlan;
  addressSnapshot: string;
  status: 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered' | 'skipped' | 'paused' | 'cancelled' | 'failed';
  paymentStatusSnapshot: string;
  specialNotes: string;
  createdFrom: 'subscription' | 'manual';
  createdAt: any;
  updatedAt: any;
  deliveredAt?: any;
}

export interface MealSkip {
  id: string;
  businessId: string;
  customerId: string;
  subscriptionId: string;
  skipDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  reason: string;
  status: 'approved' | 'cancelled';
  createdFromRequestId: string;
  createdAt: any;
  updatedAt: any;
}

export interface ServicePause {
  id: string;
  businessId: string;
  customerId: string;
  subscriptionId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'active' | 'completed' | 'cancelled';
  createdFromRequestId: string;
  createdAt: any;
  updatedAt: any;
}

export type StaffType = 'manager' | 'delivery' | 'kitchen' | 'support' | 'other';

export interface StaffMember {
  id: string;
  businessId: string;
  fullName: string;
  email: string;
  phone: string;
  staffType: StaffType;
  isActive: boolean;
  joinedAt: any;
  notes: string;
  createdAt: any;
  updatedAt: any;
}

export interface DailyMealSummary {
  total: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  skipped: number;
  paused: number;
  outForDelivery: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface AreaWiseBreakdown {
  areaName: string;
  count: number;
  delivered: number;
  pending: number;
}

export interface DriverWiseBreakdown {
  driverName: string;
  driverId: string;
  assigned: number;
  delivered: number;
}

export interface MealTypeBreakdown {
  breakfast: number;
  lunch: number;
  dinner: number;
}

export interface WalletTransaction {
  id: string;
  businessId: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  description?: string;
  createdAt: any;
}

export interface BusinessStatsV2 extends BusinessStats {
  todaysMeals?: number;
  pendingRequests?: number;
  pendingApprovals?: number;
  failedDeliveries?: number;
}
