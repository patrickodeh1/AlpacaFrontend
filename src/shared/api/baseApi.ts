import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { getApiBaseUrl } from '@/lib/environment';
import { getRefreshToken } from './auth';
import type { RootState } from 'src/app/store';

const API_BASE_URL = getApiBaseUrl().replace(/\/$/, '');

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.access;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
  credentials: 'include',
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/account/refresh_token/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { access?: string; refresh?: string };
        if (data.access) {
          api.dispatch({ type: 'auth/tokenRefreshed', payload: data.access });
          Cookies.set('alpaca.authjwt', data.access);
          if (data.refresh) {
            Cookies.set('refresh_token', data.refresh);
          }
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch({ type: 'auth/logout' });
          Cookies.remove('alpaca.authjwt');
          Cookies.remove('refresh_token');
        }
      } else {
        api.dispatch({ type: 'auth/logout' });
        Cookies.remove('alpaca.authjwt');
        Cookies.remove('refresh_token');
      }
    } else {
      api.dispatch({ type: 'auth/logout' });
      Cookies.remove('alpaca.authjwt');
      Cookies.remove('refresh_token');
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'AlpacaAccount',
    'Asset',
    'Assets',
    'WatchList',
    'Watchlists',
    'Candle',
    'Tick',
    'Health',
    'PaperTrade',
    'PropFirmPlan',
    'PropFirmAccount',
    'Payout',
    'SyncStatus',
    'Instrument',
    'Instruments',
    'AdminDashboard',
    'AdminAccounts',
    'AdminPlans',
    'AdminPayouts',
    'AdminUsers',
    'AdminViolations',
    'AdminWatchlists',
    'AdminAssets',
    'AdminTrades',
  ],
  endpoints: (builder) => ({
    // ============================================
    // PROP FIRM ADMIN ENDPOINTS
    // ============================================
    
    getAdminDashboard: builder.query({
      query: () => '/prop-firm/admin/dashboard/',
      providesTags: ['AdminDashboard'],
    }),
    
    // Admin Users
    getAdminUsers: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/users/',
        params,
      }),
      providesTags: ['AdminUsers'],
    }),
    
    getAdminUserDetail: builder.query({
      query: (id) => `/prop-firm/admin/users/${id}/`,
      providesTags: ['AdminUsers'],
    }),
    
    updateAdminUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/users/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    
    toggleUserAdmin: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/users/${id}/toggle_admin/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    
    toggleUserVerified: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/users/${id}/toggle_verified/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    
    // Admin Accounts
    getAdminAccounts: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/accounts/',
        params,
      }),
      providesTags: ['AdminAccounts'],
    }),
    
    getAdminAccountDetail: builder.query({
      query: (id) => `/prop-firm/admin/accounts/${id}/`,
      providesTags: ['AdminAccounts'],
    }),
    
    updateAdminAccount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/accounts/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),
    
    deleteAdminAccount: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/accounts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),
    
    activateAccount: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/accounts/${id}/activate/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),
    
    updateAccountBalance: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/accounts/${id}/update_balance/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminAccounts'],
    }),
    
    addAccountNote: builder.mutation({
      query: ({ id, note }) => ({
        url: `/prop-firm/admin/accounts/${id}/add_note/`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['AdminAccounts'],
    }),
    
    changeAccountStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/prop-firm/admin/accounts/${id}/change_status/`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),
    
    // Admin Plans
    getAdminPlans: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/plans/',
        params,
      }),
      providesTags: ['AdminPlans'],
    }),
    
    getAdminPlanDetail: builder.query({
      query: (id) => `/prop-firm/admin/plans/${id}/`,
      providesTags: ['AdminPlans'],
    }),
    
    createAdminPlan: builder.mutation({
      query: (data) => ({
        url: '/prop-firm/admin/plans/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminPlans'],
    }),
    
    updateAdminPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/plans/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminPlans'],
    }),
    
    deleteAdminPlan: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/plans/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminPlans'],
    }),
    
    togglePlanActive: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/plans/${id}/toggle_active/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminPlans'],
    }),
    
    // Admin Payouts
    getAdminPayouts: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/payouts/',
        params,
      }),
      providesTags: ['AdminPayouts'],
    }),
    
    approvePayout: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/payouts/${id}/approve/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminPayouts', 'AdminDashboard'],
    }),
    
    completePayout: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/payouts/${id}/complete/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminPayouts', 'AdminDashboard'],
    }),
    
    rejectPayout: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/prop-firm/admin/payouts/${id}/reject/`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['AdminPayouts', 'AdminDashboard'],
    }),
    
    updateAdminPayout: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/payouts/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminPayouts'],
    }),
    
    // Admin Violations
    getAdminViolations: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/violations/',
        params,
      }),
      providesTags: ['AdminViolations'],
    }),
    
    // Admin Watchlists
    getAdminWatchlists: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/watchlists/',
        params,
      }),
      providesTags: ['AdminWatchlists'],
    }),
    
    getAdminWatchlistDetail: builder.query({
      query: (id) => `/prop-firm/admin/watchlists/${id}/`,
      providesTags: ['AdminWatchlists'],
    }),
    
    updateAdminWatchlist: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/watchlists/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminWatchlists'],
    }),
    
    deleteAdminWatchlist: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/watchlists/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminWatchlists'],
    }),
    
    toggleWatchlistActive: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/watchlists/${id}/toggle_active/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminWatchlists'],
    }),
    
    // Admin Assets
    getAdminAssets: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/assets/',
        params,
      }),
      providesTags: ['AdminAssets'],
    }),
    
    getAdminAssetDetail: builder.query({
      query: (id) => `/prop-firm/admin/assets/${id}/`,
      providesTags: ['AdminAssets'],
    }),
    
    updateAdminAsset: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/assets/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminAssets'],
    }),
    
    toggleAssetTradable: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/assets/${id}/toggle_tradable/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminAssets'],
    }),
    
    // Admin Trades (NEW)
    getAdminTrades: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/trades/',
        params,
      }),
      providesTags: ['AdminTrades'],
    }),
    
    getAdminTradeDetail: builder.query({
      query: (id) => `/prop-firm/admin/trades/${id}/`,
      providesTags: ['AdminTrades'],
    }),
    
    getAdminTradeStatistics: builder.query({
      query: () => '/prop-firm/admin/trades/statistics/',
      providesTags: ['AdminTrades'],
    }),
    
    // ============================================
    // PROP FIRM USER ENDPOINTS
    // ============================================
    
    getPropFirmPlans: builder.query({
      query: () => '/prop-firm/plans/',
    }),
    
    getPropFirmAccounts: builder.query({
      query: (params) => ({
        url: '/prop-firm/accounts/',
        params,
      }),
    }),
    
    getPropFirmAccountDetail: builder.query({
      query: (id) => `/prop-firm/accounts/${id}/`,
    }),
    
    createCheckoutSession: builder.mutation({
      query: (data) => ({
        url: '/prop-firm/checkout/create_session/',
        method: 'POST',
        body: data,
      }),
    }),
    
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: '/prop-firm/checkout/verify_payment/',
        method: 'POST',
        body: data,
      }),
    }),
    
    refreshAccountBalance: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/accounts/${id}/refresh_balance/`,
        method: 'POST',
      }),
    }),
    
    getAccountStatistics: builder.query({
      query: (id) => `/prop-firm/accounts/${id}/statistics/`,
    }),
    
    requestPayout: builder.mutation({
      query: (data) => ({
        url: '/prop-firm/payouts/request_payout/',
        method: 'POST',
        body: data,
      }),
    }),
    
    getPayouts: builder.query({
      query: (params) => ({
        url: '/prop-firm/payouts/',
        params,
      }),
    }),
  }),
});

// Export hooks for all endpoints
export const {
  // Admin Dashboard
  useGetAdminDashboardQuery,
  
  // Admin Users
  useGetAdminUsersQuery,
  useGetAdminUserDetailQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useToggleUserAdminMutation,
  useToggleUserVerifiedMutation,
  
  // Admin Accounts
  useGetAdminAccountsQuery,
  useGetAdminAccountDetailQuery,
  useUpdateAdminAccountMutation,
  useDeleteAdminAccountMutation,
  useActivateAccountMutation,
  useUpdateAccountBalanceMutation,
  useAddAccountNoteMutation,
  useChangeAccountStatusMutation,
  
  // Admin Plans
  useGetAdminPlansQuery,
  useGetAdminPlanDetailQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useDeleteAdminPlanMutation,
  useTogglePlanActiveMutation,
  
  // Admin Payouts
  useGetAdminPayoutsQuery,
  useApprovePayoutMutation,
  useCompletePayoutMutation,
  useRejectPayoutMutation,
  useUpdateAdminPayoutMutation,
  
  // Admin Violations
  useGetAdminViolationsQuery,
  
  // Admin Watchlists
  useGetAdminWatchlistsQuery,
  useGetAdminWatchlistDetailQuery,
  useUpdateAdminWatchlistMutation,
  useDeleteAdminWatchlistMutation,
  useToggleWatchlistActiveMutation,
  
  // Admin Assets
  useGetAdminAssetsQuery,
  useGetAdminAssetDetailQuery,
  useUpdateAdminAssetMutation,
  useToggleAssetTradableMutation,
  
  // Admin Trades
  useGetAdminTradesQuery,
  useGetAdminTradeDetailQuery,
  useGetAdminTradeStatisticsQuery,
  
  // User prop firm hooks
  useGetPropFirmPlansQuery,
  useGetPropFirmAccountsQuery,
  useGetPropFirmAccountDetailQuery,
  useCreateCheckoutSessionMutation,
  useVerifyPaymentMutation,
  useRefreshAccountBalanceMutation,
  useGetAccountStatisticsQuery,
  useRequestPayoutMutation,
  useGetPayoutsQuery,
} = baseApi;

// Health check endpoint - separate export
export const healthApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    checkHealth: builder.query<{ status: string }, void>({
      query: () => '/account/profile/',
      providesTags: ['Health'],
    }),
  }),
});

export const { useCheckHealthQuery } = healthApi;