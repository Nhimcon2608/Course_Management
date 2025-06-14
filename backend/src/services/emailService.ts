import { IUser } from '@/types';
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  constructor() {
    // Don't initialize immediately - wait for environment variables to be loaded
  }

  private ensureInitialized() {
    if (!this.initialized) {
      // Debug: Log email configuration
      console.log('🔧 Email Service Initialization:');
      console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
      console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
      console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'not set');

      // Chỉ khởi tạo transporter nếu có cấu hình email
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App password cho Gmail
          },
        });

        console.log('✅ Email transporter initialized successfully');
        console.log('📧 Real emails will be sent via Gmail SMTP');
      } else {
        console.log('⚠️ Email configuration incomplete, using mock mode');
        console.log('📧 Emails will be logged to console only');
      }

      this.initialized = true;
    }
  }

  /**
   * Send email (supports both real email and mock for development)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Ensure email service is initialized with current environment variables
      this.ensureInitialized();

      // Nếu có transporter, gửi email thật (kể cả trong development)
      if (this.transporter) {
        const mailOptions = {
          from: `"${process.env.EMAIL_FROM_NAME || 'Course Management System'}" <${process.env.EMAIL_USER}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return true;
      } else {
        // Mock email sending for development hoặc khi không có cấu hình
        console.log('\n📧 ===== EMAIL SENT (DEVELOPMENT MODE) =====');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('--- HTML Content ---');
        console.log(options.html);
        if (options.text) {
          console.log('--- Text Content ---');
          console.log(options.text);
        }
        console.log('📧 ========================================\n');
        return true;
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: IUser, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    const html = this.generatePasswordResetHTML(user.name, resetUrl);
    const text = this.generatePasswordResetText(user.name, resetUrl);

    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Course Management System',
      html,
      text
    });
  }

  /**
   * Generate HTML template for password reset email
   */
  private generatePasswordResetHTML(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            color: #3b82f6;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .title {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .link {
            color: #3b82f6;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📚 Course Management System</div>
        </div>
        
        <h1 class="title">Password Reset Request</h1>
        
        <div class="content">
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password for your Course Management System account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
            
            <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                    <li>This link will expire in <strong>15 minutes</strong> for security reasons</li>
                    <li>This link can only be used once</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                </ul>
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
        </div>
        
        <div class="footer">
            <p>This email was sent from Course Management System. If you have any questions, please contact our support team.</p>
            <p><strong>Do not reply to this email.</strong> This mailbox is not monitored.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML template for email verification
   */
  private generateEmailVerificationHTML(userName: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            color: #3b82f6;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .title {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #059669;
        }
        .info {
            background-color: #dbeafe;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .link {
            color: #3b82f6;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📚 Course Management System</div>
        </div>

        <h1 class="title">Verify Your Email Address</h1>

        <div class="content">
            <p>Hello ${userName},</p>

            <p>Welcome to Course Management System! To complete your registration and start learning, please verify your email address by clicking the button below:</p>

            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p class="link">${verificationUrl}</p>

            <div class="info">
                <strong>📋 Important Information:</strong>
                <ul>
                    <li>This verification link will expire in <strong>24 hours</strong></li>
                    <li>This link can only be used once</li>
                    <li>Once verified, you'll have full access to all course features</li>
                    <li>If you didn't create this account, please ignore this email</li>
                </ul>
            </div>

            <p>After verification, you'll be able to:</p>
            <ul>
                <li>✅ Enroll in courses</li>
                <li>✅ Access learning materials</li>
                <li>✅ Track your progress</li>
                <li>✅ Interact with instructors and other students</li>
            </ul>
        </div>

        <div class="footer">
            <p>This email was sent from Course Management System. If you have any questions, please contact our support team.</p>
            <p><strong>Do not reply to this email.</strong> This mailbox is not monitored.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text template for email verification
   */
  private generateEmailVerificationText(userName: string, verificationUrl: string): string {
    return `
Course Management System - Verify Your Email Address

Hello ${userName},

Welcome to Course Management System! To complete your registration and start learning, please verify your email address.

Please visit the following link to verify your email:
${verificationUrl}

IMPORTANT INFORMATION:
- This verification link will expire in 24 hours
- This link can only be used once
- Once verified, you'll have full access to all course features
- If you didn't create this account, please ignore this email

After verification, you'll be able to:
- Enroll in courses
- Access learning materials
- Track your progress
- Interact with instructors and other students

---
Course Management System
Do not reply to this email. This mailbox is not monitored.
`;
  }

  /**
   * Generate plain text template for password reset email
   */
  private generatePasswordResetText(userName: string, resetUrl: string): string {
    return `
Course Management System - Password Reset Request

Hello ${userName},

We received a request to reset your password for your Course Management System account.

If you made this request, please visit the following link to reset your password:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link will expire in 15 minutes for security reasons
- This link can only be used once
- If you didn't request this password reset, please ignore this email
- Your password will remain unchanged until you create a new one

If you didn't request a password reset, you can safely ignore this email. Your account remains secure.

---
Course Management System
Do not reply to this email. This mailbox is not monitored.
`;
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(user: IUser, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

    console.log(`📧 Email verification URL being sent: ${verificationUrl}`);
    console.log(`📧 Token in email URL: ${verificationToken}`);
    console.log(`📧 URL length: ${verificationUrl.length}`);
    console.log(`📧 Token length in URL: ${verificationToken.length}`);

    const html = this.generateEmailVerificationHTML(user.name, verificationUrl);
    const text = this.generateEmailVerificationText(user.name, verificationUrl);

    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address - Course Management System',
      html,
      text
    });
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(user: IUser): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Changed Successfully</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8fafc; padding: 40px; border-radius: 8px;">
        <h1 style="color: #1f2937;">Password Changed Successfully</h1>
        <p>Hello ${user.name},</p>
        <p>Your password has been successfully changed for your Course Management System account.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>For security reasons, you may need to log in again on all your devices.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">Course Management System</p>
    </div>
</body>
</html>`;

    const text = `
Course Management System - Password Changed Successfully

Hello ${user.name},

Your password has been successfully changed for your Course Management System account.

If you didn't make this change, please contact our support team immediately.

For security reasons, you may need to log in again on all your devices.

---
Course Management System
`;

    return this.sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully - Course Management System',
      html,
      text
    });
  }
}

export const emailService = new EmailService();
export default emailService;
