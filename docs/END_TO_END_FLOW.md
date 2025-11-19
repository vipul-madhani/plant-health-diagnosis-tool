# Plant Health Diagnosis Tool - Complete End-to-End Flow

## System Overview

This document outlines the complete user journey, data flow, and all components required for the Plant Health Diagnosis Tool to be fully operational.

---

## 1. AGRONOMIST ONBOARDING FLOW

### Phase 1: Registration (Mobile App Primary)

```
Agronomist opens app
    ↓
Chooses registration type:
  - Certified Agronomist (has formal qualification)
  - Industry Expert (has field experience)
    ↓
Fills profile form:
  - Name, email, phone, location
  - Specializations (Rice, Wheat, Organic Farming, etc.)
  - Years of experience
    ↓
Uploads documents:
  - Identity proof
  - Certificate OR experience proof
  - Profile photo
    ↓
Backend receives request
  → Email notification sent: "Registration Received - Pending Verification"
  → AI verification triggered (24-hour window)
    ↓
Verification Queue (Admin Panel):
  - Admin sees pending registration
  - AI flags any issues (blurry images, fake docs)
  - Admin reviews and approves/rejects
    ↓
Verification Result:
  IF APPROVED:
    → Email: "Congratulations! Your profile is verified"
    → Agronomist ID assigned
    → Can now accept consultation requests
  IF REJECTED:
    → Email: "Verification failed. Please resubmit"
    → Option to upload corrected documents
```

---

## 2. USER JOURNEY - DIAGNOSTICS & CONSULTATIONS

### Path A: Automated Report (₹99)

```
User opens app
    ↓
Selects "Get Diagnosis"
    ↓
Takes plant photo OR uploads image
    ↓
Provides plant issue description
    ↓
Pays ₹99 (Razorpay integration)
    ↓
Backend processes:
  → ML Model analyzes image
  → Generates comprehensive report:
    • Disease/pest identification
    • Severity level
    • Organic treatment recommendations
    • Prevention measures
    ↓
User receives report
  → Email notification: "Your diagnostic report is ready"
  → Report saved in "My Reports" section
    ↓
REVENUE:
  - ₹99 total
  - Platform keeps: ₹29.70 (30%)
  - Agronomist fund: ₹69.30 (70% - not directly, shared fund)
```

### Path B: Live Consultation (₹299)

```
User selects "Connect with Expert"
    ↓
Booking interface shows:
  - Expected wait time
  - Agronomist specializations matching request
    ↓
User pays ₹299 (Razorpay)
    ↓
Request entered into FIFO queue:
  - NO rating-based ranking
  - FIRST-IN, FIRST-OUT matching
  - Next available agronomist accepts
    ↓
Agronomist notified:
  - Firebase push notification
  - Email: "New consultation request: [Plant issue]"
    ↓
Agronomist accepts/declines within 5 min
    ↓
IF ACCEPTED:
  → Chat interface opens
  → Real-time messaging (Socket.io)
  → User uploads plant photos in chat
  → Agronomist provides detailed guidance
    ↓
Consultation ends when:
  - User marks as complete, OR
  - 30 minutes have passed (auto-complete)
    ↓
Completed consultation:
  - Chat archived for future reference
  - Earnings added to agronomist account
  - Email to agronomist: "Consultation completed - ₹209 earned (70%)"
    ↓
REVENUE:
  - ₹299 total
  - Platform keeps: ₹89.70 (30%)
  - Agronomist earns: ₹209.30 (70%) → Collection-based (not auto-paid)
```

---

## 3. B2B API INTEGRATION

```
External B2B client wants to integrate
    ↓
Admin issues API key
    ↓
Client integrates endpoint:
  POST /b2b/diagnosis
  {
    "image_url": "...",
    "api_key": "..."
  }
    ↓
Backend processes:
  - Validates API key
  - Authenticates B2B client
  - Runs ML diagnosis
  - Returns JSON response
    ↓
Response includes:
  - Disease identification
  - Confidence score
  - Treatment recommendations
    ↓
BILLING:
  - Pay-per-call model
  - ₹10 per API call (configurable)
  - Monthly invoice sent
  - Admin tracks B2B revenue separately
```

---

## 4. ADMIN PANEL - COMPLETE CONTROL

### A. Agronomist Management

```
Admin Dashboard → Agronomist Management
  
  Pending Verifications:
    - View all applications in queue
    - See uploaded documents
    - AI verification status (flags issues)
    - One-click approve/reject
    - Reason for rejection (email to agronomist)
    
  Active Agronomists:
    - Full profiles with contact info
    - Verification status
    - Total consultations this month
    - Average rating (future feature)
    - Earnings (pending + paid out)
    - Action: Suspend/deactivate if needed
    
  Earnings Management:
    - View each agronomist's earnings breakdown
    - Process collection-based payouts
    - Generate earning reports
```

### B. Reports Management

```
Admin Dashboard → Reports
  
  Report Analytics:
    - Total reports generated this month: N
    - Revenue from reports: ₹(N × 99)
    - Most common plant issues
    - Disease detection accuracy
    
  Individual Report Lookup:
    - Search by date, user, plant type
    - View diagnosis accuracy
    - Download report PDF
    - Flag low-quality diagnoses for model review
```

### C. Consultations Management

