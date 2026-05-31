import { createCustomer } from '@/services/customerService';
import { createFoodItem } from '@/services/foodItemService';
import { createWeeklyMenu } from '@/services/weeklyMenuService';
import { createDeliveryArea, createDelivery } from '@/services/deliveryService';
import { createSubscription } from '@/services/subscriptionService';
import { createInvoice } from '@/services/invoiceService';
import { createSystemAlert } from '@/services/notificationService';
import { updateBusinessStats } from '@/services/statsService';
import { getCurrentWeekStart } from '@/services/weeklyMenuService';

const areas = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'JP Nagar', 'MG Road',
  'BTM Layout', 'HSR Layout', 'Jayanagar',
];

const customerData = [
  { fullName: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', address: '42, Lake View Apartments', area: 'Koramangala' },
  { fullName: 'Priya Patel', email: 'priya@example.com', phone: '+91 87654 32109', address: '15, Green Park Colony', area: 'Indiranagar' },
  { fullName: 'Amit Singh', email: 'amit@example.com', phone: '+91 76543 21098', address: '8, Sunshine Apartments', area: 'Whitefield' },
  { fullName: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91 65432 10987', address: '23, River View Complex', area: 'JP Nagar' },
  { fullName: 'Vikram Joshi', email: 'vikram@example.com', phone: '+91 54321 09876', address: '56, MG Road', area: 'MG Road' },
  { fullName: 'Deepak Kumar', email: 'deepak@example.com', phone: '+91 43210 98765', address: '12, Patel Nagar', area: 'BTM Layout' },
  { fullName: 'Ananya Reddy', email: 'ananya@example.com', phone: '+91 32109 87654', address: '34, Hitech City', area: 'HSR Layout' },
  { fullName: 'Ravi Verma', email: 'ravi@example.com', phone: '+91 21098 76543', address: '7, Gandhi Nagar', area: 'Jayanagar' },
];

const foodItems = [
  { name: 'Poha', category: 'breakfast' as const, price: 40, isAvailable: true, isVeg: true },
  { name: 'Paratha with Curd', category: 'breakfast' as const, price: 60, isAvailable: true, isVeg: true },
  { name: 'Upma', category: 'breakfast' as const, price: 35, isAvailable: true, isVeg: true },
  { name: 'Idli Sambhar', category: 'breakfast' as const, price: 50, isAvailable: true, isVeg: true },
  { name: 'Dal Rice', category: 'lunch' as const, price: 100, isAvailable: true, isVeg: true },
  { name: 'Paneer Curry + Chapati', category: 'lunch' as const, price: 140, isAvailable: true, isVeg: true },
  { name: 'Rajma Chawal', category: 'lunch' as const, price: 110, isAvailable: true, isVeg: true },
  { name: 'Veg Biryani', category: 'lunch' as const, price: 130, isAvailable: true, isVeg: true },
  { name: 'Chole Bhature', category: 'lunch' as const, price: 120, isAvailable: true, isVeg: true },
  { name: 'Dal Tadka + Rice', category: 'dinner' as const, price: 110, isAvailable: true, isVeg: true },
  { name: 'Mixed Veg + Chapati', category: 'dinner' as const, price: 120, isAvailable: true, isVeg: true },
  { name: 'Kadhi Chawal', category: 'dinner' as const, price: 100, isAvailable: true, isVeg: true },
  { name: 'Chapati (4 pcs)', category: 'dinner' as const, price: 40, isAvailable: true, isVeg: true },
  { name: 'Egg Curry + Rice', category: 'lunch' as const, price: 120, isAvailable: true, isVeg: false },
];

const weeklyMenuDays = {
  monday: { breakfast: ['Poha', 'Tea'], lunch: ['Dal Rice', 'Salad', 'Papad'], dinner: ['Dal Tadka + Rice', 'Salad'] },
  tuesday: { breakfast: ['Paratha with Curd', 'Tea'], lunch: ['Paneer Curry + Chapati', 'Salad'], dinner: ['Mixed Veg + Chapati', 'Salad'] },
  wednesday: { breakfast: ['Upma', 'Tea'], lunch: ['Rajma Chawal', 'Salad'], dinner: ['Kadhi Chawal', 'Salad'] },
  thursday: { breakfast: ['Idli Sambhar', 'Tea'], lunch: ['Veg Biryani', 'Raita'], dinner: ['Dal Rice', 'Salad'] },
  friday: { breakfast: ['Poha', 'Tea'], lunch: ['Chole Bhature', 'Salad'], dinner: ['Paneer Curry + Chapati', 'Salad'] },
  saturday: { breakfast: ['Paratha with Curd', 'Tea'], lunch: ['Dal Rice', 'Salad', 'Papad'], dinner: ['Veg Biryani', 'Raita'] },
  sunday: { breakfast: ['Idli Sambhar', 'Tea'], lunch: ['Special Thali', 'Gulab Jamun'], dinner: ['Paneer Curry + Chapati', 'Salad'] },
};

export async function seedDemoBusinessData(businessId: string) {
  const customerIds: string[] = [];

  // Customers
  for (const c of customerData) {
    const { id } = await createCustomer(businessId, {
      ...c,
      landmark: '',
      mealPreference: '',
      weekendServiceRequired: Math.random() > 0.5,
      specialNotes: '',
      status: Math.random() > 0.2 ? 'active' : 'paused',
      subscriptionStatus: Math.random() > 0.2 ? 'active' : 'none',
      paymentStatus: Math.random() > 0.3 ? 'paid' : Math.random() > 0.5 ? 'pending' : 'overdue',
    });
    customerIds.push(id);
  }

  // Food Items
  for (const item of foodItems) {
    await createFoodItem(businessId, item);
  }

  // Weekly Menu
  await createWeeklyMenu(businessId, getCurrentWeekStart(), weeklyMenuDays as any);

  // Delivery Areas
  for (const area of areas) {
    await createDeliveryArea(businessId, area);
  }

  // Subscriptions
  if (customerIds.length > 0) {
    for (const custId of customerIds.slice(0, 5)) {
      await createSubscription(businessId, {
        customerId: custId,
        customerName: customerData[customerIds.indexOf(custId)]?.fullName || '',
        planName: 'Premium Weekly',
        mealPlan: 'all_meals',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        status: 'active',
        totalAmount: 4200,
        paidAmount: Math.random() > 0.3 ? 4200 : 2100,
        pendingAmount: 0,
        billingCycle: 'monthly',
      });
    }
  }

  // Invoices
  for (const custId of customerIds.slice(0, 6)) {
    await createInvoice(businessId, {
      customerId: custId,
      customerName: customerData[customerIds.indexOf(custId)]?.fullName || '',
      totalAmount: 4200,
      paidAmount: Math.random() > 0.3 ? 4200 : 0,
      pendingAmount: Math.random() > 0.3 ? 0 : 4200,
      status: Math.random() > 0.3 ? 'paid' : 'pending',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    });
  }

  // System Alerts
  await createSystemAlert(businessId, {
    title: 'Welcome to FoodiFirm!',
    message: 'Your demo data has been seeded successfully.',
    category: 'system',
    priority: 'low',
  });

  await createSystemAlert(businessId, {
    title: 'Payment Reminder',
    message: '2 customers have overdue payments.',
    category: 'payment',
    priority: 'medium',
  });

  // Deliveries
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < Math.min(customerIds.length, 5); i++) {
    await createDelivery(businessId, {
      customerId: customerIds[i],
      customerName: customerData[i]?.fullName || '',
      deliveryDate: today,
      mealType: i % 3 === 0 ? 'breakfast' : i % 3 === 1 ? 'lunch' : 'dinner',
      status: i < 2 ? 'delivered' : i < 4 ? 'in_progress' : 'pending',
      addressSnapshot: customerData[i]?.address || '',
    });
  }

  // Stats
  await updateBusinessStats(businessId, {
    totalRevenue: 1584200,
    activeCustomers: customerData.length,
    newCustomersThisWeek: customerData.length,
    activeSubscriptions: 5,
    pendingPayments: 2,
    deliveriesToday: 5,
    activeDrivers: 3,
    areasCovered: areas.length,
  });

  return { customers: customerIds.length, items: foodItems.length };
}
