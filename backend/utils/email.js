import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<object>} Send result
 */
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `AI Campus Track <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${options.to}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    logger.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send alert email
 * @param {string} to - Recipient email
 * @param {string} alertType - Type of alert
 * @param {string} message - Alert message
 * @param {object} details - Additional details
 */
export const sendAlertEmail = async (to, alertType, message, details = {}) => {
  const subject = `Alert: ${alertType}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">⚠️ ${alertType}</h2>
      <p>${message}</p>
      ${details && Object.keys(details).length > 0 ? `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3>Details:</h3>
          <ul style="list-style: none; padding: 0;">
            ${Object.entries(details).map(([key, value]) => `
              <li><strong>${key}:</strong> ${value}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      <p style="margin-top: 30px; color: #6c757d; font-size: 12px;">
        This is an automated alert from AI Campus Track System.
      </p>
    </div>
  `;

  return await sendEmail({ to, subject, html });
};

/**
 * Send welcome email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 * @param {string} role - User's role
 * @param {string} tempPassword - Temporary password (if applicable)
 */
export const sendWelcomeEmail = async (to, name, role, tempPassword = null) => {
  const subject = 'Welcome to AI Campus Track';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #007bff;">Welcome to AI Campus Track!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully with the role of <strong>${role}</strong>.</p>
      ${tempPassword ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="color: #856404; font-size: 14px;">Please change your password after your first login.</p>
        </div>
      ` : ''}
      <p>You can now log in to your account at:</p>
      <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
      <p style="margin-top: 30px; color: #6c757d; font-size: 12px;">
        If you have any questions, please contact your system administrator.
      </p>
    </div>
  `;

  return await sendEmail({ to, subject, html });
};

export default {
  sendEmail,
  sendAlertEmail,
  sendWelcomeEmail
};
