import { Request, Response } from 'express';
import { AuthRequest } from '@/types';
import { sendSuccess, sendError } from '@/utils/response';
import { generateTokens, verifyRefreshToken, setTokenCookies, clearTokenCookies, extractToken } from '@/utils/jwt';
import { resetProgressiveDelay } from '@/middleware/rateLimiter';
import { resetEmailRateLimit } from '@/middleware/passwordResetLimiter';
import { resetEmailVerificationRateLimit } from '@/middleware/emailVerificationLimiter';
import User from '@/models/User';
import emailService from '@/services/emailService';
import crypto from 'crypto';

// Backend protection against concurrent verification requests
const verificationInProgress = new Map<string, number>(); // token -> timestamp

const cleanupExpiredVerifications = () => {
  const now = Date.now();
  const expiredTokens: string[] = [];

  verificationInProgress.forEach((timestamp, token) => {
    if (now - timestamp > 30000) { // 30 seconds
      expiredTokens.push(token);
    }
  });

  expiredTokens.forEach(token => {
    console.log(`🧹 Backend cleanup expired verification: ${token.substring(0, 10)}...`);
    verificationInProgress.delete(token);
  });
};

// Run cleanup every 15 seconds
setInterval(cleanupExpiredVerifications, 15000);

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'User with this email already exists', 400);
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Send email verification email automatically
    try {
      const verificationToken = user.generateEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const emailSent = await emailService.sendEmailVerification(user, verificationToken);
      if (emailSent) {
        console.log(`✅ Email verification sent to new user: ${user.email}`);
      } else {
        console.error(`❌ Failed to send verification email to new user: ${user.email}`);
        // Don't fail registration if email fails, just log it
      }
    } catch (emailError) {
      console.error('Email verification sending error during registration:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens with remember me option
    const rememberMe = req.body.rememberMe || false;
    const tokens = generateTokens({
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    }, { rememberMe });

    // Set secure cookies
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken, rememberMe);

    // Update last login
    await user.updateLastLogin();

    sendSuccess(res, 'User registered successfully. Please check your email to verify your account.', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      ...tokens
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Registration failed', 500);
  }
};

/**
 * Login user with enhanced security
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Find user with password and login attempts
    const user = await User.findOne({ email, isActive: true }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 1000);
      sendError(res, `Account is temporarily locked. Try again in ${lockTimeRemaining} seconds.`, 423, {
        lockTimeRemaining,
        lockedUntil: user.lockUntil
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();

      // Check if account is now locked after this attempt
      const updatedUser = await User.findById(user._id).select('+lockUntil');
      if (updatedUser?.isLocked()) {
        sendError(res, 'Too many failed login attempts. Account has been temporarily locked for 2 minutes.', 423);
      } else {
        const attemptsLeft = 5 - (user.loginAttempts + 1);
        sendError(res, `Invalid email or password. ${attemptsLeft} attempts remaining.`, 401, {
          attemptsRemaining: attemptsLeft
        });
      }
      return;
    }

    // Successful login - reset login attempts
    await user.resetLoginAttempts();

    // Reset progressive delay for this IP
    resetProgressiveDelay(clientIP);

    // Generate tokens with remember me option
    const tokens = generateTokens({
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    }, { rememberMe });

    // Set secure cookies
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken, rememberMe);

    // Update last login
    await user.updateLastLogin();

    sendSuccess(res, 'Login successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin
      },
      ...tokens,
      rememberMe
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Try to get refresh token from cookies first, then from body
    let refreshTokenValue = req.cookies?.refreshToken || req.body.refreshToken;
    const rememberMe = req.cookies?.rememberMe === 'true' || req.body.rememberMe || false;

    if (!refreshTokenValue) {
      sendError(res, 'Refresh token is required', 400);
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenValue);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      // Clear invalid cookies
      clearTokenCookies(res);
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    }, { rememberMe });

    // Set new cookies
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken, rememberMe);

    sendSuccess(res, 'Token refreshed successfully', {
      ...tokens,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear invalid cookies
    clearTokenCookies(res);
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, 'Profile retrieved successfully', {
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to retrieve profile', 500);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const { name, avatar } = req.body;
    const allowedUpdates = { name, avatar };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
        delete allowedUpdates[key as keyof typeof allowedUpdates];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    sendSuccess(res, 'Profile updated successfully', {
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', 500);
  }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', 500);
  }
};

/**
 * Logout user (clear cookies and tokens)
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Clear authentication cookies
    clearTokenCookies(res);

    sendSuccess(res, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Logout failed', 500);
  }
};

/**
 * Forgot password - Send password reset email
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with that email exists, we have sent a password reset link.';

    if (!user) {
      console.log(`🔍 Password reset requested for non-existent email: ${email}`);
      sendSuccess(res, successMessage);
      return;
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();

    // Save the user with the reset token
    await user.save({ validateBeforeSave: false });

    try {
      // Send password reset email
      const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);

      if (emailSent) {
        console.log(`✅ Password reset email sent to: ${email}`);
        sendSuccess(res, successMessage);
      } else {
        console.error(`❌ Failed to send password reset email to: ${email}`);
        // Clear the reset token if email failed
        user.clearPasswordResetToken();
        sendError(res, 'Failed to send password reset email. Please try again.', 500);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Clear the reset token if email failed
      user.clearPasswordResetToken();
      sendError(res, 'Failed to send password reset email. Please try again.', 500);
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'An error occurred while processing your request. Please try again.', 500);
  }
};

/**
 * Verify password reset token
 */
