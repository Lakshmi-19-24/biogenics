# API Testing & Verification Guide

## Complete API Testing Guide for All Endpoints

### Prerequisites
- Backend running on http://localhost:5000
- Frontend running on http://localhost:5173
- MongoDB connected
- Postman or similar tool (optional)

---

## Authentication Tests

### 1. Login Test
```
POST /api/v1/auth/login
Body: {
  "email": "admin@biogenics.com",
  "password": "Admin@12345"
}
Expected: 200 OK with accessToken, refreshToken, user
```

### 2. Token Refresh Test
```
POST /api/v1/auth/refresh
Body: {
  "refreshToken": "<your_refresh_token>"
}
Expected: 200 OK with new accessToken
```

### 3. Get Current User Test
```
GET /api/v1/auth/me
Headers: Authorization: Bearer <accessToken>
Expected: 200 OK with user data
```

### 4. Logout Test
```
POST /api/v1/auth/logout
Headers: Authorization: Bearer <accessToken>
Expected: 200 OK
```

---

## User & Profile Tests

### 1. Get My Profile
```
GET /api/v1/users/profile/me
Headers: Authorization: Bearer <accessToken>
Expected: 200 OK with profile data
```

### 2. Update My Profile
```
PATCH /api/v1/users/profile/me
Headers: Authorization: Bearer <accessToken>
Body: {
  "name": "New Name",
  "phone": "+1234567890",
  "branch": "North Branch"
}
Expected: 200 OK with updated profile
```

### 3. Change Password
```
POST /api/v1/users/profile/change-password
Headers: Authorization: Bearer <accessToken>
Body: {
  "currentPassword": "Admin@12345",
  "newPassword": "NewPassword@123"
}
Expected: 200 OK
```

### 4. List Users (Admin/Manager)
```
GET /api/v1/users?page=1&limit=10&search=admin
Headers: Authorization: Bearer <adminToken>
Expected: 200 OK with user list
```

---

## Attendance Tests

### 1. Check In
```
POST /api/v1/attendance/check-in
Headers: Authorization: Bearer <salesToken>
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "status": "present"
}
Expected: 200 OK with attendance record
```

### 2. Check Out
```
POST /api/v1/attendance/check-out
Headers: Authorization: Bearer <salesToken>
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "breakMinutes": 30
}
Expected: 200 OK with updated attendance
```

### 3. Get Attendance Records
```
GET /api/v1/attendance?page=1&limit=10
Headers: Authorization: Bearer <token>
Expected: 200 OK with attendance list
```

---

## Location Tracking Tests

### 1. Send Location Manually
```
POST /api/v1/locations
Headers: Authorization: Bearer <token>
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "speed": 0,
  "battery": 85,
  "metadata": {
    "source": "manual"
  }
}
Expected: 201 Created with location ping
```

### 2. Get Location History
```
GET /api/v1/locations?employee=<userId>&page=1&limit=20
Headers: Authorization: Bearer <managerToken>
Expected: 200 OK with location history
```

### 3. Get Latest Locations
```
GET /api/v1/locations/latest
Headers: Authorization: Bearer <managerToken>
Expected: 200 OK with latest location per employee
```

---

## Customer Tests

### 1. Create Customer
```
POST /api/v1/customers
Headers: Authorization: Bearer <token>
Body: {
  "name": "ABC Corporation",
  "phone": "+1234567890",
  "contactPerson": "John Doe",
  "email": "john@abc.com",
  "type": "B2B",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  }
}
Expected: 201 Created with customer data
```

### 2. List Customers
```
GET /api/v1/customers?page=1&limit=10&search=ABC
Headers: Authorization: Bearer <token>
Expected: 200 OK with customer list
```

### 3. Get Customer Details
```
GET /api/v1/customers/<customerId>
Headers: Authorization: Bearer <token>
Expected: 200 OK with customer details
```

