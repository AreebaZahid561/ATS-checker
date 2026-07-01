'use strict';

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Create a Nodemailer transporter from env variables.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email.
 * @param {object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"ATS Checker" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw new Error('Email could not be sent. Please try again later.');
  }
};

/**
 * Send email verification email.
 */
const sendVerificationEmail = async (to, name, verificationUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Welcome to ATS Checker, ${name}!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" 
         style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
        Verify Email
      </a>
      <p style="margin-top:16px;color:#666;">This link expires in 24 hours.</p>
      <p style="color:#666;">If you did not create an account, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Verify Your Email – ATS Checker', html });
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" 
         style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
        Reset Password
      </a>
      <p style="margin-top:16px;color:#666;">This link expires in 10 minutes.</p>
      <p style="color:#666;">If you did not request a password reset, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Password Reset – ATS Checker', html });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
