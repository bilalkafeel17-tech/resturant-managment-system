import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ROLES, ROLE_HIERARCHY } from '../config/constants.js';

/**
 * Authentication Middleware
 * Validates JWT in Authorization header and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.servora_token) {
      token = req.cookies.servora_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    const secret = process.env.JWT_SECRET || 'servora_development_jwt_super_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your restaurant administrator.',
      });
    }

    req.user = user;
    
    // Set effective tenant context
    if (user.role === ROLES.SUPERADMIN) {
      // Superadmin can inspect any restaurant by passing x-restaurant-id header or query
      const headerRestaurantId = req.headers['x-restaurant-id'] || req.query.restaurantId;
      req.restaurantId = headerRestaurantId || user.restaurantId || null;
    } else {
      // Enforce strict tenant isolation: always bind to user's assigned restaurant
      req.restaurantId = user.restaurantId;
    }

    // Branch context: user branch or requested branch header
    const requestedBranchId = req.headers['x-branch-id'] || req.query.branchId;
    req.branchId = requestedBranchId || user.branchId || null;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid session token. Please log in again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware
 * @param  {...string} roles Allowed roles for this endpoint
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Superadmin has access to everything
    if (req.user.role === ROLES.SUPERADMIN) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

/**
 * Tenant Isolation Enforcement Middleware
 * Guarantees that requests operate strictly on the authenticated tenant's data
 */
export const requireTenant = (req, res, next) => {
  if (!req.restaurantId && req.user?.role !== ROLES.SUPERADMIN) {
    return res.status(400).json({
      success: false,
      message: 'Active restaurant tenant context is required.',
    });
  }
  next();
};
