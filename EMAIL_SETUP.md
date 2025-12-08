# Environment Variables Configuration

## Required Variables

### Resend Email Service
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://yourdomain.com
```

**Setup Instructions:**
1. Sign up at https://resend.com
2. Verify your domain or use the sandbox domain for testing
3. Generate an API key from the Resend dashboard
4. Add variables to your `.env` file

**Testing without Resend:**
- The app will work without `RESEND_API_KEY`
- Email functions will log to console instead of sending
- Useful for local development

### Stripe Payment Processing
```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Database
```env
DATABASE_URL=mysql://user:pass@host/database
```

## Email Templates

The following emails are automatically sent:

1. **Welcome Email** - Sent when a user first signs up
2. **Subscription Confirmation** - Sent after successful payment
3. **Payment Failed** - Sent when a payment fails
4. **Cancellation Confirmation** - Sent when subscription is canceled

All emails include both HTML (styled) and plain text versions.

## Testing Email Integration

### Local Testing (Development)
```bash
# Start the dev server
npm run dev

# Emails will log to console instead of sending
# Look for: "[Email] Would have sent: { to, subject }"
```

### Production Testing
1. Set `RESEND_API_KEY` in production environment
2. Use a test email address for initial verification
3. Monitor Resend dashboard for delivery status
4. Check spam folders if emails don't arrive

## Email Triggers

| Event | Trigger | Template |
|-------|---------|----------|
| New User | First OAuth login | Welcome Email |
| Subscription Start | `checkout.session.completed` webhook | Subscription Confirmation |
| Payment Failure | `invoice.payment_failed` webhook | Payment Failed |
| Subscription Canceled | `customer.subscription.deleted` webhook | Cancellation Confirmation |