### 4. Update Customer
```
PATCH /api/v1/customers/<customerId>
Headers: Authorization: Bearer <token>
Body: {
  "phone": "+1234567890",
  "notes": "Updated notes"
}
Expected: 200 OK with updated customer
```

### 5. Add Interaction
```
POST /api/v1/customers/<customerId>/interactions
Headers: Authorization: Bearer <token>
Body: {
  "type": "call",
  "duration": 15,
  "notes": "Discussed pricing",
  "outcome": "interested"
}
Expected: 201 Created with interaction added
```

---

## Lead Tests

### 1. Create Lead
```
POST /api/v1/leads
Headers: Authorization: Bearer <token>
Body: {
  "customerName": "XYZ Ltd",
  "phone": "+1234567890",
  "email": "contact@xyz.com",
  "title": "Software Development",
  "status": "new",
  "assignedTo": "<userId>"
}
Expected: 201 Created with lead data
```

### 2. List Leads
```
GET /api/v1/leads?page=1&limit=10&status=new
Headers: Authorization: Bearer <token>
Expected: 200 OK with leads list
```

### 3. Get Lead Details
```
GET /api/v1/leads/<leadId>
Headers: Authorization: Bearer <token>
Expected: 200 OK with lead details
```

### 4. Update Lead
```
PATCH /api/v1/leads/<leadId>
Headers: Authorization: Bearer <token>
Body: {
  "status": "in_progress",
  "notes": "Follow up next week"
}
Expected: 200 OK with updated lead
```

---

## Order Tests

### 1. Create Order
```
POST /api/v1/orders
Headers: Authorization: Bearer <token>
Body: {
  "customer": "<customerId>",
  "items": [
    {
      "product": "<productId>",
      "quantity": 5
    }
  ],
  "notes": "Urgent delivery needed"
}
Expected: 201 Created with order data
```

### 2. List Orders
```
GET /api/v1/orders?page=1&limit=10&status=approved
Headers: Authorization: Bearer <token>
Expected: 200 OK with orders list
```

### 3. Get Order Details
```
GET /api/v1/orders/<orderId>
Headers: Authorization: Bearer <token>
Expected: 200 OK with order details
```

### 4. Update Order Status
```
PATCH /api/v1/orders/<orderId>/status
Headers: Authorization: Bearer <managerToken>
Body: {
  "status": "fulfilled"
}
Expected: 200 OK with updated order
```

---

## Invoice Tests

### 1. Create Invoice from Order
```
POST /api/v1/invoices
Headers: Authorization: Bearer <managerToken>
Body: {
  "order": "<orderId>",
  "dueDate": "2026-06-01"
}
Expected: 201 Created with invoice data
```

### 2. List Invoices
```
GET /api/v1/invoices?page=1&limit=10&status=draft
Headers: Authorization: Bearer <token>
Expected: 200 OK with invoices list
```

### 3. Update Invoice Status
```
PATCH /api/v1/invoices/<invoiceId>/status
Headers: Authorization: Bearer <managerToken>
Body: {
  "status": "sent"
}
Expected: 200 OK with updated invoice
```

---

## Payment Tests

### 1. Record Payment
```
POST /api/v1/payments
Headers: Authorization: Bearer <token>
Body: {
  "order": "<orderId>",
  "customer": "<customerId>",
  "amount": 5000,
  "mode": "bank_transfer",
  "reference": "TXN123456",
  "notes": "Payment received"
}
Expected: 201 Created with payment record
```

### 2. List Payments
```
GET /api/v1/payments?page=1&limit=10&status=received
Headers: Authorization: Bearer <token>
Expected: 200 OK with payments list
```

---

## Product Tests

### 1. Create Product (Admin/Manager)
```
POST /api/v1/products
Headers: Authorization: Bearer <managerToken>
Body: {
  "name": "Laptop",
  "sku": "LAPTOP-001",
  "category": "Electronics",
  "description": "High performance laptop",
  "price": 50000,
  "taxRate": 18,
  "stock": 100,
  "lowStockThreshold": 10
}
Expected: 201 Created with product data
```

