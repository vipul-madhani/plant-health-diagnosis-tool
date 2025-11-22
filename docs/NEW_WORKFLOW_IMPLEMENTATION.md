# New Workflow Implementation Guide
## AgriIQ Plant Health Diagnosis Tool

**Last Updated**: November 22, 2025, 10:43 PM IST  
**Implementation Status**: ✅ Backend Complete | 🚧 Frontend In Progress

---

## 🎯 Overview

This document describes the new consultation workflow with manual agronomist acceptance, AI bot support, and **3 lifetime free analyses per user** (no daily reset).

---

## 📋 Key Features Implemented

### 1. ✅ 3 Lifetime Free Analyses (NO DAILY RESET)

**Business Logic**:
- Each user gets **3 free basic analyses TOTAL** (lifetime)
- **No reset at midnight** - Once used, always requires payment
- After 3 analyses: Must purchase detailed report (₹99) or consultation (₹199)
- Maximizes conversion to paid features

**User Model Fields**:
```javascript
freeAnalysisCount: Number (0-3, no reset)
freeAnalysisLimit: Number (default: 3)
hasReachedFreeLimit: Boolean (flag for quick queries)
```

**API Endpoints**:
- `GET /api/analysis/usage-limit` - Check remaining free analyses
- `POST /api/analysis/basic` - Enforces lifetime limit before analysis

**User Experience**:
```
Analysis 1: "2 free analyses remaining"
Analysis 2: "1 free analysis remaining"
Analysis 3: "This was your last free analysis. Future analyses require payment."
Analysis 4: "Free limit reached. Upgrade to continue."
```

**Key Difference from Daily Reset**:
- ❌ **NOT**: "Resets at midnight" or "3 per day"
- ✅ **IS**: "3 total ever per account"
- Purpose: Drive monetization, prevent abuse

---

### 2. ✅ Online Agronomist Tracking

**Presence Detection**:
- Agronomist considered "online" if active in last 5 minutes
- Updated on login, logout, and API activity
- Background heartbeat every 2 minutes

**User Model Fields**:
```javascript
isOnline: Boolean
lastActiveAt: Date
```

**API Endpoints**:
- `GET /api/consultation/agronomists/available` - Get count and list

**Display Logic**:
```
0 agronomists: "AI assistant will help you immediately"
1-3 agronomists: "X agronomists available now"
4+ agronomists: "Multiple agronomists ready to assist"
```

---

### 3. ✅ Manual Agronomist Acceptance Flow

**Old Flow (Auto-Assignment)**:
```
User pays → Consultation created → Backend auto-assigns agronomist (FIFO)
```

**New Flow (Manual Acceptance)**:
```
User pays → Consultation enters FIFO queue → Displayed to agronomists
→ Agronomist manually clicks "Accept" → Consultation assigned
→ If no acceptance in 2 mins → AI bot activated
```

**Consultation Status Flow**:
```
pending → accepted → in_progress → completed
         ↓ (2 min timeout)
    AI bot activated
```

**API Endpoints**:
- `POST /api/consultation/create` - Creates consultation in pending state
- `GET /api/consultation/queue` - FIFO queue for agronomists
- `POST /api/consultation/:id/accept` - Manual acceptance
- `GET /api/consultation/agronomist/active` - Agronomist's active consultations

---

### 4. ✅ AI Bot Support System

**Activation Trigger**:
- Auto-activates if no agronomist accepts within 2 minutes
- Provides immediate value to user (no waiting)
- Seamless handoff when agronomist joins

**AI Bot Capabilities**:
1. **Context-Aware Responses** using:
   - ML model diagnosis and confidence
   - Plant species and symptoms
   - Regional and seasonal data
   - Community best practices

2. **Knowledge Base**:
   - Treatment recommendations
   - Organic remedies
   - Prevention strategies
   - Regional-specific advice
   - Urgent care protocols

3. **Response Types**:
   - Treatment plans (immediate, short-term, long-term)
   - Organic remedy recipes
   - Prevention tips
   - Emergency protocols
   - Product recommendations

**Service**: `backend-api/services/ai_bot_service.js`

