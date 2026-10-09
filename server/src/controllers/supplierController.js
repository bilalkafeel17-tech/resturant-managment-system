import { Supplier } from '../models/Supplier.js';

export const supplierController = {
  async getSuppliers(req, res, next) {
    try {
      const suppliers = await Supplier.find({
        restaurantId: req.restaurantId,
        isActive: true,
      }).sort({ name: 1 });

      res.status(200).json({ success: true, count: suppliers.length, suppliers });
    } catch (error) {
      next(error);
    }
  },

  async createSupplier(req, res, next) {
    try {
      const { name, contactPerson = '', email = '', phone, address = '', category = 'General', paymentTerms = 'Net 30' } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Supplier name and phone are required.' });
      }

      const supplier = await Supplier.create({
        restaurantId: req.restaurantId,
        name,
        contactPerson,
        email,
        phone,
        address,
        category,
        paymentTerms,
      });

      res.status(201).json({ success: true, message: 'Supplier created successfully!', supplier });
    } catch (error) {
      next(error);
    }
  },

  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const { name, contactPerson, email, phone, address, category, paymentTerms, isActive } = req.body;

      const supplier = await Supplier.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      if (name) supplier.name = name;
      if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
      if (email !== undefined) supplier.email = email;
      if (phone) supplier.phone = phone;
      if (address !== undefined) supplier.address = address;
      if (category) supplier.category = category;
      if (paymentTerms) supplier.paymentTerms = paymentTerms;
      if (isActive !== undefined) supplier.isActive = isActive;

      await supplier.save();

      res.status(200).json({ success: true, message: 'Supplier updated successfully!', supplier });
    } catch (error) {
      next(error);
    }
  },
};