### 2. List Products
```
GET /api/v1/products?page=1&limit=10&category=Electronics
Headers: Authorization: Bearer <token>
Expected: 200 OK with products list
```

### 3. Adjust Stock (Admin/Manager)
```
POST /api/v1/products/<productId>/stock
Headers: Authorization: Bearer <managerToken>
Body: {
  "quantity": 50,
  "type": "purchase",
  "note": "Stock replenishment",
  "warehouse": "Main Warehouse"
}
Expected: 200 OK with updated stock
```

---

## Daily Report Tests

### 1. Submit Daily Report
```
POST /api/v1/daily-reports
Headers: Authorization: Bearer <salesToken>
Body: {
  "callsMade": 10,
  "visitsCompleted": 5,
  "tasksCompleted": 8,
  "followUpDone": 3,
  "revenueGenerated": 25000,
  "notes": "Successful day"
}
Expected: 201 Created with report data
```

### 2. List Daily Reports (Manager/Admin)
```
GET /api/v1/daily-reports?page=1&limit=10&status=submitted
Headers: Authorization: Bearer <managerToken>
Expected: 200 OK with reports list
```

### 3. Review Daily Report (Manager/Admin)
```
PATCH /api/v1/daily-reports/<reportId>/review
Headers: Authorization: Bearer <managerToken>
Body: {
  "status": "approved",
  "reviewNote": "Good performance"
}
Expected: 200 OK with reviewed report
```

---

## Target Tests

### 1. Create Target (Admin/Manager)
```
POST /api/v1/targets
Headers: Authorization: Bearer <managerToken>
Body: {
  "employee": "<employeeId>",
  "type": "sales",
  "targetValue": 100000,
  "period": "monthly",
  "startsAt": "2026-05-01"
}
Expected: 201 Created with target data
```

### 2. List Targets
```
GET /api/v1/targets?page=1&limit=10&employee=<employeeId>
Headers: Authorization: Bearer <token>
Expected: 200 OK with targets list
```

### 3. Update Target Progress
```
PATCH /api/v1/targets/<targetId>/progress
Headers: Authorization: Bearer <token>
Body: {
  "achieved": 50000,
  "notes": "Mid-month progress"
}
Expected: 200 OK with updated target
```

---

## Notification Tests

### 1. List My Notifications
```
GET /api/v1/notifications?page=1&limit=10
Headers: Authorization: Bearer <token>
Expected: 200 OK with notifications list
```

### 2. Mark Notification as Read
```
PATCH /api/v1/notifications/<notificationId>/read
Headers: Authorization: Bearer <token>
Expected: 200 OK with read notification
```

---

## Inventory Tests

### 1. Get Inventory Movements
```
GET /api/v1/inventory/movements?page=1&limit=10
Headers: Authorization: Bearer <managerToken>
Expected: 200 OK with inventory movements
```

---

## Quotation Tests

### 1. List Quotations
```
GET /api/v1/quotations?page=1&limit=10
Headers: Authorization: Bearer <token>
Expected: 200 OK with quotations list
```

### 2. Update Quotation Status
```
PATCH /api/v1/quotations/<quotationId>/status
Headers: Authorization: Bearer <managerToken>
Body: {
  "status": "approved"
}
Expected: 200 OK with updated quotation
```

---

## Visit Tests

### 1. List Visits
```
GET /api/v1/visits?page=1&limit=10
Headers: Authorization: Bearer <token>
Expected: 200 OK with visits list
```

### 2. Check-in to Visit
```
PATCH /api/v1/visits/<visitId>/check-in
Headers: Authorization: Bearer <salesToken>
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060
}
Expected: 200 OK with checked-in visit
```

---

## Reminder Tests

### 1. Update Reminder
```
PATCH /api/v1/reminders/<reminderId>
Headers: Authorization: Bearer <token>
Body: {
  "status": "completed"
}
Expected: 200 OK with updated reminder
```