**Key Methods**:
```javascript
activateForConsultation(consultationId)
generateResponse(consultationId, userMessage)
notifyAgronomistJoined(consultationId, agronomistName)
```

**Message Identification**:
```javascript
isFromBot: true
senderId: 'ai-bot-system'
```

**External AI Integration** (Optional):
- OpenAI API support (set OPENAI_API_KEY)
- Fallback to rule-based responses if API unavailable

---

### 5. ✅ PDF Report Generation

**Trigger**: After payment for detailed report (₹99)

**Content Includes**:
- User information
- Diagnosis with confidence
- Symptoms list
- Treatment plan (immediate, short-term, long-term)
- Organic remedies with usage instructions
- Prevention tips
- Report ID and timestamp

**Delivery**:
- Stored on server: `./uploads/reports/report-{analysisId}.pdf`
- Sent via email as attachment
- Downloadable in app: "Download Report" button
- API: `GET /api/analysis/download/:analysisId`

**Library**: `pdfkit` (Node.js)

---

## 🔄 Complete User Workflows

### End User (Farmer) Journey

#### **Scenario A: First 3 Free Analyses**

1. **Upload Plant Image (1st time)**
   - Check remaining: `GET /api/analysis/usage-limit`
   - Response: `{ remaining: 3, used: 0, limit: 3 }`
   - Display: "2 free analyses remaining after this"

2. **ML Analysis**
   - Call: `POST /api/analysis/basic` with image
   - Receive: Diagnosis, confidence, quick tips
   - Counter updated: `freeAnalysisCount: 1`
   - Display: "2 free analyses remaining"

3. **2nd Analysis**
   - Display: "1 free analysis remaining"
   - Counter: `freeAnalysisCount: 2`

4. **3rd Analysis (Last Free)**
   - Display: "This is your last free analysis"
   - Counter: `freeAnalysisCount: 3`
   - Flag: `hasReachedFreeLimit: true`
   - Message: "Future analyses require payment"

#### **Scenario B: After Limit Reached (4th Analysis)**

1. **Attempt 4th Analysis**
   - Call: `POST /api/analysis/basic`
   - Response: HTTP 403 "Free limit reached"
   - Error message: "You have used all 3 free analyses"

2. **Upgrade Prompt**
   - Show two options:
     - **Detailed Report (₹99)**: Comprehensive diagnosis + treatment
     - **Consult Agronomist (₹199)**: Live chat with expert
   - No "try again tomorrow" option (lifetime limit)

3. **Payment Required**
   - User must pay to continue using the service
   - No workarounds or resets

#### **Scenario C: Get Detailed Report**

1. **Click "Detailed Report" (₹99)**
   - Navigate to payment screen
   - Process payment via Razorpay

2. **Report Generation**
   - Call: `POST /api/analysis/detailed/:analysisId`
   - Backend generates PDF
   - Email sent with PDF attachment

3. **Download in App**
   - Show "Download Report" button
   - Call: `GET /api/analysis/download/:analysisId`
   - Open PDF in device viewer

#### **Scenario D: Consult with Agronomist**

1. **Check Agronomist Availability**
   - Call: `GET /api/consultation/agronomists/available`
   - Display: "3 agronomists available now"

2. **Initiate Consultation (₹199)**
   - Navigate to payment screen
   - Process payment via Razorpay
   - Call: `POST /api/consultation/create`

3. **Join Queue**
   - Status: "Pending" (position in FIFO queue)
   - Display: "You're #2 in queue. Est. wait: 5 mins"
   - Show real-time updates

4a. **If Agronomist Accepts (within 2 mins)**
   - Email notification: "Agronomist assigned!"
   - Status changes to "Accepted"
   - Chat becomes active with agronomist
   - Navigate to chat screen

4b. **If No Agronomist (after 2 mins)**
   - AI bot auto-activates
   - Welcome message from AI assistant
   - Status: "In Progress (AI-assisted)"
   - User can chat with AI bot
   - If agronomist joins later: Handoff message

