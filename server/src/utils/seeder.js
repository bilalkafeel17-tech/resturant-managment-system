import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Restaurant } from '../models/Restaurant.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Ingredient } from '../models/Ingredient.js';
import { Recipe } from '../models/Recipe.js';
import { Supplier } from '../models/Supplier.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Expense } from '../models/Expense.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { ROLES, RESTAURANT_TYPES, ORDER_TYPES, ORDER_STATUS, PAYMENT_STATUS, TABLE_STATUS, INVENTORY_UNITS } from '../config/constants.js';

dotenv.config();

export const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/servora_db';
  console.log(`[Seeder] Connecting to ${uri}...`);
  await mongoose.connect(uri);

  console.log('[Seeder] Cleaning existing demo collections...');
  await Promise.all([
    Restaurant.deleteMany({}),
    Branch.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Table.deleteMany({}),
    Ingredient.deleteMany({}),
    Recipe.deleteMany({}),
    Supplier.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    InventoryMovement.deleteMany({}),
  ]);

  console.log('[Seeder] Creating Restaurant...');
  const restaurant = await Restaurant.create({
    name: 'Lahore Grill & Cafe',
    slug: 'lahore-grill-cafe',
    type: RESTAURANT_TYPES.CASUAL_DINING,
    tagline: 'Authentic Charcoal Grills, Handis & Artisanal Cafe',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    taxRate: 16.0,
    taxName: 'PRA GST (16%)',
    taxNumber: 'NTN-7392810-4',
    serviceChargeRate: 5.0,
    receiptSettings: {
      headerText: 'Welcome to Lahore Grill & Cafe! Thank you for dining with us.',
      footerText: 'GST Reg # 7392810-4 | Feedback WhatsApp: 0300-8889999',
      showTaxNumber: true,
      showWifiDetails: true,
      wifiDetails: 'SSID: LahoreGrill_Guest | Pass: grill2026',
      paperSize: '80mm',
    },
    contact: {
      email: 'admin@lahoregrill.pk',
      phone: '042-35789000',
      website: 'https://lahoregrill.pk',
      address: 'Main Boulevard, Gulberg III, Lahore',
    },
  });

  console.log('[Seeder] Creating Branches...');
  const branchGulberg = await Branch.create({
    restaurantId: restaurant._id,
    name: 'Gulberg Flagship Branch',
    code: 'GLB-01',
    address: 'Plot 42-B, Main Boulevard, Gulberg III',
    city: 'Lahore',
    phone: '042-35789001',
    isMain: true,
  });

  const branchDHA = await Branch.create({
    restaurantId: restaurant._id,
    name: 'DHA Phase 5 Branch',
    code: 'DHA-02',
    address: 'Sector C, Commercial Area, DHA Phase 5',
    city: 'Lahore',
    phone: '042-35789002',
    isMain: false,
  });

  console.log('[Seeder] Creating Staff Accounts...');
  const superadmin = await User.create({
    name: 'Platform Administrator',
    email: 'superadmin@servora.io',
    password: 'SuperAdmin@1234',
    role: ROLES.SUPERADMIN,
    phone: '0300-0000000',
  });

  const restaurantAdmin = await User.create({
    name: 'Hamza Khan (Owner)',
    email: 'admin@lahoregrill.pk',
    password: 'Admin@1234',
    role: ROLES.ADMIN,
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    phone: '0300-1112233',
  });

  const managerGulberg = await User.create({
    name: 'Bilal Ahmed (Branch Manager)',
    email: 'manager.gulberg@lahoregrill.pk',
    password: 'Manager@1234',
    role: ROLES.MANAGER,
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    phone: '0301-2223344',
  });

  const cashier = await User.create({
    name: 'Zainab Tariq (Cashier)',
    email: 'cashier@lahoregrill.pk',
    password: 'Cashier@1234',
    role: ROLES.CASHIER,
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    phone: '0302-3334455',
  });

  const kitchenChef = await User.create({
    name: 'Ustad Farooq (Head Chef)',
    email: 'kitchen@lahoregrill.pk',
    password: 'Kitchen@1234',
    role: ROLES.KITCHEN,
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    phone: '0303-4445566',
  });

  console.log('[Seeder] Creating Categories...');
  const catKarahi = await Category.create({
    restaurantId: restaurant._id,
    name: 'Desi Karahi & Handi',
    slug: 'karahi-handi',
    sortOrder: 1,
    iconName: 'Flame',
    description: 'Freshly cooked in organic Desi Ghee over charcoal flames',
  });

  const catBBQ = await Category.create({
    restaurantId: restaurant._id,
    name: 'Charcoal BBQ',
    slug: 'charcoal-bbq',
    sortOrder: 2,
    iconName: 'Utensils',
    description: 'Tender marinated meats grilled over live coals',
  });

  const catBurgers = await Category.create({
    restaurantId: restaurant._id,
    name: 'Gourmet Burgers',
    slug: 'gourmet-burgers',
    sortOrder: 3,
    iconName: 'Sandwich',
    description: 'Fresh smashed patties, brioche buns, melted cheddar',
  });

  const catRice = await Category.create({
    restaurantId: restaurant._id,
    name: 'Biryani & Rice',
    slug: 'biryani-rice',
    sortOrder: 4,
    iconName: 'Soup',
    description: 'Long-grain aged basmati rice cooked with whole spices',
  });

  const catBeverages = await Category.create({
    restaurantId: restaurant._id,
    name: 'Chai & Cold Drinks',
    slug: 'beverages-chai',
    sortOrder: 5,
    iconName: 'Coffee',
    description: 'Karak doodh patti, coolers, and mocktails',
  });

  const catDesserts = await Category.create({
    restaurantId: restaurant._id,
    name: 'Traditional Desserts',
    slug: 'desserts',
    sortOrder: 6,
    iconName: 'Cake',
    description: 'Sweet indulgences made in pure milk and khoya',
  });

  console.log('[Seeder] Creating Suppliers & Ingredients...');
  const supplierMeat = await Supplier.create({
    restaurantId: restaurant._id,
    name: 'Punjab Halal Meats & Poultry',
    contactPerson: 'Malik Shakeel',
    phone: '0321-4445555',
    email: 'orders@punjabmeats.pk',
    category: 'Meat & Poultry',
  });

  const supplierDairy = await Supplier.create({
    restaurantId: restaurant._id,
    name: 'Al-Madina Pure Dairy Farm',
    contactPerson: 'Chaudhry Akram',
    phone: '0322-5556666',
    email: 'sales@almadinadairy.pk',
    category: 'Dairy & Ghee',
  });

  const supplierGrains = await Supplier.create({
    restaurantId: restaurant._id,
    name: 'Lahore Spice & Grain Traders',
    contactPerson: 'Haji Aslam',
    phone: '0323-6667777',
    category: 'Grains & Spices',
  });

  // Ingredients for Gulberg
  const ingMutton = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Fresh Mutton (Bone-in)',
    category: 'Meat',
    unit: INVENTORY_UNITS.KG,
    currentStock: 45.0,
    minStockAlert: 10.0,
    costPerUnit: 2200,
    supplierId: supplierMeat._id,
  });

  const ingChicken = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Fresh Chicken Boneless / Cut',
    category: 'Meat',
    unit: INVENTORY_UNITS.KG,
    currentStock: 80.0,
    minStockAlert: 15.0,
    costPerUnit: 850,
    supplierId: supplierMeat._id,
  });

  const ingBeef = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Minced Beef (Smash Patty)',
    category: 'Meat',
    unit: INVENTORY_UNITS.KG,
    currentStock: 30.0,
    minStockAlert: 8.0,
    costPerUnit: 1400,
    supplierId: supplierMeat._id,
  });

  const ingGhee = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Pure Desi Ghee',
    category: 'Dairy',
    unit: INVENTORY_UNITS.KG,
    currentStock: 25.0,
    minStockAlert: 5.0,
    costPerUnit: 2600,
    supplierId: supplierDairy._id,
  });

  const ingRice = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Super Kernel Basmati Rice',
    category: 'Grains',
    unit: INVENTORY_UNITS.KG,
    currentStock: 120.0,
    minStockAlert: 25.0,
    costPerUnit: 380,
    supplierId: supplierGrains._id,
  });

  const ingMilk = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Fresh Whole Milk',
    category: 'Dairy',
    unit: INVENTORY_UNITS.LTR,
    currentStock: 60.0,
    minStockAlert: 12.0,
    costPerUnit: 210,
    supplierId: supplierDairy._id,
  });

  const ingBuns = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Brioche Burger Buns',
    category: 'Bakery',
    unit: INVENTORY_UNITS.PCS,
    currentStock: 65,
    minStockAlert: 15,
    costPerUnit: 60,
  });

  const ingTomatoes = await Ingredient.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    name: 'Fresh Tomatoes & Ginger',
    category: 'Produce',
    unit: INVENTORY_UNITS.KG,
    currentStock: 40.0,
    minStockAlert: 10.0,
    costPerUnit: 180,
  });

  console.log('[Seeder] Creating Menu Items...');
  const itemMuttonKarahi = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catKarahi._id,
    name: 'Mutton Desi Ghee Karahi',
    description: 'Prime mutton cuts simmered in pure Desi Ghee with ginger slivers and green chilies.',
    basePrice: 1950,
    costPrice: 1100,
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    preparationTimeMinutes: 25,
    variants: [
      { name: 'Half (500g)', priceDelta: 0, isDefault: true },
      { name: 'Full (1kg)', priceDelta: 1800, isDefault: false },
    ],
    addOns: [
      { name: 'Extra Roghani Naan', price: 90 },
      { name: 'Zeera Raita & Salad', price: 120 },
    ],
    hasRecipe: true,
  });

  const itemChickenShinwari = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catKarahi._id,
    name: 'Chicken Shinwari Karahi',
    description: 'Authentic Peshawar Shinwari style cooked with only tomatoes, green chilies, and black pepper.',
    basePrice: 1250,
    costPrice: 650,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    preparationTimeMinutes: 20,
    variants: [
      { name: 'Half (500g)', priceDelta: 0, isDefault: true },
      { name: 'Full (1kg)', priceDelta: 1150, isDefault: false },
    ],
    addOns: [
      { name: 'Garlic Naan', price: 110 },
      { name: 'Mint Chutney', price: 60 },
    ],
    hasRecipe: true,
  });

  const itemReshmiKebab = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catBBQ._id,
    name: 'Melt-in-Mouth Chicken Reshmi Kebab',
    description: 'Skewered minced chicken infused with cream, saffron, and subtle cardamom.',
    basePrice: 980,
    costPrice: 420,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    preparationTimeMinutes: 18,
    variants: [
      { name: '4 Pieces', priceDelta: 0, isDefault: true },
      { name: '8 Pieces', priceDelta: 850, isDefault: false },
    ],
    hasRecipe: true,
  });

  const itemSmashBurger = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catBurgers._id,
    name: 'Servora Signature Smash Burger',
    description: 'Double smashed beef patties, caramelized onions, secret sauce on a toasted brioche bun.',
    basePrice: 1190,
    costPrice: 520,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    preparationTimeMinutes: 12,
    variants: [
      { name: 'Single Patty', priceDelta: -200, isDefault: false },
      { name: 'Double Patty', priceDelta: 0, isDefault: true },
      { name: 'Triple Patty', priceDelta: 350, isDefault: false },
    ],
    addOns: [
      { name: 'Extra Cheddar Slice', price: 120 },
      { name: 'Crispy Fries & Dip', price: 220 },
    ],
    hasRecipe: true,
  });

  const itemBiryani = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catRice._id,
    name: 'Dum Pukht Chicken Biryani',
    description: 'Aromatic layered basmati rice with marinated chicken, saffron, and fried onions.',
    basePrice: 750,
    costPrice: 310,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    preparationTimeMinutes: 10,
    addOns: [
      { name: 'Extra Boiled Egg', price: 70 },
      { name: 'Fresh Cucumber Raita', price: 90 },
    ],
    hasRecipe: true,
  });

  const itemChai = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catBeverages._id,
    name: 'Karak Doodh Patti Chai',
    description: 'Brewed with pure farm fresh milk and crushed cardamom seeds in a clay cup.',
    basePrice: 220,
    costPrice: 65,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
    hasRecipe: true,
  });

  const itemMintMargarita = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catBeverages._id,
    name: 'Fresh Mint Cooler & Margarita',
    description: 'Crushed organic mint leaves, lime juice, rock salt, and sparkling soda.',
    basePrice: 380,
    costPrice: 90,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
  });

  const itemKheer = await MenuItem.create({
    restaurantId: restaurant._id,
    categoryId: catDesserts._id,
    name: 'Shahi Matka Kheer',
    description: 'Slow cooked rice pudding topped with pistachios, almonds, and silver vark.',
    basePrice: 350,
    costPrice: 110,
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
  });

  console.log('[Seeder] Creating Recipes for Auto Stock Deduction...');
  // Recipe for Mutton Karahi
  await Recipe.create({
    restaurantId: restaurant._id,
    menuItemId: itemMuttonKarahi._id,
    variantName: 'Half (500g)',
    yieldQuantity: 1,
    ingredients: [
      { ingredientId: ingMutton._id, quantity: 0.5, unit: INVENTORY_UNITS.KG },
      { ingredientId: ingGhee._id, quantity: 0.1, unit: INVENTORY_UNITS.KG },
      { ingredientId: ingTomatoes._id, quantity: 0.2, unit: INVENTORY_UNITS.KG },
    ],
    instructions: 'Heat Desi Ghee in wok, sear mutton with salt and ginger paste, simmer with fresh tomatoes until tender.',
  });

  // Recipe for Smash Burger
  await Recipe.create({
    restaurantId: restaurant._id,
    menuItemId: itemSmashBurger._id,
    variantName: 'Double Patty',
    yieldQuantity: 1,
    ingredients: [
      { ingredientId: ingBeef._id, quantity: 0.22, unit: INVENTORY_UNITS.KG },
      { ingredientId: ingBuns._id, quantity: 1, unit: INVENTORY_UNITS.PCS },
    ],
    instructions: 'Smash two 110g beef balls on high heat flat top, season with salt/pepper, flip, cheese, and assemble.',
  });

  // Recipe for Chai
  await Recipe.create({
    restaurantId: restaurant._id,
    menuItemId: itemChai._id,
    yieldQuantity: 1,
    ingredients: [
      { ingredientId: ingMilk._id, quantity: 0.25, unit: INVENTORY_UNITS.LTR },
    ],
    instructions: 'Boil black tea in milk with cardamom, aerate with ladle until thick and aromatic.',
  });

  console.log('[Seeder] Creating Tables for Gulberg Branch...');
  const tables = [];
  const sections = ['Main Dining', 'Main Dining', 'Family Hall', 'Family Hall', 'Outdoor Patio', 'Outdoor Patio'];
  for (let i = 1; i <= 8; i++) {
    const table = await Table.create({
      restaurantId: restaurant._id,
      branchId: branchGulberg._id,
      tableNumber: `T-${i < 10 ? '0' + i : i}`,
      capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
      section: sections[(i - 1) % sections.length],
      status: i === 1 ? TABLE_STATUS.OCCUPIED : TABLE_STATUS.AVAILABLE,
    });
    tables.push(table);
  }

  console.log('[Seeder] Creating Realistic Orders & Payments for Today...');
  const now = new Date();

  // Order 1: Completed Dine-in
  const order1 = await Order.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    orderNumber: 'ORD-20261009-001',
    orderType: ORDER_TYPES.DINE_IN,
    tableId: tables[1]._id,
    tableNameSnapshot: `Table ${tables[1].tableNumber} (Main Dining)`,
    customerInfo: { name: 'Dr. Usman Tariq', phone: '0300-9876543' },
    items: [
      {
        menuItemId: itemMuttonKarahi._id,
        nameSnapshot: itemMuttonKarahi.name,
        unitPriceSnapshot: 1950,
        quantity: 1,
        variantSnapshot: { name: 'Half (500g)', priceDelta: 0 },
        addOnsSnapshot: [{ name: 'Extra Roghani Naan', price: 90 }],
        itemSubtotal: 2040,
        itemStatus: 'served',
      },
      {
        menuItemId: itemChai._id,
        nameSnapshot: itemChai.name,
        unitPriceSnapshot: 220,
        quantity: 2,
        itemSubtotal: 440,
        itemStatus: 'served',
      },
    ],
    subtotal: 2480,
    discountType: 'none',
    discountAmount: 0,
    taxRateSnapshot: 16,
    taxAmount: 396.8,
    serviceChargeRateSnapshot: 5,
    serviceChargeAmount: 124,
    grandTotal: 3000.8,
    status: ORDER_STATUS.COMPLETED,
    paymentStatus: PAYMENT_STATUS.PAID,
    cashierId: cashier._id,
    paidAt: new Date(now.getTime() - 45 * 60000),
    completedAt: new Date(now.getTime() - 40 * 60000),
    isDemo: true,
  });

  await Payment.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    orderId: order1._id,
    amount: 3000.8,
    currency: 'PKR',
    paymentMethod: 'cash',
    status: PAYMENT_STATUS.PAID,
    transactionReference: `CASH_${Date.now() - 30000}`,
    cashGiven: 3500,
    changeReturned: 499.2,
    processedBy: cashier._id,
    paidAt: new Date(now.getTime() - 45 * 60000),
  });

  // Order 2: Active in kitchen
  const order2 = await Order.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    orderNumber: 'ORD-20261009-002',
    orderType: ORDER_TYPES.DINE_IN,
    tableId: tables[0]._id,
    tableNameSnapshot: `Table ${tables[0].tableNumber} (Main Dining)`,
    customerInfo: { name: 'Ayesha Raza', phone: '0321-7788990' },
    items: [
      {
        menuItemId: itemSmashBurger._id,
        nameSnapshot: itemSmashBurger.name,
        unitPriceSnapshot: 1190,
        quantity: 2,
        variantSnapshot: { name: 'Double Patty', priceDelta: 0 },
        addOnsSnapshot: [{ name: 'Crispy Fries & Dip', price: 220 }],
        itemSubtotal: 2820,
        itemStatus: 'cooking',
      },
      {
        menuItemId: itemMintMargarita._id,
        nameSnapshot: itemMintMargarita.name,
        unitPriceSnapshot: 380,
        quantity: 2,
        itemSubtotal: 760,
        itemStatus: 'ready',
      },
    ],
    subtotal: 3580,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 358,
    taxRateSnapshot: 16,
    taxAmount: 515.52,
    serviceChargeRateSnapshot: 5,
    serviceChargeAmount: 161.1,
    grandTotal: 3898.62,
    status: ORDER_STATUS.IN_KITCHEN,
    paymentStatus: PAYMENT_STATUS.UNPAID,
    cashierId: cashier._id,
    isDemo: true,
  });

  // Link Table 1 to active order
  tables[0].activeOrderId = order2._id;
  await tables[0].save();

  // Order 3: Takeaway Paid via Safepay
  const order3 = await Order.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    orderNumber: 'ORD-20261009-003',
    orderType: ORDER_TYPES.TAKEAWAY,
    customerInfo: { name: 'Ali Shan', phone: '0333-5551234' },
    items: [
      {
        menuItemId: itemBiryani._id,
        nameSnapshot: itemBiryani.name,
        unitPriceSnapshot: 750,
        quantity: 3,
        itemSubtotal: 2250,
        itemStatus: 'ready',
      },
    ],
    subtotal: 2250,
    discountType: 'none',
    discountAmount: 0,
    taxRateSnapshot: 16,
    taxAmount: 360,
    serviceChargeRateSnapshot: 0,
    serviceChargeAmount: 0,
    grandTotal: 2610,
    status: ORDER_STATUS.READY,
    paymentStatus: PAYMENT_STATUS.PAID,
    cashierId: cashier._id,
    paidAt: new Date(now.getTime() - 10 * 60000),
    isDemo: true,
  });

  await Payment.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    orderId: order3._id,
    amount: 2610,
    currency: 'PKR',
    paymentMethod: 'safepay',
    status: PAYMENT_STATUS.PAID,
    transactionReference: `SF_TXN_${Date.now() - 10000}`,
    providerTrackerToken: 'track_sand_demo_safepay_99218',
    processedBy: cashier._id,
    paidAt: new Date(now.getTime() - 10 * 60000),
  });

  console.log('[Seeder] Creating Operating Expenses...');
  await Expense.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    title: 'Lesco Electricity Bill (September)',
    category: 'utilities',
    amount: 145000,
    expenseDate: new Date(now.getTime() - 2 * 24 * 3600000),
    paymentMethod: 'bank_transfer',
    recordedBy: managerGulberg._id,
    referenceNumber: 'LESCO-992104',
  });

  await Expense.create({
    restaurantId: restaurant._id,
    branchId: branchGulberg._id,
    title: 'Kitchen Cleaning & Sanitary Supplies',
    category: 'supplies',
    amount: 12500,
    expenseDate: new Date(now.getTime() - 1 * 24 * 3600000),
    paymentMethod: 'cash',
    recordedBy: cashier._id,
  });

  console.log(`
=====================================================
  ✅ Database Seeded Successfully!
  🍽️ Restaurant: Lahore Grill & Cafe
  🏢 Branches: Gulberg Main, DHA Phase 5
  
  🔑 Demo Credentials:
  - Platform Admin: superadmin@servora.io / SuperAdmin@1234
  - Restaurant Owner: admin@lahoregrill.pk / Admin@1234
  - Branch Manager: manager.gulberg@lahoregrill.pk / Manager@1234
  - Cashier: cashier@lahoregrill.pk / Cashier@1234
  - Kitchen Staff: kitchen@lahoregrill.pk / Kitchen@1234
=====================================================
  `);
};

if (process.argv[1]?.endsWith('seeder.js')) {
  seedDatabase()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seeder Failed]', err);
      process.exit(1);
    });
}