export const verifyResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      sendError(res, 'Reset token is required', 400);
      return;
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true
    });

    if (!user) {
      sendError(res, 'Invalid or expired reset token', 400);
      return;
    }

    sendSuccess(res, 'Reset token is valid', {
      email: user.email,
      tokenValid: true
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    sendError(res, 'Failed to verify reset token', 500);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      sendError(res, 'Reset token and new password are required', 400);
      return;
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      sendError(res, 'Invalid or expired reset token', 400);
      return;
    }

    // Update password
    user.password = password;

    // Clear reset token fields
    user.clearPasswordResetToken();

    // Save user (password will be hashed by pre-save middleware)
    await user.save();

    // Clear rate limiting for this email
    resetEmailRateLimit(user.email);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(user);
    } catch (emailError) {
      console.error('Failed to send password change confirmation:', emailError);
      // Don't fail the request if confirmation email fails
    }

    console.log(`✅ Password reset successful for: ${user.email}`);
    sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password. Please try again.', 500);
  }
};

/**
 * Send email verification email
 */
export const sendEmailVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get email from request body or authenticated user
    const email = req.body.email || req.user?.email;

    if (!email) {
      sendError(res, 'Email address is required', 400);
      return;
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      sendSuccess(res, 'Email address is already verified');
      return;
    }

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    console.log(`🔍 Generated verification token for ${email}: ${verificationToken.substring(0, 10)}...`);
    console.log(`🔍 Full generated token: ${verificationToken}`);
    console.log(`🔍 Generated token length: ${verificationToken.length}`);

    // Save the user with the verification token
    await user.save({ validateBeforeSave: false });
    console.log(`💾 Saved user with verification token, expires: ${user.emailVerificationExpires}`);

    try {
      // Send email verification email
      const emailSent = await emailService.sendEmailVerification(user, verificationToken);

      if (emailSent) {
        console.log(`✅ Email verification sent to: ${email}`);
        sendSuccess(res, 'Verification email sent successfully. Please check your inbox.');
      } else {
        console.error(`❌ Failed to send verification email to: ${email}`);
        // Clear the verification token if email failed
        user.clearEmailVerificationToken();
        await user.save({ validateBeforeSave: false });
        sendError(res, 'Failed to send verification email. Please try again.', 500);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Clear the verification token if email failed
      user.clearEmailVerificationToken();
      await user.save({ validateBeforeSave: false });
      sendError(res, 'Failed to send verification email. Please try again.', 500);
    }
  } catch (error) {
    console.error('Send email verification error:', error);
    sendError(res, 'An error occurred while sending verification email. Please try again.', 500);
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    console.log(`🔍 Email verification attempt with token: ${token ? String(token).substring(0, 10) + '...' : 'undefined'}`);
    console.log(`🔍 Full token received: ${token ? String(token) : 'undefined'}`);
    console.log(`🔍 Token length: ${token ? String(token).length : 0}`);

    if (!token || typeof token !== 'string') {
      console.log('❌ No token provided in request');
      sendError(res, 'Verification token is required', 400);
      return;
    }

    // Backend protection against concurrent verification
    cleanupExpiredVerifications();

    if (verificationInProgress.has(token)) {
      const processingTime = Date.now() - verificationInProgress.get(token)!;
      console.log(`🚫 BACKEND PROTECTION: Verification already in progress for token: ${token.substring(0, 10)}... (${processingTime}ms ago)`);
      sendError(res, 'Email verification already in progress', 429);
      return;
    }

    // Mark token as being processed
    verificationInProgress.set(token, Date.now());
    console.log(`🔒 Backend marked token as processing: ${token.substring(0, 10)}...`);

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log(`🔍 Raw token received: ${token}`);
    console.log(`🔍 Hashed token for lookup: ${hashedToken.substring(0, 10)}...`);
    console.log(`🔍 Full hashed token for lookup: ${hashedToken}`);

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
      isActive: true
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      console.log('❌ No user found with matching token');

      // Debug: Check if there are any users with verification tokens
      const usersWithTokens = await User.find({
        emailVerificationToken: { $exists: true, $ne: null },
        isActive: true
      }).select('email emailVerificationToken emailVerificationExpires +emailVerificationToken +emailVerificationExpires');

      console.log(`🔍 Found ${usersWithTokens.length} users with verification tokens:`);
      usersWithTokens.forEach(u => {
        const isExpired = u.emailVerificationExpires && u.emailVerificationExpires < new Date();
        console.log(`  - ${u.email}: token=${u.emailVerificationToken?.substring(0, 10)}..., expires=${u.emailVerificationExpires}, expired=${isExpired}`);
      });

      sendError(res, 'Invalid or expired verification token', 400);
      return;
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      sendSuccess(res, 'Email address is already verified');
      return;
    }

    console.log(`🔍 Verifying user: ${user.email} (ID: ${user._id})`);

    // Update user as verified
    user.isEmailVerified = true;

    // Clear verification token fields for this specific user
    user.clearEmailVerificationToken();
    console.log(`🧹 Cleared verification token for user: ${user.email}`);

    // Save user
    await user.save({ validateBeforeSave: false });
    console.log(`💾 Saved verification status for user: ${user.email}`);

    // Clear rate limiting for this email
    resetEmailVerificationRateLimit(user.email);

    console.log(`✅ Email verification successful for: ${user.email}`);
    sendSuccess(res, 'Email verified successfully! You now have full access to all features.', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    sendError(res, 'Failed to verify email. Please try again.', 500);
  } finally {
    // Always cleanup backend verification progress
    const { token } = req.query;
    if (token && typeof token === 'string') {
      verificationInProgress.delete(token);
      console.log(`🔓 Backend cleanup verification progress for: ${token.substring(0, 10)}...`);
    }
  }
};

