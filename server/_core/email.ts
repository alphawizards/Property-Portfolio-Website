import { Resend } from 'resend';

// Initialize Resend (will be undefined if no API key)
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Email sender configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = 'Property Portfolio Analyzer';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Welcome email sent when user first signs up
 */
export function getWelcomeEmail(userName: string): EmailTemplate {
  const subject = `Welcome to ${APP_NAME}!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${APP_NAME}</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thanks for joining ${APP_NAME}! We're excited to help you analyze and track your property investment portfolio.</p>
            <p><strong>What you can do now:</strong></p>
            <ul>
              <li>Add your properties with detailed financial information</li>
              <li>Track loans, rental income, and expenses</li>
              <li>View 30-year equity projections and cashflow forecasts</li>
              <li>Compare property vs share investments</li>
            </ul>
            <p>
              <a href="${APP_URL}" class="button">Get Started</a>
            </p>
            <p>If you have any questions, just reply to this email.</p>
            <p>Happy investing!</p>
          </div>
          <div class="footer">
            <p>${APP_NAME} | Making property investment analysis simple</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to ${APP_NAME}!

Hi ${userName},

Thanks for joining ${APP_NAME}! We're excited to help you analyze and track your property investment portfolio.

What you can do now:
- Add your properties with detailed financial information
- Track loans, rental income, and expenses
- View 30-year equity projections and cashflow forecasts
- Compare property vs share investments

Get started: ${APP_URL}

If you have any questions, just reply to this email.

Happy investing!

${APP_NAME} | Making property investment analysis simple
  `;

  return { subject, html, text };
}

/**
 * Subscription confirmation email after successful payment
 */
export function getSubscriptionConfirmationEmail(
  userName: string,
  tierName: string,
  billingCycle: string,
  nextBillingDate: string
): EmailTemplate {
  const subject = `${tierName} Subscription Confirmed`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Subscription Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your ${tierName} subscription is now active!</p>
            <div class="info-box">
              <p><strong>Subscription Details:</strong></p>
              <p>Plan: ${tierName}</p>
              <p>Billing Cycle: ${billingCycle}</p>
              <p>Next Billing Date: ${nextBillingDate}</p>
            </div>
            <p><strong>What's unlocked:</strong></p>
            <ul>
              <li>Unlimited properties</li>
              <li>Unlimited forecast years</li>
              <li>Advanced tax calculator</li>
              <li>Investment comparison tools</li>
              <li>PDF report exports</li>
              <li>Priority support</li>
            </ul>
            <p>
              <a href="${APP_URL}" class="button">Start Using Premium Features</a>
            </p>
            <p>You can manage your subscription anytime from your account settings.</p>
          </div>
          <div class="footer">
            <p>${APP_NAME}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
✓ Subscription Confirmed

Hi ${userName},

Your ${tierName} subscription is now active!

Subscription Details:
- Plan: ${tierName}
- Billing Cycle: ${billingCycle}
- Next Billing Date: ${nextBillingDate}

What's unlocked:
- Unlimited properties
- Unlimited forecast years
- Advanced tax calculator
- Investment comparison tools
- PDF report exports
- Priority support

Start using premium features: ${APP_URL}

You can manage your subscription anytime from your account settings.

${APP_NAME}
  `;

  return { subject, html, text };
}

/**
 * Payment failed notification
 */
export function getPaymentFailedEmail(userName: string, tierName: string): EmailTemplate {
  const subject = `Payment Failed - Action Required`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning-box { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠ Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We were unable to process your payment for ${tierName} subscription.</p>
            <div class="warning-box">
              <p><strong>What happens now:</strong></p>
              <p>We'll retry charging your card in a few days. If payment continues to fail, your subscription will be canceled and you'll lose access to premium features.</p>
            </div>
            <p><strong>How to fix this:</strong></p>
            <ol>
              <li>Check that your card hasn't expired</li>
              <li>Ensure you have sufficient funds</li>
              <li>Update your payment method if needed</li>
            </ol>
            <p>
              <a href="${APP_URL}/subscription" class="button">Update Payment Method</a>
            </p>
            <p>If you need help, please reply to this email.</p>
          </div>
          <div class="footer">
            <p>${APP_NAME}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
⚠ Payment Failed

Hi ${userName},

We were unable to process your payment for ${tierName} subscription.

What happens now:
We'll retry charging your card in a few days. If payment continues to fail, your subscription will be canceled and you'll lose access to premium features.

How to fix this:
1. Check that your card hasn't expired
2. Ensure you have sufficient funds
3. Update your payment method if needed

Update payment method: ${APP_URL}/subscription

If you need help, please reply to this email.

${APP_NAME}
  `;

  return { subject, html, text };
}

/**
 * Subscription cancellation confirmation
 */
export function getCancellationEmail(userName: string, tierName: string, endDate: string): EmailTemplate {
  const subject = `Subscription Canceled`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6b7280; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Canceled</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your ${tierName} subscription has been canceled as requested.</p>
            <div class="info-box">
              <p><strong>What this means:</strong></p>
              <p>You'll continue to have access to premium features until <strong>${endDate}</strong></p>
              <p>After this date, your account will revert to the Free tier.</p>
            </div>
            <p><strong>Free tier includes:</strong></p>
            <ul>
              <li>Up to 2 properties</li>
              <li>10-year forecasts</li>
              <li>Basic analytics</li>
            </ul>
            <p>Changed your mind? You can reactivate your subscription anytime.</p>
            <p>
              <a href="${APP_URL}/subscription" class="button">Reactivate Subscription</a>
            </p>
            <p>We'd love to hear your feedback on how we can improve!</p>
          </div>
          <div class="footer">
            <p>${APP_NAME}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Subscription Canceled

Hi ${userName},

Your ${tierName} subscription has been canceled as requested.

What this means:
You'll continue to have access to premium features until ${endDate}

After this date, your account will revert to the Free tier.

Free tier includes:
- Up to 2 properties
- 10-year forecasts
- Basic analytics

Changed your mind? You can reactivate your subscription anytime.

Reactivate subscription: ${APP_URL}/subscription

We'd love to hear your feedback on how we can improve!

${APP_NAME}
  `;

  return { subject, html, text };
}

/**
 * Send an email using Resend
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  if (!resend) {
    console.warn('[Email] Resend not configured. Set RESEND_API_KEY to enable emails.');
    console.log('[Email] Would have sent:', { to, subject });
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      return false;
    }

    console.log('[Email] Sent successfully:', data);
    return true;
  } catch (error) {
    console.error('[Email] Exception:', error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userName: string, email: string): Promise<boolean> {
  const template = getWelcomeEmail(userName);
  return await sendEmail(email, template.subject, template.html, template.text);
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  userName: string,
  email: string,
  tierName: string,
  billingCycle: string,
  nextBillingDate: string
): Promise<boolean> {
  const template = getSubscriptionConfirmationEmail(userName, tierName, billingCycle, nextBillingDate);
  return await sendEmail(email, template.subject, template.html, template.text);
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  userName: string,
  email: string,
  tierName: string
): Promise<boolean> {
  const template = getPaymentFailedEmail(userName, tierName);
  return await sendEmail(email, template.subject, template.html, template.text);
}

/**
 * Send cancellation confirmation
 */
export async function sendCancellationEmail(
  userName: string,
  email: string,
  tierName: string,
  endDate: string
): Promise<boolean> {
  const template = getCancellationEmail(userName, tierName, endDate);
  return await sendEmail(email, template.subject, template.html, template.text);
}