---

## Document Tests

### 1. Upload Document
```
POST /api/v1/documents
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body: (Form Data with "file" and "type")
Expected: 201 Created with document metadata
```

### 2. List Documents
```
GET /api/v1/documents?page=1&limit=10
Headers: Authorization: Bearer <token>
Expected: 200 OK with documents list
```

---

## Analytics Tests

### 1. Dashboard Summary
```
GET /api/v1/analytics/dashboard
Headers: Authorization: Bearer <managerToken>
Expected: 200 OK with KPIs
Response includes:
{
  "users": { "total": X, "active": Y },
  "products": { "total": X, "lowStock": Y },
  "orders": { "total": X, "salesValue": Y },
  "leads": { "total": X },
  "payments": { "received": X },
  ...
}
```

### 2. Sales by Employee
```
GET /api/v1/analytics/sales-by-employee
Headers: Authorization: Bearer <managerToken>
Expected: 200 OK with sales report
Response includes:
[
  {
    "employee": { "name": "X", "email": "Y" },
    "totalSales": Z,
    "orderCount": N
  },
  ...
]
```

---

## Error Handling Tests

### 1. Invalid Login
```
POST /api/v1/auth/login
Body: { "email": "invalid@test.com", "password": "wrong" }
Expected: 401 Unauthorized
```

### 2. Insufficient Permissions
```
POST /api/v1/users (as salesRep)
Expected: 403 Forbidden
```

### 3. Resource Not Found
```
GET /api/v1/customers/invalid-id
Expected: 404 Not Found
```

### 4. Invalid Data
```
POST /api/v1/orders
Body: { "items": [] }
Expected: 400 Bad Request
```

### 5. Expired Token
```
GET /api/v1/users/profile/me
Headers: Authorization: Bearer <expiredToken>
Expected: 401 Unauthorized, then auto-refresh
```

---

## Real-Time Tests (Socket.io)

### 1. Location Update
- Connect as sales rep
- Emit: `sales:location:update`
- Data: `{ latitude, longitude, speed, battery }`
- Expected: Broadcast to role:owner, role:admin, role:manager

### 2. Notifications
- Create lead/assign
- Expected: Recipient gets real-time notification
- Check DevTools Network for Socket.io messages

---

## Performance Tests

### 1. List Endpoints with Pagination
- Request: GET /api/v1/orders?page=1&limit=100
- Expected: Response time <100ms
- Verify: Results limited to 100 items

### 2. Search Performance
- Request: GET /api/v1/customers?search=ABC
- Expected: Response time <100ms
- Verify: Results contain search term

### 3. Concurrent Requests
- Send 10 simultaneous requests
- Expected: All succeed with 200 OK
- Verify: No race conditions

---

## Security Tests

### 1. CORS Test
```
Request from different origin
Expected: 
- If whitelisted: Request succeeds
- If not whitelisted: CORS error
```

### 2. Rate Limit Test
```
Send 101 requests in 15 minutes
Expected: 101st request gets 429 Too Many Requests
```

### 3. XSS Prevention
```
POST with XSS payload: <script>alert('xss')</script>
Expected: Input sanitized, no alert shown
```

### 4. SQL Injection Prevention
```
POST with SQL: '; DROP TABLE users; --
Expected: Treated as normal string, no table dropped
```

---

## Final Verification Checklist

- [ ] All GET endpoints return correct data
- [ ] All POST endpoints create new records
- [ ] All PATCH endpoints update records
- [ ] All DELETE endpoints remove records
- [ ] Pagination works on all list endpoints
- [ ] Search filters work correctly
- [ ] Authorization checks work
- [ ] Error responses have correct status codes
- [ ] Error messages are descriptive
- [ ] Real-time Socket.io updates work
- [ ] Token refresh works automatically
- [ ] File uploads work
- [ ] No console errors
- [ ] API response times acceptable
- [ ] Database queries efficient

---

**All tests passing = Ready for Production ✅**
