# Sales Automation System - Complete Setup & Testing Guide

## Project Overview

This is a complete MERN stack Sales Automation & Field Tracking System with Owner Portal, Employee Management, GPS Tracking, CRM, Inventory Management, and Advanced Analytics.

## System Features Implemented

### ✅ Completed Features

#### Backend Features
1. **Authentication & Authorization** ✓
   - JWT-based access and refresh tokens
   - Role-based access control (RBAC)
   - Token auto-refresh on 401 errors
   - Secure password hashing with bcryptjs

2. **User Management** ✓
   - User creation and listing
   - Profile update endpoints
   - Password change functionality
   - Avatar upload support
   - User deactivation

3. **Attendance Management** ✓
   - Check-in/Check-out system with GPS
   - Daily attendance tracking
   - Break duration logging
   - Real-time notifications

4. **GPS & Location Tracking** ✓
   - Real-time location updates via Socket.io
   - Manual location ping via REST API
   - 30-minute automatic tracking for sales reps
   - Location history and audit trail
   - Latest location queries

5. **Customer Management** ✓
   - Customer CRUD operations
   - Customer interaction logging
   - Customer assignment to sales reps
   - Search and filtering

6. **Lead Management** ✓
   - Lead creation and assignment
   - Lead status tracking
   - Lead pipeline management
   - Automated notifications for assignments

7. **Order Management** ✓
   - Create orders with multiple items
   - Order status tracking (draft, approved, fulfilled, cancelled)
   - Payment status synchronization
   - Order history

8. **Invoice & Quotations** ✓
   - Invoice generation from orders
   - Quotation management
   - Status tracking (draft, sent, accepted, rejected)
   - File uploads support

9. **Payment Tracking** ✓
   - Payment recording and history
   - Multiple payment modes support
   - Automatic payment status calculation
   - Overdue payment tracking

10. **Product & Inventory** ✓
    - Product catalog management
    - Stock level tracking
    - Low stock alerts
    - Inventory movement history
    - Product image uploads

11. **Daily Reports** ✓
    - Employee daily activity reporting
    - Report submission and review
    - Performance metrics

12. **Targets & Reminders** ✓
    - Daily/weekly target assignment
    - Target progress tracking
    - Reminder management with due dates
    - Customer follow-up reminders

13. **Visits & Geo-fencing** ✓
    - Visit creation and tracking
    - Check-in/Check-out with verification
    - Geo-fence verification
    - Visit attachments

14. **Notifications** ✓
    - Real-time notifications via Socket.io
    - User notification management
    - Mark as read functionality

15. **Analytics & Reporting** ✓
    - Dashboard KPIs
    - Sales by employee reports
    - Attendance analytics
    - Lead conversion analytics

16. **Documents** ✓
    - Document management system
    - Secure file uploads
    - Document categorization

#### Frontend Features
1. **Authentication** ✓
   - Login/Register pages
   - Token refresh mechanism
   - Automatic logout on token expiry
   - Protected routes with role-based access

2. **Socket.io Integration** ✓
   - Real-time location updates
   - Live notifications
   - Attendance tracking
   - Event-based communication

3. **Auto Location Tracking** ✓
   - 30-minute automatic GPS tracking
   - Fallback to REST API if Socket.io fails
   - Battery and accuracy monitoring
   - Real-time map visualization

4. **Responsive Dashboards** ✓
   - Owner dashboard
   - Admin dashboard
   - Manager dashboard
   - Sales representative dashboard

5. **Data Visualization** ✓
   - Charts and graphs with Recharts
   - Real-time analytics
   - Performance metrics

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5+ (local or cloud)
- ImageKit account (for file uploads)
- Git

## Installation & Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - MONGODB_URI
# - JWT_ACCESS_SECRET
# - JWT_REFRESH_SECRET
# - IMAGEKIT credentials

# Seed admin user (optional)
npm run seed:admin

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your API URL
# VITE_API_URL=http://localhost:5000/api/v1

# Start development server
npm run dev
```

## Running the Application

### Terminal 1 - Start MongoDB (if local)
```bash
mongod --dbpath /path/to/your/mongodb/data
```

### Terminal 2 - Start Backend
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:5000

### Terminal 3 - Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:5173

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user (admin only)
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### User Management
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user (admin only)
- `GET /api/v1/users/profile/me` - Get my profile
- `PATCH /api/v1/users/profile/me` - Update my profile
- `POST /api/v1/users/profile/change-password` - Change password
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user
- `POST /api/v1/users/profile/avatar` - Upload avatar

### Attendance
- `POST /api/v1/attendance/check-in` - Check in
- `POST /api/v1/attendance/check-out` - Check out
- `GET /api/v1/attendance` - Get attendance records

### Location Tracking
- `POST /api/v1/locations` - Create location ping
- `GET /api/v1/locations` - Get location history
- `GET /api/v1/locations/latest` - Get latest locations (admin/manager only)

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer details
- `PATCH /api/v1/customers/:id` - Update customer
- `POST /api/v1/customers/:id/interactions` - Add interaction

### Leads
- `GET /api/v1/leads` - List leads
- `POST /api/v1/leads` - Create lead
- `GET /api/v1/leads/:id` - Get lead details
- `PATCH /api/v1/leads/:id` - Update lead

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details
- `PATCH /api/v1/orders/:id/status` - Update order status

### Invoices
- `GET /api/v1/invoices` - List invoices
- `POST /api/v1/invoices` - Create invoice from order
- `PATCH /api/v1/invoices/:id/status` - Update invoice status

### Quotations
- `GET /api/v1/quotations` - List quotations
- `POST /api/v1/quotations` - Create quotation
- `PATCH /api/v1/quotations/:id/status` - Update status

### Payments
- `GET /api/v1/payments` - List payments
- `POST /api/v1/payments` - Record payment

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product (admin/manager)
- `PATCH /api/v1/products/:id` - Update product
- `POST /api/v1/products/:id/stock` - Adjust stock
- `POST /api/v1/products/:id/images` - Upload product image

### Daily Reports
- `POST /api/v1/daily-reports` - Submit daily report
- `GET /api/v1/daily-reports` - List reports (admin/manager)
- `PATCH /api/v1/daily-reports/:id/review` - Review report

### Targets
- `GET /api/v1/targets` - List targets
- `POST /api/v1/targets` - Create target (admin/manager)
- `PATCH /api/v1/targets/:id/progress` - Update progress

### Reminders
- `GET /api/v1/reminders` - List reminders
- `POST /api/v1/reminders` - Create reminder
- `PATCH /api/v1/reminders/:id` - Update reminder

### Visits
- `GET /api/v1/visits` - List visits
- `POST /api/v1/visits` - Create visit
- `PATCH /api/v1/visits/:id/check-in` - Check in visit
- `PATCH /api/v1/visits/:id/complete` - Complete visit

### Documents
- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents` - Upload document

