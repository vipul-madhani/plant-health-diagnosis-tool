# Complete Implementation Guide - 28 Files

## Status
- ✅ File 1 Created: `backend-api/auth_routes.py` - JWT auth (register, login, refresh, logout)
- ⏳ Files 2-28: TODO - See breakdown below

## FILES TO CREATE (Priority Order)

### BACKEND FILES (3 files)
1. backend-api/chat_routes.py - WebSocket chat, message persistence
2. backend-api/consultation_routes.py - FIFO queue, submit, accept
3. backend-api/blog_routes.py - Feed, detail, engagement (like/save/share)

### MOBILE API SERVICE (1 file)
4. frontend-mobile/src/services/api.js - All endpoints, AsyncStorage tokens

### MOBILE SCREENS (8 files)
5. frontend-mobile/src/screens/LoginScreen.jsx
6. frontend-mobile/src/screens/RegisterScreen.jsx
7. frontend-mobile/src/screens/HomeScreen.jsx
8. frontend-mobile/src/screens/ConsultationBookingScreen.jsx
9. frontend-mobile/src/screens/ChatScreen.jsx - WebSocket integration
10. frontend-mobile/src/screens/AgronomistDashboardScreen.jsx - FIFO queue
11. frontend-mobile/src/screens/UserReportsScreen.jsx
12. frontend-mobile/src/screens/ProfileScreen.jsx

### MOBILE AUTHENTICATION (2 files)
13. frontend-mobile/src/context/AuthContext.jsx
14. frontend-mobile/src/hooks/useAuth.js

### WEBSITE PUBLIC PAGES (5 files)
15. frontend-web/src/pages/HomePage.jsx
16. frontend-web/src/pages/RegisterPage.jsx
17. frontend-web/src/pages/BlogListPage.jsx
18. frontend-web/src/pages/BlogDetailPage.jsx
19. frontend-web/src/pages/BlogSearchPage.jsx

### WEB AUTHENTICATION (2 files)
20. frontend-web/src/context/AuthContext.jsx (uses localStorage)
21. frontend-web/src/hooks/useAuth.js

### WEB API SERVICE (1 file)
22. frontend-web/src/services/api.js (Enhanced - same as mobile)

### DATABASE SCHEMAS (3 files)
23. db/schema_auth_sessions.sql - user_sessions table
24. db/schema_chat_messages.sql - chat_messages table
25. db/schema_blog_engagement.sql - blog_engagement table

### DOCUMENTATION (3 files)
26. docs/API_INTEGRATION_GUIDE.md
27. docs/MOBILE_SETUP.md
28. docs/DEPLOYMENT_CHECKLIST.md

## KEY IMPLEMENTATION NOTES

- All mobile screens use React Native + NativeBase
- All web pages use ReactJS + Material-UI
- Tokens stored in AsyncStorage (mobile) & localStorage (web)
- WebSocket for real-time chat
- INR currency throughout
- Email notifications at EVERY action
- 30-70 commission split enforced
- FIFO consultation matching
- Collection-based payouts

## NEXT STEPS

1. Download this guide
2. Use VS Code to create each file locally
3. Follow the structure for each file type
4. Test each component before pushing to GitHub
5. Use git commands to commit in batches

For detailed file content, refer to the IMPLEMENTATION_PLAN.md in this repository.
