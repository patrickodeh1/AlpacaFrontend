# Frontend Routes Documentation

## Public Routes
- `/` - Home page with landing information
- `/login` - Login/Registration page
- `/privacy` - Privacy policy page
- `/terms` - Terms of service page

## Protected Routes (Requires Authentication)
- `/profile` - User profile settings
- `/instruments` - List all trading instruments (admin only)
- `/instruments/:id` - Individual instrument details (admin only)
- `/graphs/:id` - Trading charts and graphs
- `/accounts` - User's connected accounts
- `/prop-firm` - Prop firm dashboard
- `/prop-firm/trading` - Live trading dashboard
- `/watchlists` - User's watchlists
- `/watchlists/:id` - Individual watchlist view
- `/contact` - Contact form

## Admin Only Routes
- `/admin/watchlists` - Admin watchlist management
- `/admin/watchlists/:id` - Individual admin watchlist view

## Route Protection
1. Private Routes (`PrivateRoute` component)
   - Requires valid access token
   - Redirects to `/login` if not authenticated

2. Admin Routes (`AdminRoute` component)
   - Requires valid access token AND user.is_admin=true
   - Redirects to `/login` if not authenticated
   - Redirects to `/prop-firm` if authenticated but not admin

## Navigation Behavior
- After login:
  - Admin users -> `/admin/watchlists`
  - Regular traders -> `/prop-firm`
- Root path (`/`):
  - Redirects based on auth status:
    - Admin -> `/admin/watchlists`
    - Trader -> `/prop-firm`
    - Not logged in -> Shows landing page

## Common Redirects
- Not Found (404) -> Shows `NotFoundPage` component with "Go Back" button
- Invalid/Protected URLs -> Redirects to appropriate error or login page
- Trading Dashboard Link -> `/prop-firm/trading`
- Instruments (for non-admins) -> Redirects to `/watchlists`