# Quick Start Guide - Sales Automation System

## 5-Minute Setup

### Prerequisites Check
```bash
node --version  # Should be 18+
npm --version
mongod --version  # If using local MongoDB
```

### Step 1: Backend Setup (1 min)
```bash
cd backend
npm install
```

### Step 2: Backend Configuration (1 min)
Create `.env` file:
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/sales-automation
JWT_ACCESS_SECRET=your_secret_key_at_least_32_chars_long
JWT_REFRESH_SECRET=your_refresh_secret_at_least_32_chars
IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Step 3: Frontend Setup (1 min)
```bash
cd ../frontend
npm install
```

### Step 4: Frontend Configuration (1 min)
Create `.env` file:
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### Step 5: Start Everything (1 min)
**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```
Output: `API running in development mode on port 5000`

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```
Output: `Local: http://localhost:5173`

## Default Credentials

If you ran `npm run seed:admin` in backend:
```
Email: admin@biogenics.com
Password: Admin@12345
Role: Owner
```

## Verify Installation

1. Open http://localhost:5173 in browser
2. Try login with credentials above
3. You should see the dashboard
4. Check Network tab - requests should go to http://localhost:5000

## Key Features to Test

### ✅ Immediate Tests
1. **Login** - Test authentication
2. **Profile Update** - Edit your profile
3. **View Dashboard** - See analytics
4. **Auto Location Tracking** - Check Location page (30-min auto-update enabled)

### ✅ Interactive Tests
1. **Create Lead** - Enter lead data, assign to user
2. **Create Order** - Add products and create invoice
3. **Record Payment** - Mark invoice as paid
4. **Check Attendance** - Manual check-in/out with GPS
5. **Send Location** - Manual GPS location update

## Important Notes

### Token Refresh ✓
- Access token expires in 15 minutes
- System automatically refreshes using refresh token
- No logout unless refresh token is invalid
- All happens seamlessly in background

### Auto Location Tracking ✓
- Sales reps tracked every 30 minutes automatically
- Requires geolocation permission
- Fallback to REST API if Socket.io unavailable
- Battery and accuracy info sent with each ping

### Real-time Updates ✓
- Socket.io connects automatically after login
- Location updates broadcast to managers/admins
- Notifications appear in real-time
- Attendance updates push to dashboards

## API Endpoints (Quick Reference)

```
Auth:
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh
  POST /api/v1/auth/logout

Profile:
  GET /api/v1/users/profile/me
  PATCH /api/v1/users/profile/me
  POST /api/v1/users/profile/change-password

Location:
  POST /api/v1/locations  (manual ping)
  GET /api/v1/locations/latest  (admin/manager)

Attendance:
  POST /api/v1/attendance/check-in
  POST /api/v1/attendance/check-out

Orders:
  GET /api/v1/orders
  POST /api/v1/orders
  PATCH /api/v1/orders/:id/status

Quotations & Invoices:
  GET /api/v1/quotations
  GET /api/v1/invoices
  POST /api/v1/invoices

Inventory & Visits:
  GET /api/v1/inventory/movements
  GET /api/v1/visits
  POST /api/v1/visits
```

## Database Reset (Clean Slate)

```bash
# Delete all collections (WARNING: removes all data)
# In MongoDB shell:
db.dropDatabase()

# Then seed fresh admin:
npm run seed:admin
```

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Can't login | Check MongoDB is running, clear browser cache |
| 404 on API call | Verify backend port 5000 is correct |
| No real-time updates | Check Socket.io connection in browser DevTools Network tab |
| File upload fails | Verify ImageKit credentials in .env |
| CORS error | Verify CLIENT_URL in backend .env matches frontend URL |

## Next: Production Deployment

For deployment to production:
1. Set `NODE_ENV=production`
2. Use managed MongoDB (MongoDB Atlas)
3. Setup environment variables on hosting platform
4. Build frontend: `npm run build`
5. Serve from CDN or static host
6. Setup SSL certificates
7. Configure domain DNS

---
**Status:** ✓ Ready to use
**All features:** ✓ Implemented and tested
**Documentation:** ✓ Complete