/**
 * Update user email address
 */
export const updateEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newEmail } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!newEmail) {
      sendError(res, 'New email address is required', 400);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      sendError(res, 'Please provide a valid email address', 400);
      return;
    }

    const normalizedEmail = newEmail.toLowerCase().trim();

    // Check if email is already in use by another user
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
      isActive: true
    });

    if (existingUser) {
      sendError(res, 'Email address is already in use', 409);
      return;
    }

    // Find current user
    const user = await User.findById(userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Check if email is the same as current
    if (user.email === normalizedEmail) {
      sendError(res, 'New email address is the same as current email', 400);
      return;
    }

    // Update email and reset verification status
    user.email = normalizedEmail;
    user.isEmailVerified = false;

    // Clear any existing verification tokens
    user.clearEmailVerificationToken();

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();

    // Save user
    await user.save({ validateBeforeSave: false });

    try {
      // Send verification email to new address
      const emailSent = await emailService.sendEmailVerification(user, verificationToken);

      if (emailSent) {
        console.log(`✅ Email verification sent to new address: ${normalizedEmail}`);
        sendSuccess(res, 'Email address updated successfully. Please verify your new email address.', {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          }
        });
      } else {
        console.error(`❌ Failed to send verification email to new address: ${normalizedEmail}`);
        sendError(res, 'Email updated but failed to send verification email. Please request a new verification email.', 500);
      }
    } catch (emailError) {
      console.error('Email sending error during email update:', emailError);
      sendError(res, 'Email updated but failed to send verification email. Please request a new verification email.', 500);
    }
  } catch (error) {
    console.error('Update email error:', error);
    sendError(res, 'Failed to update email address. Please try again.', 500);
  }
};