```
Admin Dashboard → Consultations
  
  FIFO Queue Monitor:
    - Current queue size
    - Average wait time
    - Agronomist response time
    - Completion rate
    
  Active Consultations:
    - Real-time consultation feed
    - Average consultation duration
    - Peak consultation hours
    
  Dispute Resolution:
    - User complaints
    - Refund requests
    - Consultant quality issues
    - Manual payout adjustments
```

### D. Revenue & Earnings Dashboard

```
Admin Dashboard → Financial Analytics
  
  Monthly Revenue Breakdown:
    - Reports: ₹(reports × 99) × 30%
    - Consultations: ₹(consultations × 299) × 30%
    - B2B API: ₹(api_calls × rate)
    - Total GMV (Gross Merchandise Volume)
    - Total Platform Revenue (30%)
    
  Payout Tracking:
    - Total pending payout (Collection-based)
    - Paid out this month
    - Top earning agronomists
    - Payout history
    
  Financial Reports:
    - Export to CSV/PDF
    - Tax reporting (9% GST in India)
    - Year-to-date comparison
```

### E. User Management

```
Admin Dashboard → Users
  
  User Directory:
    - Total active users
    - New signups this week
    - User demographics
    - Activity logs
    
  Support Tickets:
    - User complaints
    - Refund requests
    - Technical issues
    - Response management
```

---

## 5. EMAIL NOTIFICATION TRIGGERS

### Agronomist Emails
```
✓ Registration submitted - pending verification
✓ Verification approved - profile live
✓ Verification rejected - resubmit required
✓ New consultation request - [user issue]
✓ Consultation completed - ₹X earned
✓ Monthly earning statement
✓ Collection payout processed
```

### User Emails
```
✓ Account registration confirmation
✓ Report generated - diagnosis ready
✓ Consultation matched with agronomist
✓ Consultation completed - rate agronomist
✓ Refund processed
```

### Admin Emails
```
✓ Daily digest (new users, complaints, system alerts)
✓ Verification queue reminder
✓ Monthly revenue report
```

---

## 6. REAL-TIME NOTIFICATIONS (Firebase)

```
Agronomist receives push when:
  - New consultation request arrives
  - User sends message in chat
  - Verification approved
  
User receives push when:
  - Consultation matched with expert
  - Expert starts responding
  - Report is ready
```

---

## 7. DATABASE FLOW

### Key Tables & Transactions

```
Users Table
  └─ Has many: diagnostic_reports, consultations (as requester)
  
Agronomists Table
  ├─ Verification status
  ├─ Specializations
  ├─ Has many: consultations (as responder)
  └─ Has many: earnings records
  
Diagnostic_Reports Table
  ├─ user_id, image, diagnosis
  ├─ payment_transaction_id
  └─ ai_confidence_score
  
Expert_Consultations Table
  ├─ user_id (requester)
  ├─ agronomist_id (responder)
  ├─ status (pending, accepted, in_progress, completed)
  ├─ payment_transaction_id
  └─ Has many: consultation_messages
  
Agronomist_Earnings Table
  ├─ agronomist_id
  ├─ consultation_id (what earned money)
  ├─ amount (70% of ₹299 = ₹209.30)
  ├─ status (pending, collected)
  └─ collection_date
  
Payment_Transactions Table
  ├─ razorpay_transaction_id
  ├─ user_id
  ├─ amount
  ├─ type (report/consultation/b2b_api)
  └─ status (success/failed/refunded)
```

---

## 8. SECURITY & COMPLIANCE

```
Authentication:
  - JWT tokens for API
  - Role-based access (user, agronomist, admin)
  - 2FA for admin panel (future)
  
Data Protection:
  - PII encrypted at rest
  - HTTPS for all communications
  - Photo data stored securely (AWS S3 with encryption)
  
Compliance:
  - GST registration for India
  - Privacy policy aligned with GDPR/CCPA
  - Data retention policy (1 year for chats, 2 years for reports)
```

---

## 9. SCALING METRICS

```
Month 1 Target:
  - 100 registered users
  - 50 verified agronomists
  - 200 reports generated
  - 50 live consultations
  - ₹20,000 GMV
  - ₹6,000 platform revenue
  
Month 6 Target:
  - 5,000 users
  - 500 agronomists
  - 3,000 reports
  - 1,000 consultations
  - ₹300,000 GMV
  - ₹90,000 platform revenue
```

---

## 10. DEPLOYMENT PHASES

### Phase 6: Production Deployment

```
Development (macOS local):
  ✓ All code ready in GitHub
  ✓ Database schema ready
  ✓ Email system ready
  ✓ Firebase configured
  
Staging:
  - Deploy to AWS/GCP
  - Test with beta users
  - Monitor for bugs
  
Production:
  - Full deployment
  - Database migration
  - DNS configuration
  - SSL certificates
  - Go-live!
```

---

## 11. REMAINING WORK

- [ ] Admin backend routes (Flask) - NEXT PRIORITY
- [ ] Admin React dashboard UI
- [ ] Mobile app screens (reports, consultations, chat)
- [ ] Firebase integration
- [ ] Payment gateway testing (Razorpay)
- [ ] Email service configuration
- [ ] Database deployment
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation & launch

---

## Quick Links

- Backend Routes: `backend-api/routes_phase5.py` & `admin_routes.py`
- Mobile App: `frontend-mobile/`
- Admin Dashboard: `frontend-web/src/pages/AdminDashboard.js`
- Database Schema: `db/schema_phase5_extensions.sql`
- Email System: `backend-api/email_notifications.py`

---

**Last Updated:** November 2025
**Status:** Phase 5.3 (Admin Backend) - IN PROGRESS
