import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  getMe, 
  updatePassword 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['superadmin', 'hod', 'teacher', 'student', 'technician']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-password', protect, updatePasswordValidation, validate, updatePassword);

export default router;
