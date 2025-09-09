# TODO - SheSync+ Development

## ✅ **COMPLETED: Partner Portal Implementation**

### **🎉 Partner Portal Feature (MERGED TO DEVELOP)**
- [x] **Partner Portal UI** - Complete with shared cycle phase, mood, intimacy cards, fantasy teasers
- [x] **Privacy Settings Integration** - Respects user privacy_settings and RLS policies
- [x] **Partner Linking System** - Uses partner_links table for explicit partner relationships
- [x] **Today at a Glance** - Shows partner's shared data for current day
- [x] **TDD Tests** - Vitest tests for privacy settings and data filtering
- [x] **E2E Tests** - Playwright tests for sharing/unsharing flow
- [x] **API Endpoints** - `/api/partner` and `/api/partner/shared-data` routes
- [x] **TypeScript Types** - Complete type definitions for partner data
- [x] **Database Schema** - RLS policies for secure partner data access

---

## 🚧 **IMMEDIATE NEXT STEPS**

### **🔧 Node.js Environment Setup (URGENT)**
- [ ] **Create .nvmrc file** in project root with Node.js version
  ```bash
  echo "20.19.5" > .nvmrc
  ```
- [ ] **Reload terminal** or source shell configuration
  ```bash
  source ~/.zshrc
  ```
- [ ] **Use correct Node version** in project directory
  ```bash
  nvm use
  npm run dev
  ```
- [ ] **Verify application runs** without Node.js compatibility errors

### **🔌 Supabase Configuration**
- [ ] **Set up Supabase project** and get credentials
- [ ] **Create .env.local file** with Supabase configuration
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```
- [ ] **Run database migrations** to set up partner_links table and RLS policies
- [ ] **Test partner portal functionality** with real Supabase data

### **🧪 Testing & Validation**
- [ ] **Run all tests** to ensure Partner Portal works correctly
  ```bash
  npm test
  npm run test:coverage
  ```
- [ ] **Test partner sharing flow** end-to-end
- [ ] **Verify privacy settings** work as expected
- [ ] **Test RLS policies** ensure data security

---

## 🚧 **Remaining Tasks for feature/stripe-payments Branch**

### **🔌 Stripe Connection & Testing**

#### **Environment Setup**
- [ ] **Add real Stripe API keys to .env.local**
  - [ ] `STRIPE_SECRET_KEY=sk_test_...` (from Stripe Dashboard)
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` (from Stripe Dashboard)
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (after webhook endpoint setup)

#### **Stripe Dashboard Configuration**
- [ ] **Create Products & Prices in Stripe Dashboard**
  - [ ] Premium Monthly: `price_premium_monthly` (£15/month)
  - [ ] VIP Monthly: `price_vip_monthly` (£39/month) 
  - [ ] Lifetime: `price_lifetime` (£199 one-time)
