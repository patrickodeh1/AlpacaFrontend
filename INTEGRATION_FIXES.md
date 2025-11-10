# Frontend-Backend Integration Fixes

## Issues Fixed

### 1. ✅ API Path Duplication Issue
**Problem**: The `propFirmService.ts` was using `/api/prop-firm/` paths, but the `baseApi` already includes `/api` in the base URL, causing requests to go to `/api/api/prop-firm/` instead of `/api/prop-firm/`.

**Solution**: Removed the `/api/` prefix from all endpoints in `propFirmService.ts`.

**Files Modified**:
- `src/shared/api/propFirmService.ts`

**Changes**:
```typescript
// Before
query: () => '/api/prop-firm/plans/'

// After
query: () => '/prop-firm/plans/'
```

### 2. ✅ Tag Type Inconsistencies
**Problem**: RTK Query cache tags were using plural forms (`PropFirmPlans`, `PropFirmAccounts`, `Payouts`) but the baseApi defined singular forms.

**Solution**: Standardized all tags to use singular forms as defined in `baseApi.ts`.

**Files Modified**:
- `src/shared/api/propFirmService.ts`

**Changes**:
- `PropFirmPlans` → `PropFirmPlan`
- `PropFirmAccounts` → `PropFirmAccount`
- `Payouts` → `Payout`

### 3. ✅ Missing Development Environment Configuration
**Problem**: No `.env.development` file existed, causing the frontend to use default values.

**Solution**: Created `.env.development` and `.env.example` files with proper configuration.

**Files Created**:
- `.env.development` - Local development configuration
- `.env.example` - Template for environment variables

**Configuration**:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_CELERY_WORKER_COUNT=1
VITE_CELERY_BASE_URL=http://localhost:8001/
VITE_CELERY_BEAT_URL=http://localhost:8888/
VITE_CELERY_WEBSOCKET_URL=http://localhost:8889/
VITE_FORCE_ENV=development
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## Backend API Endpoints

The backend exposes the following API endpoints:

### Account Service (`/api/account/`)
- `POST /api/account/register/` - User registration
- `POST /api/account/login/` - User login
- `POST /api/account/refresh_token/` - Refresh JWT token
- `GET /api/account/profile/` - Get user profile
- `GET /api/account/users/` - List users (admin)
- `POST /api/account/change-password/` - Change password
- `POST /api/account/reset-password/` - Request password reset
- `POST /api/account/social/google/` - Google OAuth login

### Core Service (`/api/core/`)
- `GET /api/core/alpaca/` - Get Alpaca accounts
- `POST /api/core/alpaca/` - Create Alpaca account
- `GET /api/core/alpaca/alpaca_status/` - Check Alpaca status
- `POST /api/core/alpaca/sync_assets/` - Sync assets from Alpaca
- `GET /api/core/assets/` - List assets (with pagination, search, filters)
- `GET /api/core/assets/{id}/` - Get asset details
- `GET /api/core/assets/{id}/candles_v2/` - Get asset candles
- `GET /api/core/watchlists/` - List watchlists
- `POST /api/core/watchlists/` - Create watchlist
- `GET /api/core/watchlists/{id}/` - Get watchlist details
- `POST /api/core/watchlists/{id}/add_asset/` - Add asset to watchlist
- `DELETE /api/core/watchlists/{id}/remove_asset/{asset_id}/` - Remove asset from watchlist

### Prop Firm Service (`/api/prop-firm/`)
- `GET /api/prop-firm/plans/` - List prop firm plans
- `GET /api/prop-firm/plans/{id}/` - Get plan details
- `GET /api/prop-firm/accounts/` - List prop firm accounts
- `GET /api/prop-firm/accounts/{id}/` - Get account details
- `POST /api/prop-firm/accounts/{id}/refresh_balance/` - Refresh account balance
- `GET /api/prop-firm/accounts/{id}/statistics/` - Get account statistics
- `POST /api/prop-firm/checkout/create_session/` - Create Stripe checkout session
- `POST /api/prop-firm/checkout/verify_payment/` - Verify payment
- `GET /api/prop-firm/payouts/` - List payouts
- `POST /api/prop-firm/payouts/request_payout/` - Request payout
- `GET /api/prop-firm/admin/dashboard/` - Admin dashboard data

### Paper Trading Service (`/api/paper-trading/`)
- Paper trading endpoints (if implemented)

## Testing the Integration

### 1. Start the Backend
```bash
cd AlpacaBackend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

### 2. Start the Frontend
```bash
cd AlpacaFrontend
npm run dev
```

### 3. Verify API Calls
Open the browser DevTools Network tab and verify that:
- API calls go to `http://localhost:8000/api/...` (not `/api/api/...`)
- Authentication headers are properly set
- Responses are successful (200, 201, etc.)

## Common Issues and Solutions

### Issue: CORS Errors
**Solution**: Ensure `CORS_ALLOWED_ORIGINS` in backend settings includes `http://localhost:5173`

### Issue: 401 Unauthorized
**Solution**: Check that JWT tokens are being properly stored and sent in request headers

### Issue: 404 Not Found
**Solution**: Verify that the API endpoint exists in the backend and the path is correct

### Issue: Environment Variables Not Loading
**Solution**: Restart the Vite dev server after changing `.env` files

## Next Steps

1. **Add Type Safety**: Replace `any` types in `propFirmService.ts` with proper TypeScript interfaces
2. **Error Handling**: Add proper error handling for API calls
3. **Loading States**: Implement loading indicators for async operations
4. **Testing**: Add integration tests for API calls
5. **Documentation**: Document all API endpoints and their expected payloads

## Notes

- The frontend uses RTK Query for API calls and caching
- All API services extend the `baseApi` which handles authentication and token refresh
- The base URL is configured via `VITE_API_BASE_URL` environment variable
- JWT tokens are stored in cookies and automatically included in requests