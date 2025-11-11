import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
  getCurrentToken,
  getLoggedInUser,
  setCredentials,
} from './features/auth/authSlice';

import {
  checkHealth as checkWorkersHealth,
  setServiceStatus,
} from './features/health/healthSlice';
import { useCheckHealthQuery } from '@/api/baseApi';
import LoadingScreen from './shared/components/LoadingScreen';
import { initGA4 } from '@/lib/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';

// Admin pages - import directly (not lazy)
import AdminDashboard from './features/admin/index';
import AdminUsers from './features/admin/AdminUsers';
import AdminAccounts from './features/admin/AdminAccounts';
import AdminPlans from './features/admin/AdminPlans';
import AdminPayouts from './features/admin/AdminPayouts';
import AdminAssetsPage from './features/admin/AdminAssetsPage';
import AdminWatchlistsPage from './features/admin/AdminWatchlistsPage';
import AdminViolations from './features/admin/AdminViolations';
import AdminTrades from './features/admin/AdminTrades';

// Lazy load user pages
const GraphsPage = lazy(() => import('./features/graphs'));
const ContactPage = lazy(() => import('./features/contact'));
const LoginRegPage = lazy(() => import('./features/auth'));
const NotFoundPage = lazy(() => import('./features/notFound'));
const ProfilePage = lazy(() => import('./features/profile'));
const AssetsPage = lazy(() => import('./features/assets'));
const AssetDetailPage = lazy(() => import('./features/assets/AssetDetailPage'));
const WatchlistsPage = lazy(() => import('./features/watchlists'));
const PrivacyPage = lazy(() => import('./features/privacy'));
const TermsPage = lazy(() => import('./features/terms'));
const PropFirmPage = lazy(() => import('./features/propFirm'));

import { checkEnvironment, GOOGLE_CLIENT_ID } from './shared/lib/environment';
import { ThemeProvider } from './shared/components/ThemeProvider';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useGetLoggedUserQuery } from '@/api/userAuthService';
import { useAlpacaAccount } from './features/auth/hooks';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { DefaultSEO } from '@/components/DefaultSEO';
import { RouteSEO } from '@/components/RouteSEO';

// Subtle page transition loading component
const PageLoadingFallback = () => (
  <div className="fixed top-0 left-0 z-50 w-full h-1.5">
    <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer bg-[length:200%_100%]" />
  </div>
);

const HEALTH_CHECK_INTERVAL = 120000; // 2 minutes
const clientId = GOOGLE_CLIENT_ID || '';

// PrivateRoute Component
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({
  element,
}) => {
  const accessToken = useAppSelector(getCurrentToken);
  return accessToken ? element : <Navigate to="/login" />;
};

// AdminRoute Component
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const user = useAppSelector(getLoggedInUser);
  const accessToken = useAppSelector(getCurrentToken);
  if (!accessToken) return <Navigate to="/login" />;
  return user?.is_admin ? element : <Navigate to="/prop-firm" />;
};