- [ ] **Update pricing page with real Stripe Price IDs**
- [ ] **Configure webhook endpoint in Stripe Dashboard**
  - [ ] Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
  - [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### **End-to-End Testing**
- [ ] **Test Checkout Flow**
  - [ ] Premium subscription checkout
  - [ ] VIP subscription checkout  
  - [ ] Lifetime payment checkout
  - [ ] Verify redirect to dashboard after successful payment
  - [ ] Test canceled payment flow
- [ ] **Test Webhook Events**
  - [ ] Verify subscription tier updates in database after successful payment
  - [ ] Test failed payment handling
  - [ ] Test subscription cancellation
- [ ] **Test User Experience**
  - [ ] Current plan display in pricing page
  - [ ] Subscription status in account settings
  - [ ] Plan upgrade/downgrade flows

### **🔧 Account Settings Completion**

#### **Settings Page Enhancements**
- [ ] **Subscription Management Section**
  - [ ] Display current plan details (tier, status, next billing date)
  - [ ] Show payment method (if available)
  - [ ] Add "Manage Subscription" button linking to Stripe Customer Portal
  - [ ] Add "Cancel Subscription" functionality
  - [ ] Show subscription history/invoices
- [ ] **Billing Information**
  - [ ] Display next billing date
  - [ ] Show billing amount and currency
  - [ ] Add billing address management
- [ ] **Plan Change Options**
  - [ ] Upgrade/downgrade buttons
  - [ ] Prorated billing calculations
  - [ ] Immediate vs. end-of-cycle changes

#### **Database Schema Updates**
- [ ] **Add missing subscription fields to Supabase users table**
  - [ ] `stripe_customer_id` (string)
  - [ ] `subscription_start_date` (timestamp)
  - [ ] `subscription_end_date` (timestamp)  
  - [ ] `next_billing_date` (timestamp)
  - [ ] `billing_amount` (decimal)
  - [ ] `billing_currency` (string)
- [ ] **Update RLS policies** for new subscription fields
- [ ] **Create subscription_history table** for tracking changes

### **🛡️ Error Handling & Edge Cases**

#### **Payment Failures**
- [ ] **Handle declined cards**
  - [ ] Show user-friendly error messages
  - [ ] Retry payment options
  - [ ] Alternative payment method suggestions
- [ ] **Subscription Lapses**
  - [ ] Grace period handling
  - [ ] Feature access restrictions for past_due accounts
  - [ ] Re-activation flows

#### **Webhook Reliability**
- [ ] **Add webhook signature verification** (already implemented but needs testing)
- [ ] **Add idempotency handling** for duplicate webhook events
- [ ] **Add retry logic** for failed database updates
- [ ] **Add webhook event logging** for debugging

### **📊 Analytics & Monitoring**

#### **Subscription Metrics**
- [ ] **Add conversion tracking**
  - [ ] Pricing page views
  - [ ] Checkout initiations
  - [ ] Successful subscriptions
  - [ ] Churn rate monitoring
- [ ] **Revenue Analytics**
  - [ ] Monthly recurring revenue (MRR)
  - [ ] Customer lifetime value (LTV)
  - [ ] Plan distribution metrics

### **🎨 UI/UX Polish**

#### **Pricing Page**
- [ ] **Add testimonials** or social proof
- [ ] **Add FAQ section** about billing
- [ ] **Add comparison table** highlighting plan differences
- [ ] **Mobile responsiveness** testing

#### **Loading States**
- [ ] **Checkout button loading states** (already partially implemented)
- [ ] **Plan change loading indicators**
- [ ] **Subscription status loading states**

#### **Success/Error Messages**
- [ ] **Payment success page** with next steps
- [ ] **Payment failure page** with retry options
- [ ] **Subscription change confirmations**

### **🔒 Security & Compliance**

#### **Data Protection**
- [ ] **PCI compliance review** (handled by Stripe but verify implementation)
- [ ] **GDPR compliance** for billing data
- [ ] **Data retention policies** for subscription history

#### **Access Control**
- [ ] **Feature gating** based on subscription tier
  - [ ] Premium features locked for free users
  - [ ] VIP features locked for premium users
- [ ] **API rate limiting** by subscription tier
- [ ] **Storage limits** by plan type

---

## 🎯 **Definition of Done**

### **Ready for Develop Merge When:**
- [ ] All Stripe API keys configured and tested
- [ ] End-to-end payment flow working (signup → payment → subscription active)
- [ ] Webhook events properly updating user subscription status
- [ ] Account settings showing current subscription details
- [ ] Basic error handling for payment failures
- [ ] All tests passing
- [ ] Code reviewed and approved

### **Future Enhancements (Post-Merge):**
- Advanced subscription analytics
- Customer portal integration
- Proration handling for mid-cycle changes
- Multiple payment method support
- Invoice generation and email notifications
- Subscription pause/resume functionality

---

## 📝 **Notes**

- **Priority**: Focus on core payment flow first, then account settings
- **Testing**: Use Stripe test mode throughout development
- **Documentation**: Update API documentation with subscription endpoints
- **Performance**: Monitor webhook processing times and database query performance

---

*Last Updated: $(date)*
*Branch: feature/stripe-payments*
*Status: In Development*