### Notifications
- `GET /api/v1/notifications` - List my notifications
- `PATCH /api/v1/notifications/:id/read` - Mark as read

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard summary
- `GET /api/v1/analytics/sales-by-employee` - Sales report

## Testing the Application

### 1. Test User Login
```bash
# Login with default credentials (if seeded)
Email: admin@biogenics.com
Password: Admin@12345

# Or create a new user via register endpoint
```

### 2. Test Auto Location Tracking
1. Login as a sales representative
2. The app automatically initializes Socket.io and starts 30-min tracking
3. Check Location Tracking page to see updates
4. Verify database has LocationPing entries

### 3. Test Token Refresh
1. Wait 15 minutes for access token to expire
2. Make any API request
3. System automatically refreshes token
4. Request completes successfully

### 4. Test GPS Tracking
1. Open GPS Tracking page
2. Click "Send Location Now" to manually send location
3. Or wait for automatic update every 30 minutes
4. Verify live map updates with employee positions

### 5. Test Attendance
1. Click "Check In" (requires GPS location)
2. Click "Check Out"
3. View attendance records
4. Verify calculations (working hours, breaks)

### 6. Test Orders & Invoices
1. Create a customer
2. Create an order with products
3. Generate invoice from order
4. Record payment
5. Verify order status updates automatically

### 7. Test Real-time Notifications
1. Open app in two browser windows
2. In window 1: Assign a lead to a user in window 2
3. Window 2 receives real-time notification immediately
4. Notification appears in notification center

### 8. Test Role-Based Access
```bash
# Test with different user roles:
- Owner: Full access to all features
- Admin: Management functions
- Manager: Team oversight
- Sales: Self-view and field activities
```

### 9. Test File Uploads
1. Upload product images
2. Upload documents
3. Upload invoice files
4. Upload visit attachments
5. Verify files are stored in ImageKit

## Troubleshooting

### MongoDB Connection Error
```
Solution: Ensure MongoDB is running
mongod --dbpath /path/to/data
```

### CORS Error
```
Solution: Check CLIENT_URL in backend .env
Should match frontend URL (http://localhost:5173)
```

### Socket.io Connection Error
```
Solution: Verify backend is running and VITE_API_URL is correct
Check browser console for connection details
```

### ImageKit Upload Error
```
Solution: Verify ImageKit credentials in .env
IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT
```

### Token Refresh Not Working
```
Solution: Ensure refreshToken is stored in localStorage
Check API interceptor logs in browser console
```

## Database Models

All models include:
- Timestamps (createdAt, updatedAt)
- Proper indexing for performance
- Validation on creation/update
- Soft delete support (if applicable)

### Key Models
- User (with roles and permissions)
- Attendance (with location tracking)
- LocationPing (GPS history)
- Customer (with interactions)
- Lead (with assignment)
- Order (with items and payments)
- Invoice & Quotation
- Payment
- Product & InventoryMovement
- DailyReport
- Target
- Reminder
- Visit
- Notification
- Document
- AuditLog

## Security Features

✓ JWT token-based authentication
✓ Refresh token rotation
✓ Password hashing with bcryptjs
✓ Rate limiting (100 requests/15min)
✓ CORS protection
✓ Helmet security headers
✓ XSS protection
✓ MongoDB sanitization
✓ HPP protection
✓ Request size limiting (2MB)

## Performance Optimizations

✓ Database indexing on frequently queried fields
✓ Pagination for large datasets
✓ Connection pooling
✓ Redis caching ready (can be implemented)
✓ Asset compression
✓ Lazy loading in frontend
✓ Component code-splitting

## Deployment Ready

- Express server with production configurations
- Proper environment variable handling
- Error handling and logging
- HTTPS ready (with NODE_ENV=production)
- Docker support ready
- Database backups recommended

## Next Steps (Post-Deployment)

1. Setup SSL certificates
2. Configure production database
3. Setup email service for notifications
4. Configure cloud storage (AWS S3, Google Cloud)
5. Setup monitoring and logging
6. Configure CI/CD pipeline
7. Performance monitoring
8. Security audits

## Support & Documentation

For more details on specific features:
- See API documentation in each route file
- Check controller logic for business rules
- Review model schemas for data structure
- Check middleware for auth flows

---

**Version:** 1.0.0
**Last Updated:** May 23, 2026
**Status:** Production Ready ✓
