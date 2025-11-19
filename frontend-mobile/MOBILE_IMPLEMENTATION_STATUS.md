# Mobile App Implementation Status

## Overview
Plant Health Diagnosis Tool - Mobile Application (React Native)

This document tracks the implementation progress of the mobile application and provides guidance for completing remaining screens and features.

## Completed Files (4/11 Core Files)

### Infrastructure & Context
- ✅ `src/api/api.js` - API service layer with axios interceptors, token refresh mechanism, and all API endpoints
- ✅ `src/context/AuthContext.jsx` - Authentication context with user state management and useAuth hook

### Screens
- ✅ `src/screens/LoginScreen.jsx` - Farmer/User login with form validation and JWT authentication
- ✅ `src/screens/RegisterScreen.jsx` - Farmer registration with region selection and validation

## Remaining Screens (7 Files - High Priority)

### Core Functionality Screens
1. **HomeScreen.jsx** - Main dashboard showing:
   - List of pending consultations (farmer view) or waiting consultations (agronomist view)
   - Quick consultation submission button
   - Blog post feed integration
   - Pull-to-refresh functionality
   - INR currency display for any costs

2. **SubmitConsultationScreen.jsx** - Consultation creation:
   - Image picker for plant image upload
   - Plant name input
   - Symptom description (text area)
   - Region selection (pre-filled from profile)
   - Season selector
   - Submit button with loading state
   - MUST ensure INR currency for any associated costs

3. **ChatScreen.jsx** - Real-time consultation messaging:
   - WebSocket integration for real-time messages
   - Consultation details header
   - Message list with timestamps
   - Message input field
   - Agronomist can mark consultation as complete here
   - Backend sends email notifications on new messages

4. **AgronomistDashboardScreen.jsx** - Agronomist-specific views:
   - List of pending consultations (FIFO matching - NO rating bias)
   - Accept consultation button
   - View farmer details
   - Start chat functionality
   - Earned points and payout tracking (30% platform fee, 70% agronomist commission)
   - Collection-based payout information (not immediate UPI)

5. **ProfileScreen.jsx** - User profile management:
   - Display user information (name, email, phone, region)
   - Edit profile functionality
   - For agronomists: Show effectiveness rating, earned points, collection-based payout status
   - For farmers: Show consultation history, submitted issues
   - Logout button
   - Email on file for notifications

6. **BlogListScreen.jsx** - Blog feed with regional content:
   - List of published blog posts (80%+ effectiveness gate only)
   - Filter by region and season
   - Like and comment functionality
   - Engagement tracking (clicks, shares)
   - Community contributions moderated before publishing
   - INR currency display if any monetization

7. **Navigation/AppNavigator.jsx** - Root navigation setup:
   - Stack navigator for Auth screens (Login, Register)
   - Tab navigator for authenticated screens (Home, ConsultChat, Blog, Profile)
   - Authentication state handling
   - Token refresh on app resume

## Critical Requirements to Maintain

### Currency
- ✅ INR only - NO USD anywhere in the app
- Display rupee symbol (₹) with all amounts
- Use Intl.NumberFormat for proper INR formatting

### Consultation Matching
- ✅ FIFO (First In, First Out) - assign consultations in order
- ❌ NO rating-based discrimination
- Backend handles matching, frontend just displays

### Payout System
- ✅ Collection-based: Track earnings for batch payout
- ❌ NO immediate UPI transfers
- Show collection status: Pending → Ready for Collection → Collected
- Display commission split: 30% platform, 70% agronomist

### Notifications
- ✅ Email notifications at EVERY action:
  - Registration confirmation
  - Consultation submission
  - Consultation assigned (agronomist receives)
  - New message in consultation
  - Consultation completed
  - Payout processed
- Backend sends emails using simple Python/PHP mailer
- Mobile app shows in-app notifications + system push notifications

### Token Management
- ✅ AsyncStorage for persistent token storage
- ✅ 7-hour access token expiry
- ✅ Auto-refresh on 401 responses
- ✅ Force re-login on refresh token expiry

## Implementation Priorities

### Phase 1 (Current - Mobile Core) - Files 1-4 ✅
1. API Service Layer ✅
2. Auth Context ✅
3. Login Screen ✅
4. Register Screen ✅

### Phase 2 (Next - Mobile Main Features)
5. Navigation Setup
6. Home Screen
7. Submit Consultation Screen

### Phase 3 (Mobile Advanced Features)
8. Chat Screen
9. Agronomist Dashboard
10. Blog List Screen

### Phase 4 (Finalization)
11. Profile Screen
12. Push Notifications Setup
13. Integration Testing

## Testing Checklist

- [ ] Authentication flow: Registration → Login → Dashboard
- [ ] Token refresh on 401 response
- [ ] Consultation submission with image upload
- [ ] Real-time chat messaging via WebSocket
- [ ] FIFO consultation assignment (no rating bias)
- [ ] INR currency display in all monetary fields
- [ ] Email notifications sent for all actions
- [ ] Collection-based payout tracking
- [ ] Push notifications for consultation updates
- [ ] App handles token expiry and auto-refresh
- [ ] Offline resilience with AsyncStorage

## Notes

- All monetary amounts MUST be in INR
- All email notifications MUST be sent (no optional emails)
- Collection-based payout system requires careful tracking
- FIFO matching must be enforced (backend responsibility)
- Each screen should show region-specific content where applicable
- AsyncStorage for offline support and token persistence
- Use React Navigation for stack and tab navigation
- Implement proper error handling with user-friendly messages
- All forms should validate before submission
- Loading states on all async operations