export default function App() {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [hasInitialApiHealthCheck, setHasInitialApiHealthCheck] =
    useState(false);
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(getCurrentToken);
  const loggedInUser = useAppSelector(getLoggedInUser);
  const { refetch: getLoggedUser } = useGetLoggedUserQuery(undefined, {
    skip: !accessToken,
  });

  // Initialize Alpaca account when user is logged in
  const { isAlpacaAccountLoading } = useAlpacaAccount();

  const {
    data: healthCheckData,
    isLoading: isHealthCheckLoading,
    error: healthCheckError,
    isSuccess: isHealthCheckSuccess,
  } = useCheckHealthQuery(undefined, {
    pollingInterval: hasInitialApiHealthCheck ? HEALTH_CHECK_INTERVAL : 0,
    skip: false,
  });

  // Initialize Google Analytics
  useEffect(() => {
    initGA4();
  }, []);

  // on mount check if we have user in redux store else fetch it
  useEffect(() => {
    if (!loggedInUser && accessToken) {
      const fetchUser = async () => {
        const result = await getLoggedUser();
        if (result.data) {
          dispatch(setCredentials({ user: result.data, access: accessToken }));
        }
      };
      fetchUser();
    }
  }, [accessToken, getLoggedUser, loggedInUser, dispatch]);

  useEffect(() => {
    checkEnvironment();

    if (
      hasInitialApiHealthCheck &&
      !isLoadingComplete &&
      (!accessToken || !isAlpacaAccountLoading)
    ) {
      setIsLoadingComplete(true);
    }
  }, [
    hasInitialApiHealthCheck,
    isLoadingComplete,
    accessToken,
    isAlpacaAccountLoading,
  ]);

  // Start worker health checks only after initial API health check succeeds
  useEffect(() => {
    if (hasInitialApiHealthCheck) {
      dispatch(checkWorkersHealth());
      const intervalId = setInterval(
        () => dispatch(checkWorkersHealth()),
        HEALTH_CHECK_INTERVAL
      );
      return () => clearInterval(intervalId);
    }
  }, [dispatch, hasInitialApiHealthCheck]);

  useEffect(() => {
    if (isHealthCheckLoading) {
      dispatch(
        setServiceStatus({
          name: 'API',
          status: 'pending',
        })
      );
    } else if (healthCheckError) {
      dispatch(
        setServiceStatus({
          name: 'API',
          status: 'error',
        })
      );
      if (!hasInitialApiHealthCheck) {
        setHasInitialApiHealthCheck(true);
      }
    } else if (healthCheckData && isHealthCheckSuccess) {
      dispatch(
        setServiceStatus({
          name: 'API',
          status: 'ok',
        })
      );
      if (!hasInitialApiHealthCheck) {
        setHasInitialApiHealthCheck(true);
      }
    }
  }, [
    healthCheckData,
    isHealthCheckLoading,
    healthCheckError,
    isHealthCheckSuccess,
    dispatch,
    hasInitialApiHealthCheck,
  ]);

  if (!hasInitialApiHealthCheck) {
    return <LoadingScreen />;
  }

  return (
    <HelmetProvider>
      <BrowserRouter basename="/app">
        <DefaultSEO />
        <RouteSEO />
        <PageTracker />
        <AnnouncementBanner />
        <GoogleOAuthProvider clientId={clientId}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Root redirect */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute
                      element={
                        <Navigate to={loggedInUser?.is_admin ? '/admin' : '/prop-firm'} replace />
                      }
                    />
                  }
                />

                {/* User Routes */}
                <Route path="/profile" element={<PrivateRoute element={<ProfilePage />} />} />
                <Route path="/instruments" element={<PrivateRoute element={<AssetsPage />} />} />
                <Route path="/instruments/:id" element={<PrivateRoute element={<AssetDetailPage />} />} />
                <Route path="/graphs/:id" element={<PrivateRoute element={<GraphsPage />} />} />
                <Route path="/prop-firm" element={<PrivateRoute element={<PropFirmPage />} />} />
                <Route path="/watchlists" element={<PrivateRoute element={<WatchlistsPage />} />} />
                <Route path="/watchlists/:id" element={<PrivateRoute element={<WatchlistsPage />} />} />
                <Route path="/contact" element={<PrivateRoute element={<ContactPage />} />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
                <Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
                <Route path="/admin/accounts" element={<AdminRoute element={<AdminAccounts />} />} />
                <Route path="/admin/plans" element={<AdminRoute element={<AdminPlans />} />} />
                <Route path="/admin/payouts" element={<AdminRoute element={<AdminPayouts />} />} />
                <Route path="/admin/violations" element={<AdminRoute element={<AdminViolations />} />} />
                <Route path="/admin/assets" element={<AdminRoute element={<AdminAssetsPage />} />} />
                <Route path="/admin/watchlists" element={<AdminRoute element={<AdminWatchlistsPage />} />} />
                <Route path="/admin/trades" element={<AdminRoute element={<AdminTrades />} />} />

                {/* Public Routes */}
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/login" element={<LoginRegPage />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'glass-card',
                duration: 3000,
              }}
            />
          </ThemeProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};