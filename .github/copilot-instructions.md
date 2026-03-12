# Instructions for ProBugs

ProBugs is an **AI-powered IT ticket management system** with real-time collaboration features. This guide helps AI agents understand the architecture, workflows, and conventions.

## Architecture Overview

### Stack & Key Tech
- **Backend**: Node.js + Express, MongoDB, Socket.io for real-time updates, JWT auth
- **Frontend**: React 18 + Vite, React Router v6, Tailwind CSS, Framer Motion animations
- **Communication**: REST API + WebSocket (Socket.io) for live ticket updates and presence tracking
- **Deployment**: Backend on port 5000, frontend on Vite dev server (port 5173)

### Core Components

#### Backend Structure (`backend/`)
- **Routes**: Auth, Tickets, Analytics (mounted at `/api/{auth,tickets,analytics}`)
- **Controllers**: Handle request logic, emit real-time events via Socket.io
- **Models**: Ticket (with AI predictions), User (roles: user/agent/admin)
- **Middleware**: JWT auth (`protect`), role-based access control (`authorize`)
- **Services**: 
  - `aiService.js` - Keyword-based NLP for category/priority prediction (simulated ML)
  - `slaService.js` - Runs every 10 mins, escalates tickets exceeding SLA deadlines

#### Frontend Structure (`frontend/src/`)
- **Context Providers**: Auth, Socket, Notifications (wrapped in App.jsx)
- **Pages**: Dashboard variants (user/agent/admin), ticket detail, AI training, logs, settings
- **Components**: ProtectedRoute, Sidebar
- **Data Flow**: Auth context → axios interceptor → API calls; Socket context → real-time events

### Data Flows

#### Ticket Lifecycle
1. **Creation**: User creates ticket → Backend applies AI analysis (category/priority/confidence/explanation) → Socket emits `ticket_created` → Real-time broadcast to agents
2. **Viewing**: Users join ticket via Socket (`join_ticket` event) → Presence updates broadcast → Multiple editors see live typing indicators
3. **SLA Monitoring**: Background job checks for breaches every 10 mins → `isEscalated` flag set → System broadcasts warning via Socket

#### Role-Based Access
- **User**: Can see only their own tickets (`user` field in Ticket model)
- **Agent/Admin**: Can see all tickets, assign, update, manage analytics
- Routes enforce via `authorize` middleware

## Developer Workflows

### Local Setup
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev
# Runs on http://localhost:5000

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev
# Runs on http://localhost:5173
```

### Key Commands
- `npm run dev` - Start dev servers (both use nodemon/Vite hot reload)
- `npm run build` - Build for production (frontend: `vite build`)
- `npm run lint` - ESLint check (frontend only, enforces 0 warnings)

### MongoDB Setup
- Default: `mongodb://127.0.0.1:27017/probugs` (local instance)
- Env var: `MONGODB_URI` (set in `.env`)
- Models auto-connect via mongoose in `server.js`

### Environment Variables
Create `.env` in backend root:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/probugs
JWT_SECRET=your_secret_key_here
```

## Project-Specific Patterns

### AI Analysis Pattern
The `aiService.analyzeTicket()` function uses keyword matching (not ML models):
- **Categorization**: Matches ticket text against `KEYWORDS` object (Hardware, Software, Network, etc.)
- **Priority**: Applies `CRITICAL_KEYWORDS` heuristic (multiple matches → "Urgent", single → "High")
- **Output**: Returns `{category, priority, confidence, explanation}` → stored in Ticket as `aiCategory`, `aiPriority`, `aiConfidence`, `aiExplanation`
- **When to modify**: Add keywords in `KEYWORDS`/`CRITICAL_KEYWORDS` to improve predictions; confidence calculation is in analyzeTicket()

### Real-Time Event Pattern
All real-time updates use consistent Socket.io convention:
```javascript
// In controllers, emit via req.app.get('socketio'):
const io = req.app.get('socketio');
io.emit('ticket_created', ticket);  // All clients
io.to(ticketId).emit('viewers_updated', viewers);  // Specific room
io.emit('system_log', { id, time, type, msg });  // System-wide log
```
- Events from backend: `ticket_created`, `ticket_updated`, `viewers_updated`, `user_typing`, `system_log`
- Frontend listens in App.jsx `GlobalListeners` component and NotificationContext
- **Convention**: Use `io.emit()` for broadcast, `io.to(room).emit()` for targeted updates

### Auth Pattern
- JWT stored in localStorage (frontend) and Authorization header (backend)
- Every request: middleware checks `Bearer token` → verifies signature → attaches `req.user`
- Routes use `protect` (auth required) then `authorize('admin', 'agent')` (role check)
- Frontend redirects unauthenticated users via ProtectedRoute component

### Ticket Status Enums
Use exact enum values: `['Open', 'In Progress', 'Blocked', 'Resolved', 'Closed']`
Use exact priority: `['Low', 'Medium', 'High', 'Urgent']`
Use exact categories: `['Hardware', 'Software', 'Network', 'Access', 'Cloud', 'HR', 'Security', 'Infrastructure', 'Documentation', 'Unknown']`

### Form/API Response Convention
- Success responses: `{ success: true, data: {...}, count?: number }`
- Error responses: `{ success: false, error: 'message' }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad request), 401 (Auth), 403 (Forbidden), 500 (Server error)

## Integration Points & External Dependencies

### Socket.io Connection
- Frontend: Initialized in SocketContext, connects to `localhost:5000` or production host
- Backend: Initialized with CORS permitting all origins (`"*"`)
- **Key consideration**: Presence tracking (ticketViewers object) persists only in memory; doesn't survive server restart

### Mongoose Models
- Models auto-connect in server.js via `mongoose.connect(MONGODB_URI)`
- Ticket model uses ObjectId refs to User model
- **Convention**: Fields like `aiCategory`, `aiSlaRisk` are pre-populated during create/update; frontend can conditionally show AI confidence badges

### Axios Interceptor (Frontend)
- Auth token auto-added to request headers
- Base URL defaults to current origin (dev: localhost:3000 → localhost:5000 API, prod: same domain)
- No explicit interceptor configured; relies on default axios behavior with `/api` routes

## Critical Gotchas & Testing Tips

1. **SLA Escalation**: Runs only if ticket status is not "Resolved"/"Closed"; runs every 10 mins via scheduler in server.js
2. **Presence Cleanup**: When user disconnects, loop through all ticketViewers rooms to clean up; stale entries can accumulate if Socket connection drops unexpectedly
3. **Role-Based Rendering**: User sees only their tickets, agents see all—verify filtering in `getTickets` controller before frontend rendering
4. **AI Confidence**: Always between 0.5-1.0; lower confidence = less reliable predictions; UI should show visual indicator (e.g., badge color)
5. **Cross-Origin Socket**: Frontend socket connects to backend port 5000 even on same domain; ensure CORS is enabled

## Common Additions

When extending this system, follow these patterns:
- **New endpoint**: Create route file → mount in server.js → add controller with `emitRealTime()` helper
- **New real-time event**: Emit in controller → listen in App.jsx `GlobalListeners` or specific page
- **New User role**: Update User model enum → add route `authorize()` checks → update frontend role checks
- **Database field**: Add to Ticket or User model → update controllers → backfill existing records if needed
