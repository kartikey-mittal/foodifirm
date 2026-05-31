import type { Customer, Subscription, FoodItem, WeeklyMenu, Delivery, Invoice, Driver } from '@/types';

export const mockBusinessStats = {
  businessId: 'demo',
  totalRevenue: 1584200,
  activeCustomers: 342,
  newCustomersThisWeek: 28,
  activeSubscriptions: 298,
  pendingPayments: 31,
  deliveriesToday: 156,
  activeDrivers: 12,
  areasCovered: 18,
  updatedAt: null,
};

export const mockActivities = [
  { id: '1', type: 'payment' as const, message: 'Payment received from Rahul Sharma', timestamp: '2026-05-31T09:30:00', customerName: 'Rahul Sharma' },
  { id: '2', type: 'subscription' as const, message: 'New subscription started for Priya Patel', timestamp: '2026-05-31T08:45:00', customerName: 'Priya Patel' },
  { id: '3', type: 'delivery' as const, message: 'Delivery completed for Amit Singh - Batch A', timestamp: '2026-05-31T08:30:00', customerName: 'Amit Singh' },
  { id: '4', type: 'customer' as const, message: 'New customer registered: Sneha Gupta', timestamp: '2026-05-31T07:15:00', customerName: 'Sneha Gupta' },
  { id: '5', type: 'order' as const, message: 'Meal preference updated for Vikram Joshi', timestamp: '2026-05-30T18:20:00', customerName: 'Vikram Joshi' },
  { id: '6', type: 'payment' as const, message: 'Payment overdue for Deepak Kumar', timestamp: '2026-05-30T16:00:00', customerName: 'Deepak Kumar' },
  { id: '7', type: 'delivery' as const, message: 'Batch C dispatched for delivery', timestamp: '2026-05-30T07:45:00' },
  { id: '8', type: 'subscription' as const, message: 'Subscription renewed for Ananya Reddy', timestamp: '2026-05-29T14:30:00', customerName: 'Ananya Reddy' },
];

