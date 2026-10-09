import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { Branch } from '../models/Branch.js';
import { Category } from '../models/Category.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, RESTAURANT_TYPES } from '../config/constants.js';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'servora_development_jwt_super_secret_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    secret,
    { expiresIn }
  );
};

export const authController = {
  /**
   * Onboard a new Restaurant, main branch, and Owner Admin account
   */
  async registerRestaurant(req, res, next) {
    try {
      const {
        restaurantName,
        restaurantType = RESTAURANT_TYPES.CASUAL_DINING,
        currency = 'PKR',
        taxRate = 16,
        branchName = 'Main Branch',
        branchAddress = 'Main Boulevard',
        branchCity = 'Lahore',
        branchPhone = '0300-1234567',
        adminName,
        adminEmail,
        adminPassword,
        adminPhone = '',
      } = req.body;

      if (!restaurantName || !adminName || !adminEmail || !adminPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide restaurant name, admin name, email, and password.',
        });
      }

      // Check if user email already exists
      const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      // Generate slug
      const slug = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

      // 1. Create Restaurant
      const restaurant = await Restaurant.create({
        name: restaurantName,
        slug,
        type: restaurantType,
        currency,
        taxRate: Number(taxRate) || 16,
        contact: {
          email: adminEmail,
          phone: branchPhone,
          address: `${branchAddress}, ${branchCity}`,
        },
      });

      // 2. Create Main Branch
      const branch = await Branch.create({
        restaurantId: restaurant._id,
        name: branchName,
        code: 'MAIN',
        address: branchAddress,
        city: branchCity,
        phone: branchPhone,
        isMain: true,
      });

      // 3. Create Default Categories
      const defaultCategories = [
        { name: 'Main Courses', slug: 'main-courses', sortOrder: 1, iconName: 'Utensils' },
        { name: 'Appetizers & Starters', slug: 'starters', sortOrder: 2, iconName: 'Soup' },
        { name: 'Beverages & Chai', slug: 'beverages', sortOrder: 3, iconName: 'Coffee' },
        { name: 'Desserts', slug: 'desserts', sortOrder: 4, iconName: 'Cake' },
      ];

      for (const cat of defaultCategories) {
        await Category.create({
          restaurantId: restaurant._id,
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          iconName: cat.iconName,
        });
      }

      // 4. Create Owner Admin User
      const adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: ROLES.ADMIN,
        restaurantId: restaurant._id,
        branchId: branch._id,
        phone: adminPhone,
      });

      // 5. Generate Token
      const token = generateToken(adminUser);

      // Audit Log
      await AuditLog.create({
        restaurantId: restaurant._id,
        userId: adminUser._id,
        userName: adminUser.name,
        action: 'RESTAURANT_ONBOARDED',
        resource: 'Restaurant',
        resourceId: restaurant._id.toString(),
        details: { restaurantName, email: adminEmail },
      });

      res.status(201).json({
        success: true,
        message: 'Restaurant registered successfully!',
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          restaurantId: adminUser.restaurantId,
          branchId: adminUser.branchId,
        },
        restaurant,
        branch,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account is deactivated. Please contact your administrator.',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user);

      // Load Restaurant & Branches
      let restaurant = null;
      let branches = [];

      if (user.restaurantId) {
        restaurant = await Restaurant.findById(user.restaurantId);
        branches = await Branch.find({ restaurantId: user.restaurantId, isActive: true });
      }

      res.status(200).json({
        success: true,
        message: 'Logged in successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          branchId: user.branchId,
        },
        restaurant,
        branches,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Current Authenticated User & Context
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      let restaurant = null;
      let branches = [];

      if (user.restaurantId) {
        restaurant = await Restaurant.findById(user.restaurantId);
        branches = await Branch.find({ restaurantId: user.restaurantId, isActive: true });
      }

      res.status(200).json({
        success: true,
        user,
        restaurant,
        branches,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update Profile
   */
  async updateProfile(req, res, next) {
    try {
      const { name, phone, password } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (password) user.password = password;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  },
};
