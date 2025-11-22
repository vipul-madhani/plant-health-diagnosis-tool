# New Workflow Implementation Guide
## AgriIQ Plant Health Diagnosis Tool

**Last Updated**: November 22, 2025, 10:30 PM IST  
**Implementation Status**: ✅ Backend Complete | 🚧 Frontend In Progress

---

## 🎯 Overview

This document describes the new consultation workflow with manual agronomist acceptance, AI bot support, and 3 free analyses per day limit.

---

## 📋 Key Features Implemented

### 1. ✅ 3 Free Analyses Per Day Limit

**Business Logic**:
- Each user gets 3 free basic analyses per day
- Counter resets at midnight (00:00 IST)
- After limit: Prompt to purchase detailed report (₹99) or consultation (₹199)

**User Model Fields**:
```javascript
dailyAnalysisCount: Number (current day count)
lastAnalysisDate: Date (last analysis timestamp)
totalFreeAnalysisUsed: Number (lifetime count)
```

**API Endpoints**:
- `GET /api/analysis/usage-limit` - Check remaining free analyses
- `POST /api/analysis/basic` - Enforces limit before analysis

**User Experience**:
```
Analysis 1: "2/3 free analyses remaining today"
Analysis 2: "1/3 free analyses remaining today"
Analysis 3: "0/3 free analyses remaining today"
Analysis 4: "Daily limit reached. Upgrade to continue."
```

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

#### **Scenario A: Basic Analysis**

1. **Upload Plant Image**
   - Check remaining free analyses: `GET /api/analysis/usage-limit`
   - Display: "2/3 free analyses remaining"

2. **ML Analysis** (if limit not exceeded)
   - Call: `POST /api/analysis/basic` with image
   - Receive: Diagnosis, confidence, quick tips
   - Counter updated: "1/3 free analyses remaining"

3. **View Results**
   - Show diagnosis and confidence
   - Display two options:
     - **Option 1**: Detailed Report (₹99)
     - **Option 2**: Consult Agronomist (₹199)

#### **Scenario B: Get Detailed Report**

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

#### **Scenario C: Consult with Agronomist**

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

#### **Scenario D: Daily Limit Reached**

1. **Attempt 4th Analysis**
   - Call: `POST /api/analysis/basic`
   - Response: HTTP 403 "Daily limit reached"

2. **Upgrade Prompt**
   - Show: "You've used all 3 free analyses today"
   - Options:
     - Get Detailed Report (₹99)
     - Consult Agronomist (₹199)
   - Display: "Resets at midnight"

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

#### **Go Offline**

1. **Logout or Inactivity**
   - Auto-offline if inactive for 5+ minutes
   - Status: `isOnline: false`
   - No longer shown in available count

---

## 🔌 API Reference

### Analysis Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analysis/usage-limit` | Required | Check daily limit |
| POST | `/api/analysis/basic` | Required | Free analysis (3/day) |
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
   - Add usage limit display: "2/3 free analyses remaining"
   - Show limit exceeded message with upgrade options
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
   />
   // Output: "2/3 free analyses remaining today"
   ```

2. **AgronomistAvailability.jsx**
   ```jsx
   <AgronomistAvailability 
     count={3} 
     estimatedWait={5} 
   />
   // Output: "3 agronomists available • ~5 min wait"
   ```

3. **QueuePositionCard.jsx**
   ```jsx
   <QueuePositionCard 
     position={2} 
     totalInQueue={5} 
   />
   // Output: "You're #2 in queue (3 ahead of you)"
   ```

4. **AiBotIndicator.jsx**
   ```jsx
   <AiBotIndicator 
     isActive={true} 
   />
   // Output: "🤖 AI Assistant is helping you"
   ```

---

## 🗄️ Database Schema Changes

### User Model

```javascript
// New fields added
dailyAnalysisCount: Number (default: 0)
lastAnalysisDate: Date (default: null)
totalFreeAnalysisUsed: Number (default: 0)
isOnline: Boolean (default: false)
lastActiveAt: Date (default: Date.now)

// New methods
canDoFreeAnalysis() → { allowed: Boolean, remaining: Number }
incrementAnalysisCount() → void
updateOnlineStatus(isOnline) → void

// Static methods
User.getOnlineAgronomistsCount() → Number
User.getAvailableAgronomists() → Array
```

### Consultation Model

```javascript
// New fields added
status: 'pending' | 'accepted' | 'in_progress' | 'completed'
isAiBotAssisted: Boolean (default: false)
aiBotActivatedAt: Date (default: null)
acceptedAt: Date (default: null)
queuePosition: Number (default: null)
waitTimeMinutes: Number (default: 0)

// New methods
activateAiBot() → void
acceptByAgronomist(agronomistId) → void
complete() → void