export const mockCustomers: Customer[] = [
  { id: 'C001', businessId: 'demo', userId: '', customerCode: 'CUST-1001', fullName: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@email.com', address: '42, Lake View Apartments', area: 'Koramangala', status: 'active', subscriptionStatus: 'active', paymentStatus: 'paid', weekendServiceRequired: false, createdAt: '2026-01-15', updatedAt: '2026-01-15' },
  { id: 'C002', businessId: 'demo', userId: '', customerCode: 'CUST-1002', fullName: 'Priya Patel', phone: '+91 87654 32109', email: 'priya@email.com', address: '15, Green Park Colony', area: 'Indiranagar', status: 'active', subscriptionStatus: 'active', paymentStatus: 'paid', weekendServiceRequired: false, createdAt: '2026-02-20', updatedAt: '2026-02-20' },
  { id: 'C003', businessId: 'demo', userId: '', customerCode: 'CUST-1003', fullName: 'Amit Singh', phone: '+91 76543 21098', email: 'amit@email.com', address: '8, Sunshine Apartments', area: 'Whitefield', status: 'paused', subscriptionStatus: 'none', paymentStatus: 'paid', weekendServiceRequired: false, createdAt: '2026-03-10', updatedAt: '2026-03-10' },
  { id: 'C004', businessId: 'demo', userId: '', customerCode: 'CUST-1004', fullName: 'Sneha Gupta', phone: '+91 65432 10987', email: 'sneha@email.com', address: '23, River View Complex', area: 'JP Nagar', status: 'active', subscriptionStatus: 'active', paymentStatus: 'pending', weekendServiceRequired: true, createdAt: '2026-04-05', updatedAt: '2026-04-05' },
  { id: 'C005', businessId: 'demo', userId: '', customerCode: 'CUST-1005', fullName: 'Vikram Joshi', phone: '+91 54321 09876', email: 'vikram@email.com', address: '56, MG Road', area: 'MG Road', status: 'active', subscriptionStatus: 'active', paymentStatus: 'paid', weekendServiceRequired: false, createdAt: '2025-12-01', updatedAt: '2025-12-01' },
  { id: 'C006', businessId: 'demo', userId: '', customerCode: 'CUST-1006', fullName: 'Deepak Kumar', phone: '+91 43210 98765', email: 'deepak@email.com', address: '12, Patel Nagar', area: 'BTM Layout', status: 'active', subscriptionStatus: 'active', paymentStatus: 'overdue', weekendServiceRequired: false, createdAt: '2026-01-28', updatedAt: '2026-01-28' },
  { id: 'C007', businessId: 'demo', userId: '', customerCode: 'CUST-1007', fullName: 'Ananya Reddy', phone: '+91 32109 87654', email: 'ananya@email.com', address: '34, Hitech City', area: 'HSR Layout', status: 'active', subscriptionStatus: 'active', paymentStatus: 'paid', weekendServiceRequired: false, createdAt: '2026-02-14', updatedAt: '2026-02-14' },
  { id: 'C008', businessId: 'demo', userId: '', customerCode: 'CUST-1008', fullName: 'Ravi Verma', phone: '+91 21098 76543', email: 'ravi@email.com', address: '7, Gandhi Nagar', area: 'Jayanagar', status: 'inactive', subscriptionStatus: 'none', paymentStatus: 'paid', weekendServiceRequired: false, createdAt: '2025-10-20', updatedAt: '2025-10-20' },
];

export const mockSubscriptions: Subscription[] = [
  { id: 'S001', businessId: 'demo', customerId: 'C001', customerName: 'Rahul Sharma', planName: 'Premium Weekly', mealPlan: 'all_meals', startDate: '2026-05-01', endDate: '2026-06-01', status: 'active', totalAmount: 4200, paidAmount: 4200, pendingAmount: 0, billingCycle: 'monthly', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
  { id: 'S002', businessId: 'demo', customerId: 'C002', customerName: 'Priya Patel', planName: 'Standard Lunch', mealPlan: 'lunch', startDate: '2026-05-05', endDate: '2026-06-05', status: 'active', totalAmount: 2100, paidAmount: 2100, pendingAmount: 0, billingCycle: 'monthly', createdAt: '2026-05-05', updatedAt: '2026-05-05' },
  { id: 'S003', businessId: 'demo', customerId: 'C003', customerName: 'Amit Singh', planName: 'Basic Dinner', mealPlan: 'dinner', startDate: '2026-05-10', endDate: '2026-06-10', status: 'paused', totalAmount: 1800, paidAmount: 1800, pendingAmount: 0, billingCycle: 'monthly', createdAt: '2026-05-10', updatedAt: '2026-05-10' },
  { id: 'S004', businessId: 'demo', customerId: 'C004', customerName: 'Sneha Gupta', planName: 'Premium Weekly', mealPlan: 'all_meals', startDate: '2026-05-15', endDate: '2026-06-15', status: 'active', totalAmount: 4200, paidAmount: 2100, pendingAmount: 2100, billingCycle: 'monthly', createdAt: '2026-05-15', updatedAt: '2026-05-15' },
  { id: 'S005', businessId: 'demo', customerId: 'C005', customerName: 'Vikram Joshi', planName: 'Breakfast + Lunch', mealPlan: 'breakfast_lunch', startDate: '2026-05-01', endDate: '2026-06-01', status: 'active', totalAmount: 3200, paidAmount: 3200, pendingAmount: 0, billingCycle: 'monthly', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
  { id: 'S006', businessId: 'demo', customerId: 'C006', customerName: 'Deepak Kumar', planName: 'Standard Lunch', mealPlan: 'lunch', startDate: '2026-05-01', endDate: '2026-06-01', status: 'active', totalAmount: 2100, paidAmount: 1000, pendingAmount: 1100, billingCycle: 'monthly', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
];

export const mockFoodItems: FoodItem[] = [
  { id: 'F001', businessId: 'demo', name: 'Poha', category: 'breakfast', price: 40, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F002', businessId: 'demo', name: 'Paratha with Curd', category: 'breakfast', price: 60, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F003', businessId: 'demo', name: 'Upma', category: 'breakfast', price: 35, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F004', businessId: 'demo', name: 'Idli Sambhar', category: 'breakfast', price: 50, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F005', businessId: 'demo', name: 'Dal Rice', category: 'lunch', price: 100, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F006', businessId: 'demo', name: 'Paneer Curry + Chapati', category: 'lunch', price: 140, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F007', businessId: 'demo', name: 'Rajma Chawal', category: 'lunch', price: 110, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F008', businessId: 'demo', name: 'Veg Biryani', category: 'lunch', price: 130, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F009', businessId: 'demo', name: 'Chole Bhature', category: 'lunch', price: 120, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F010', businessId: 'demo', name: 'Dal Tadka + Rice', category: 'dinner', price: 110, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F011', businessId: 'demo', name: 'Mixed Veg + Chapati', category: 'dinner', price: 120, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F012', businessId: 'demo', name: 'Kadhi Chawal', category: 'dinner', price: 100, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F013', businessId: 'demo', name: 'Salad', category: 'dinner', price: 30, isAvailable: true, isVeg: true, createdAt: '', updatedAt: '' },
  { id: 'F014', businessId: 'demo', name: 'Chapati (4 pcs)', category: 'dinner', price: 40, isAvailable: false, isVeg: true, createdAt: '', updatedAt: '' },
];

export const mockWeeklyMenu: WeeklyMenu = {
  id: 'WM001',
  businessId: 'demo',
  weekStartDate: '2026-05-25',
  weekEndDate: '2026-05-31',
  isPublished: true,
  createdAt: '',
  updatedAt: '',
  days: {
    monday: { breakfast: ['Poha', 'Tea'], lunch: ['Dal Rice', 'Salad', 'Papad'], dinner: ['Dal Tadka + Rice', 'Salad'] },
    tuesday: { breakfast: ['Paratha with Curd', 'Tea'], lunch: ['Paneer Curry + Chapati', 'Salad'], dinner: ['Mixed Veg + Chapati', 'Salad'] },
    wednesday: { breakfast: ['Upma', 'Tea'], lunch: ['Rajma Chawal', 'Salad'], dinner: ['Kadhi Chawal', 'Salad'] },
    thursday: { breakfast: ['Idli Sambhar', 'Tea'], lunch: ['Veg Biryani', 'Raita'], dinner: ['Dal Rice', 'Salad'] },
    friday: { breakfast: ['Poha', 'Tea'], lunch: ['Chole Bhature', 'Salad'], dinner: ['Paneer Curry + Chapati', 'Salad'] },
    saturday: { breakfast: ['Paratha with Curd', 'Tea'], lunch: ['Dal Rice', 'Salad', 'Papad'], dinner: ['Veg Biryani', 'Raita'] },
    sunday: { breakfast: ['Idli Sambhar', 'Tea'], lunch: ['Special Thali', 'Gulab Jamun'], dinner: ['Paneer Curry + Chapati', 'Salad'] },
  },
};

export const mockDeliveries: Delivery[] = [
  { id: 'D001', businessId: 'demo', customerId: 'C001', customerName: 'Rahul Sharma', driverId: 'DRV001', deliveryDate: '2026-05-31', mealType: 'breakfast', status: 'delivered', addressSnapshot: '42, Lake View Apartments', createdAt: '', updatedAt: '' },
  { id: 'D002', businessId: 'demo', customerId: 'C002', customerName: 'Priya Patel', driverId: 'DRV001', deliveryDate: '2026-05-31', mealType: 'lunch', status: 'in_progress', addressSnapshot: '15, Green Park Colony', createdAt: '', updatedAt: '' },
  { id: 'D003', businessId: 'demo', customerId: 'C004', customerName: 'Sneha Gupta', driverId: 'DRV002', deliveryDate: '2026-05-31', mealType: 'dinner', status: 'in_progress', addressSnapshot: '23, River View Complex', createdAt: '', updatedAt: '' },
  { id: 'D004', businessId: 'demo', customerId: 'C005', customerName: 'Vikram Joshi', driverId: 'DRV002', deliveryDate: '2026-05-31', mealType: 'lunch', status: 'pending', addressSnapshot: '56, MG Road', createdAt: '', updatedAt: '' },
  { id: 'D005', businessId: 'demo', customerId: 'C006', customerName: 'Deepak Kumar', driverId: 'DRV003', deliveryDate: '2026-05-31', mealType: 'lunch', status: 'pending', addressSnapshot: '12, Patel Nagar', createdAt: '', updatedAt: '' },
  { id: 'D006', businessId: 'demo', customerId: 'C007', customerName: 'Ananya Reddy', driverId: 'DRV003', deliveryDate: '2026-05-31', mealType: 'lunch', status: 'pending', addressSnapshot: '34, Hitech City', createdAt: '', updatedAt: '' },
];

export const mockInvoices: Invoice[] = [
  { id: 'INV001', businessId: 'demo', customerId: 'C001', customerName: 'Rahul Sharma', invoiceNumber: 'INV-001', totalAmount: 4200, paidAmount: 4200, pendingAmount: 0, status: 'paid', invoiceDate: '2026-05-01', dueDate: '2026-05-10', createdAt: '', updatedAt: '' },
  { id: 'INV002', businessId: 'demo', customerId: 'C002', customerName: 'Priya Patel', invoiceNumber: 'INV-002', totalAmount: 2100, paidAmount: 2100, pendingAmount: 0, status: 'paid', invoiceDate: '2026-05-05', dueDate: '2026-05-15', createdAt: '', updatedAt: '' },
  { id: 'INV003', businessId: 'demo', customerId: 'C003', customerName: 'Amit Singh', invoiceNumber: 'INV-003', totalAmount: 1800, paidAmount: 1800, pendingAmount: 0, status: 'paid', invoiceDate: '2026-05-10', dueDate: '2026-05-20', createdAt: '', updatedAt: '' },
  { id: 'INV004', businessId: 'demo', customerId: 'C004', customerName: 'Sneha Gupta', invoiceNumber: 'INV-004', totalAmount: 4200, paidAmount: 2100, pendingAmount: 2100, status: 'pending', invoiceDate: '2026-05-15', dueDate: '2026-05-25', createdAt: '', updatedAt: '' },
  { id: 'INV005', businessId: 'demo', customerId: 'C005', customerName: 'Vikram Joshi', invoiceNumber: 'INV-005', totalAmount: 3200, paidAmount: 3200, pendingAmount: 0, status: 'paid', invoiceDate: '2026-05-01', dueDate: '2026-05-10', createdAt: '', updatedAt: '' },
  { id: 'INV006', businessId: 'demo', customerId: 'C006', customerName: 'Deepak Kumar', invoiceNumber: 'INV-006', totalAmount: 2100, paidAmount: 1000, pendingAmount: 1100, status: 'overdue', invoiceDate: '2026-05-01', dueDate: '2026-05-10', createdAt: '', updatedAt: '' },
];

export const mockDrivers: Driver[] = [
  { id: 'DRV001', businessId: 'demo', driverName: 'Suresh Kumar', phone: '+91 99887 76655', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'DRV002', businessId: 'demo', driverName: 'Manoj Singh', phone: '+91 88776 65544', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'DRV003', businessId: 'demo', driverName: 'Rajesh Patel', phone: '+91 77665 54433', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'DRV004', businessId: 'demo', driverName: 'Dinesh Yadav', phone: '+91 66554 43322', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'DRV005', businessId: 'demo', driverName: 'Vijay Sharma', phone: '+91 55443 32211', isActive: false, createdAt: '', updatedAt: '' },
  { id: 'DRV006', businessId: 'demo', driverName: 'Arun Kumar', phone: '+91 44332 21100', isActive: true, createdAt: '', updatedAt: '' },
];

export const areas = ['Koramangala', 'Indiranagar', 'Whitefield', 'JP Nagar', 'MG Road', 'BTM Layout', 'HSR Layout', 'Jayanagar', 'Marathahalli', 'Electronic City', 'Banashankari', 'Basavanagudi', 'Malleshwaram', 'Rajajinagar', 'Vijay Nagar', 'Sadashivanagar', 'Yelahanka', 'Hebbal'];

export const batches = ['A', 'B', 'C', 'D', 'E'];

export const weeklyRevenue = [
  { day: 'Mon', revenue: 42500 },
  { day: 'Tue', revenue: 38900 },
  { day: 'Wed', revenue: 41200 },
  { day: 'Thu', revenue: 39800 },
  { day: 'Fri', revenue: 43500 },
  { day: 'Sat', revenue: 38200 },
  { day: 'Sun', revenue: 36100 },
];

export const customerGrowth = [
  { month: 'Jan', customers: 180 },
  { month: 'Feb', customers: 210 },
  { month: 'Mar', customers: 245 },
  { month: 'Apr', customers: 278 },
  { month: 'May', customers: 342 },
];