5. **Consultation Completes**
   - Agronomist/User marks as complete
   - Prompt for rating (1-5 stars)
   - Agronomist earns 70% (₹139.30)
   - Platform keeps 30% (₹59.70)

---

### Agronomist Journey

#### **Login and Go Online**

1. **Login to App**
   - Status auto-set: `isOnline: true`
   - Timestamp: `lastActiveAt: now()`

2. **View Dashboard**
   - Call: `GET /api/consultation/queue` (FIFO order)
   - Display pending consultations:
     - Plant image
     - Symptoms
     - Diagnosis (from ML)
     - Farmer details
     - Wait time
     - Queue position

#### **Accept Consultation**

1. **Review Consultation Details**
   - Farmer: "Rajesh Kumar"
   - Plant: "Tomato"
   - Symptoms: "Yellow leaves, brown spots"
   - Diagnosis: "Early Blight" (87% confidence)
   - Position: #1 (oldest in queue)

2. **Click "Accept"**
   - Call: `POST /api/consultation/:id/accept`
   - Confirmation: "Consultation accepted!"
   - Earning: ₹139.30 (70% of ₹199)

3. **Start Consultation**
   - Navigate to chat screen
   - If AI bot was active: See chat history
   - Handoff message: "Expert agronomist has joined"

4. **Provide Guidance**
   - Chat with farmer
   - Share treatment recommendations
   - Answer follow-up questions
   - Upload reference images (optional)

5. **Complete Consultation**
   - Click "Mark as Complete"
   - Call: `POST /api/consultation/:id/complete`
   - Earnings updated:
     - Total: ₹139.30
     - Status: Pending collection

---

## 🔌 API Reference

### Analysis Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analysis/usage-limit` | Required | Check lifetime limit |
| POST | `/api/analysis/basic` | Required | Free analysis (3 lifetime) |
| POST | `/api/analysis/detailed/:id` | Required | Generate paid report |
| GET | `/api/analysis/download/:id` | Required | Download PDF |
| GET | `/api/analysis/recent` | Required | User's analysis history |

### Consultation Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/consultation/agronomists/available` | Required | Online count |
| POST | `/api/consultation/create` | Required | Start consultation |
| GET | `/api/consultation/queue` | Agronomist | FIFO queue |
| POST | `/api/consultation/:id/accept` | Agronomist | Manual accept |
| GET | `/api/consultation/my-consultations` | Required | User's list |
| GET | `/api/consultation/agronomist/active` | Agronomist | Active list |
| POST | `/api/consultation/:id/complete` | Required | Mark done |
| POST | `/api/consultation/:id/rate` | Required | Rate agronomist |

---

## 📱 Mobile App Updates Needed

### Screens to Update

1. **AnalysisScreen.jsx**
   - Add usage display: "2 free analyses remaining" (no "today")
   - Show "Last free analysis" warning on 3rd use
   - Show upgrade prompt after limit: "Upgrade to continue"
   - Add "Download Report" button for detailed reports

2. **ConsultationRequestScreen.jsx** (new)
   - Display available agronomist count
   - Show estimated wait time based on queue
   - Real-time queue position updates
   - AI bot activation notification

3. **AgronomistDashboardScreen.jsx**
   - Update to show FIFO queue (not auto-assigned)
   - Add "Accept" button for each consultation
   - Show queue position and wait time
   - Filter: Pending vs Active consultations

4. **ConsultationChatScreen.jsx**
   - Display AI bot messages with different styling
   - Show handoff notification when agronomist joins
   - Indicate bot vs human sender

5. **ReportDetailScreen.jsx**
   - Add "Download Report" button
   - Show download progress
   - Open PDF in device viewer

### New Components Needed

1. **UsageLimitBanner.jsx**
   ```jsx
   <UsageLimitBanner 
     remaining={2} 
     total={3}
     isLifetime={true} // Key prop - no daily reset
   />
   // Output: "2 free analyses remaining (lifetime limit)"
   ```

2. **UpgradePrompt.jsx**
   ```jsx
   <UpgradePrompt 
     show={hasReachedLimit}
     options={[
       { type: 'detailed', price: 99 },
       { type: 'consultation', price: 199 }
     ]}
   />
   // Shows after 3rd analysis or on 4th attempt
   ```