// Static methods
Consultation.getFIFOQueue() → Array
Consultation.getQueuePosition(id) → Number
```

### Analysis Model

```javascript
// New field added
pdfPath: String (default: null)

// Field indicates PDF is available for download
```

---

## 🎨 UI/UX Guidelines

### Usage Limit Display

**Color Coding**:
- 3 remaining: Green 🟢
- 2 remaining: Green 🟢
- 1 remaining: Orange 🟠
- 0 remaining: Red 🔴

**Messages**:
```
3/3: "You have 3 free analyses remaining today"
2/3: "2 free analyses left for today"
1/3: "Last free analysis for today"
0/3: "Daily limit reached. Resets at midnight"
```

### Agronomist Availability

**Icons**:
- 0 agronomists: 🤖 (robot - AI bot will help)
- 1-3 agronomists: 👨‍🌾 (single farmer icon)
- 4+ agronomists: 👥 (multiple people icon)

**Colors**:
- Available: Green badge
- Busy: Orange badge
- Offline: Gray badge

### AI Bot Messages

**Visual Distinction**:
- Different background color (light blue)
- Robot avatar 🤖
- Badge: "AI Assistant"
- Slightly different font style

**Handoff Message** (when agronomist joins):
```
🎉 Good news! Rahul Sharma, our expert 
agronomist, has joined the consultation.
```

---

## ⚡ Performance Optimizations

### AI Bot Response Time
- Average: 1-2 seconds
- Max: 5 seconds
- Timeout: 10 seconds (fallback to generic response)

### Queue Updates
- WebSocket for real-time position updates
- Fallback: Poll every 10 seconds
- Show loading state during updates

### PDF Generation
- Async generation (background job)
- Show progress: "Generating report..."
- Notification when ready
- Cache for 30 days

---

## 🔒 Security Considerations

### Rate Limiting
- Analysis endpoint: 10 requests/minute
- Consultation creation: 3 requests/hour
- Chat messages: 30 messages/minute

### PDF Access Control
- Verify user owns the analysis
- Generate signed URLs (optional)
- Auto-delete after 90 days (GDPR)

### AI Bot Safety
- No medical diagnoses
- Disclaimer in welcome message
- Escalate critical cases
- Log all bot interactions

---

## 📦 Deployment Checklist

### Backend
- [ ] Deploy User model updates
- [ ] Deploy Consultation model updates
- [ ] Deploy AI bot service
- [ ] Deploy updated routes
- [ ] Set environment variables:
  - `OPENAI_API_KEY` (optional)
  - `PDF_DIR`
  - `API_BASE_URL`
- [ ] Test AI bot activation
- [ ] Test PDF generation

### Database
- [ ] Run migration to add new fields
- [ ] Add indexes for performance
- [ ] Backfill existing users with defaults

### Mobile App
- [ ] Update AnalysisScreen with usage display
- [ ] Create ConsultationRequestScreen
- [ ] Update AgronomistDashboardScreen
- [ ] Update ChatScreen for bot messages
- [ ] Add "Download Report" button
- [ ] Test on iOS and Android

### Testing
- [ ] Test daily limit reset at midnight
- [ ] Test AI bot activation timing
- [ ] Test agronomist acceptance flow
- [ ] Test PDF download on devices
- [ ] Load test with 100 concurrent users

---

## 📊 Success Metrics

### User Engagement
- Daily active users using free analyses
- Conversion rate: Free → Paid (target: 15%)
- Average analyses per user per day

### AI Bot Performance
- Activation rate (target: <30%)
- User satisfaction with bot responses
- Handoff time to human agronomist
- Message response accuracy

### Agronomist Efficiency
- Average acceptance time (target: <60 sec)
- Consultations per agronomist per day
- Earnings per agronomist
- User rating (target: 4.5+/5)

### Revenue Impact
- Detailed report purchases
- Consultation bookings
- Repeat customer rate
- Average revenue per user

---

## 📝 Summary

### What Changed

1. **Free analyses limited to 3 per day** (was unlimited)
2. **Agronomists manually accept** (was auto-assigned)
3. **AI bot provides immediate help** (was just waiting)
4. **PDF reports downloadable in app** (was email only)
5. **Real-time online agronomist count** (was hidden)

### Why These Changes

1. **Prevent abuse** of free tier
2. **Empower agronomists** to choose consultations
3. **Reduce wait time** with AI assistance
4. **Better user experience** with in-app downloads
5. **Build trust** by showing availability

### Expected Outcomes

1. **Higher conversion** from free to paid
2. **Faster response times** with AI bot
3. **Better agronomist satisfaction** with manual acceptance
4. **Improved user experience** with downloads
5. **Reduced churn** due to wait times

---

**End of Documentation**

*For questions or clarifications, contact the development team.*
