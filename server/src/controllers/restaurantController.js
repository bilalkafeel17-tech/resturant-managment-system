import { Restaurant } from '../models/Restaurant.js';
import { AuditLog } from '../models/AuditLog.js';

export const restaurantController = {
  /**
   * Get Settings for current tenant restaurant
   */
  async getRestaurantSettings(req, res, next) {
    try {
      const restaurant = await Restaurant.findById(req.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }
      res.status(200).json({ success: true, restaurant });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update Restaurant Settings (Admin only)
   */
  async updateRestaurantSettings(req, res, next) {
    try {
      const {
        name,
        tagline,
        currency,
        currencySymbol,
        taxRate,
        taxName,
        taxNumber,
        serviceChargeRate,
        receiptSettings,
        contact,
        type,
      } = req.body;

      const restaurant = await Restaurant.findById(req.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      if (name) restaurant.name = name;
      if (tagline !== undefined) restaurant.tagline = tagline;
      if (currency) restaurant.currency = currency;
      if (currencySymbol) restaurant.currencySymbol = currencySymbol;
      if (taxRate !== undefined) restaurant.taxRate = Number(taxRate);
      if (taxName !== undefined) restaurant.taxName = taxName;
      if (taxNumber !== undefined) restaurant.taxNumber = taxNumber;
      if (serviceChargeRate !== undefined) restaurant.serviceChargeRate = Number(serviceChargeRate);
      if (type) restaurant.type = type;

      if (receiptSettings) {
        restaurant.receiptSettings = {
          ...restaurant.receiptSettings,
          ...receiptSettings,
        };
      }

      if (contact) {
        restaurant.contact = {
          ...restaurant.contact,
          ...contact,
        };
      }

      await restaurant.save();

      await AuditLog.create({
        restaurantId: restaurant._id,
        userId: req.user._id,
        userName: req.user.name,
        action: 'RESTAURANT_SETTINGS_UPDATED',
        resource: 'Restaurant',
        resourceId: restaurant._id.toString(),
        details: req.body,
      });

      res.status(200).json({
        success: true,
        message: 'Restaurant settings updated successfully!',
        restaurant,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Superadmin: List all restaurants
   */
  async getAllRestaurants(req, res, next) {
    try {
      const restaurants = await Restaurant.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, count: restaurants.length, restaurants });
    } catch (error) {
      next(error);
    }
  },
};
