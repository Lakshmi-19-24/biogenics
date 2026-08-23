# Validation & Error Handling Guide

## Backend Validation

### Auth Validators (`src/validators/auth.validator.js`)

#### Login Validation
```javascript
{
  email: required, valid email format
  password: required, min 8 characters
}
```

#### Register Validation
```javascript
{
  name: required, string
  email: required, unique, valid email
  password: required, min 8 characters, strong password
  role: one of [owner, admin, manager, sales]
  phone: optional, valid format
}
```

### Common Validation Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid email or password` | Credentials don't match | Verify credentials, check caps lock |
| `Email already exists` | Email is registered | Use different email or login |
| `Password must be at least 8 characters` | Weak password | Use strong password (8+ chars) |
| `User account is inactive` | User disabled | Contact admin to reactivate |
| `Only admins can change user roles` | Insufficient permission | Use admin account |
| `At least one active owner is required` | Trying to deactivate last owner | Assign another owner first |

## Frontend Error Handling

### API Response Interception

```javascript
// Automatic error handling in api.js
- 401 Unauthorized: Auto-refresh token or logout
- 403 Forbidden: Redirect to 403 page
- 404 Not Found: Show not found message
- 500 Server Error: Show error notification
- Network Error: Show offline message
```

### Token Refresh Flow

```
1. API request made
2. If 401 response:
   - Check if already refreshing (prevent race condition)
   - If not, initiate refresh with refresh token
   - Wait for refresh to complete
   - Retry original request
3. If refresh fails:
   - Clear all auth data
   - Redirect to login
```

## Database Validation

### User Model Validation
```javascript
- name: required, trim
- email: required, unique, lowercase, trim
- password: required, min 8 chars, hashed before save
- role: enum [owner, admin, manager, sales], default sales
- isActive: boolean, default true
- phone: optional, trim
- manager: optional, reference to User
- branch: optional, indexed for queries
- territory: optional, indexed for queries
```

### Order Model Validation
```javascript
- customer: required reference
- items: required array, min 1 item
- subtotal: calculated from items
- taxTotal: calculated with tax rates
- grandTotal: calculated
- status: enum [draft, approved, fulfilled, cancelled]
- paymentStatus: enum [unpaid, partial, paid]
```

### Attendance Model Validation
```javascript
- employee: required reference
- date: required, ISO format (YYYY-MM-DD)
- checkInAt: required DateTime
- checkOutAt: optional DateTime
- totalMinutes: calculated (checkout - checkin - breaks)
- status: enum [present, absent, leave, halfday]
- checkInLocation: required, GeoJSON Point
- checkOutLocation: optional, GeoJSON Point
```

### LocationPing Model Validation
```javascript
- employee: required reference
- location: required GeoJSON Point [longitude, latitude]
- trackedAt: required DateTime
- source: enum [socket, manual, attendance, visit]
- accuracy: optional number (meters)
- speed: optional number (km/h)
- battery: optional number (0-100%)
```

## Error Response Format

### Standard API Error Response
```javascript
{
  success: false,
  message: "Error description",
  statusCode: 400,
  data: null,
  error: {
    code: "ERROR_CODE",
    details: "Additional details if available"
  }
}
```

### Example Errors

**400 Bad Request**
```json
{
  "message": "Order must contain at least one item",
  "statusCode": 400
}
```

**401 Unauthorized**
```json
{
  "message": "Invalid socket token",
  "statusCode": 401
}
```

**403 Forbidden**
```json
{
  "message": "Only admins can change user roles",
  "statusCode": 403
}
```

**404 Not Found**
```json
{
  "message": "User not found",
  "statusCode": 404
}
```

**409 Conflict**
```json
{
  "message": "Invoice already exists for this order",
  "statusCode": 409
}
```

## Frontend Error Handling Best Practices

### Using Toast Notifications
```javascript
import toast from 'react-hot-toast';

// Success
toast.success('Profile updated successfully');

// Error
toast.error('Failed to update profile');

// Loading
const toastId = toast.loading('Processing...');
// Later: toast.dismiss(toastId);
```

### Try-Catch Pattern
```javascript
try {
  const response = await API.post('/endpoint', data);
  toast.success('Success message');
  return response.data;
} catch (error) {
  const message = error.response?.data?.message || 'An error occurred';
  toast.error(message);
  throw error;
}
```

## Common Issues & Solutions

### Issue: "Socket auth token is required"
**Cause:** Socket.io connection attempted without token
**Solution:** Ensure token is stored in localStorage before connecting socket

### Issue: "Invalid refresh token"
**Cause:** Refresh token expired or invalid
**Solution:** 
- Clear localStorage
- Force user to login again
- Check JWT_REFRESH_EXPIRY in backend .env

### Issue: "Insufficient product stock"
**Cause:** Order quantity exceeds available stock
**Solution:**
- Check current stock levels in Products page
- Adjust order quantity or request more stock

### Issue: "Payment amount exceeds remaining order balance"
**Cause:** Trying to overpay an order
**Solution:** 
- Calculate correct remaining amount
- Order grandTotal - already paid amount = remaining
- Pay only the remaining amount

### Issue: "Cannot find route"
**Cause:** Frontend route doesn't exist
**Solution:**
- Check route definitions in App.jsx
- Verify user role has access to route
- Check ProtectedRoute component permissions

### Issue: "File upload fails silently"
**Cause:** ImageKit credentials missing or incorrect
**Solution:**
- Verify IMAGEKIT_* variables in .env
- Check file size (max 2MB)
- Check file type is allowed (images, pdf, docs)

### Issue: "Location tracking not starting"
**Cause:** Geolocation permission denied
**Solution:**
- Check browser geolocation permission
- Allow location access in browser settings
- Fallback to manual location ping button

### Issue: "Real-time notifications not appearing"
**Cause:** Socket.io connection failed
**Solution:**
- Check Socket.io in browser DevTools
- Verify backend socket configuration
- Check CORS settings in backend

## Validation Checklist Before Submission

- [ ] All users can login
- [ ] Token refreshes automatically at 15 min mark
- [ ] Profile can be updated
- [ ] Password can be changed
- [ ] Auto location tracking starts (30 min intervals)
- [ ] Manual location ping works
- [ ] Attendance check-in/out works
- [ ] Orders can be created and invoiced
- [ ] Payments can be recorded
- [ ] Real-time notifications appear
- [ ] All dashboards load correctly
- [ ] Role-based access works
- [ ] File uploads work
- [ ] No console errors
- [ ] No network errors in DevTools
- [ ] Mobile responsive layout works

## Performance Considerations

### Pagination
- Default: 10 items per page
- Max: 100 items per page
- Always use pagination for large datasets

### Search Optimization
- Indexed fields: email, name, role, isActive, branch, territory
- Search is case-insensitive
- Supports partial matches

### Query Optimization
- Use appropriate filters
- Only fetch required fields
- Use skip/limit for pagination
- Avoid N+1 queries (uses populate)

## Security Validation

✓ Passwords always hashed before storage
✓ Tokens expire and auto-refresh
✓ Rate limiting prevents brute force
✓ CORS protects against cross-site attacks
✓ Input sanitization prevents injection
✓ Role-based checks on sensitive operations
✓ File uploads validated and stored securely
✓ Sensitive fields excluded from responses