---

## 🗄️ Database Schema Changes

### User Model

```javascript
// New fields (lifetime tracking - no reset)
freeAnalysisCount: Number (default: 0, max: 3)
freeAnalysisLimit: Number (default: 3)
hasReachedFreeLimit: Boolean (default: false)
isOnline: Boolean (default: false)
lastActiveAt: Date (default: Date.now)

// Removed fields (no daily reset)
❌ dailyAnalysisCount
❌ lastAnalysisDate
❌ totalFreeAnalysisUsed

// New methods
canDoFreeAnalysis() → { allowed: Boolean, remaining: Number, message: String }
incrementAnalysisCount() → void (no reset logic)
updateOnlineStatus(isOnline) → void

// Static methods
User.getOnlineAgronomistsCount() → Number
User.getAvailableAgronomists() → Array
```

---

## 🎨 UI/UX Guidelines

### Usage Limit Display (Lifetime)

**Color Coding**:
- 3 remaining: Green 🟢 "3 free analyses available"
- 2 remaining: Green 🟢 "2 free analyses remaining"
- 1 remaining: Orange 🟠 "Last free analysis"
- 0 remaining: Red 🔴 "Upgrade to continue"

**Messages** (emphasize lifetime limit):
```
3/3: "You have 3 free analyses"
2/3: "2 free analyses remaining"
1/3: "This is your last free analysis"
0/3: "Free limit reached. Upgrade to detailed report or consultation."
```

**Critical**: Never mention "daily", "today", "resets at midnight", or "tomorrow"

---

## 📦 Deployment Checklist

### Backend
- [x] Deploy User model with lifetime tracking
- [x] Deploy Consultation model with manual acceptance
- [x] Deploy AI bot service
- [x] Deploy updated routes
- [ ] Set environment variables:
  - `OPENAI_API_KEY` (optional)
  - `PDF_DIR`
  - `API_BASE_URL`
- [ ] Test lifetime limit enforcement
- [ ] Test AI bot activation
- [ ] Test PDF generation

### Database
- [ ] Run migration to update user fields
- [ ] Remove old daily tracking fields
- [ ] Add indexes for performance
- [ ] Backfill existing users with defaults

### Mobile App
- [ ] Update AnalysisScreen with lifetime limit display
- [ ] Create ConsultationRequestScreen
- [ ] Update AgronomistDashboardScreen
- [ ] Update ChatScreen for bot messages
- [ ] Add "Download Report" button
- [ ] Test on iOS and Android

---

## 📊 Success Metrics

### Monetization Impact
- Conversion rate: Free → Paid (target: **25%** with lifetime limit)
- Average revenue per user (expected increase: **40%**)
- Detailed report purchases
- Consultation bookings

### User Behavior
- % of users reaching 3-analysis limit
- Time to reach limit (expected: 1-3 days)
- % upgrading after limit vs churning
- Repeat purchase rate

### AI Bot Performance
- Activation rate (target: <30%)
- User satisfaction with bot responses
- Handoff time to human agronomist

---

## 📝 Summary

### What Changed from Original Plan

**Original**: 3 free analyses per day (resets daily)  
**Updated**: 3 free analyses lifetime (never resets)

**Reason**: Daily reset would not drive enough paid conversions. Users could simply wait until the next day instead of paying.

### Expected Outcomes

1. **Higher paid conversion** (25% vs 10-15% with daily reset)
2. **Faster monetization** (users hit limit in days, not weeks)
3. **Reduced abuse** (no gaming the system by waiting for reset)
4. **Better unit economics** (more revenue per user)
5. **Clearer value prop** ("Try 3 times free, then pay for quality")

### Key Messaging

- ✅ "Get 3 free plant analyses"
- ✅ "Try before you buy"
- ✅ "Upgrade anytime for unlimited access"
- ❌ "3 free per day" (misleading - it's lifetime)
- ❌ "Resets daily" (not true)

---

**End of Documentation**

*For questions or clarifications, contact the development team.*
