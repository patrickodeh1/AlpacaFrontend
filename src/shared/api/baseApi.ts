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
      // Try to refresh the token
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
          // Update the token in Redux and cookies
          api.dispatch({ type: 'auth/tokenRefreshed', payload: data.access });
          Cookies.set('alpaca.authjwt', data.access);
          if (data.refresh) {
            Cookies.set('refresh_token', data.refresh);
          }
          // Retry the original request with the new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, log out
          api.dispatch({ type: 'auth/logout' });
          Cookies.remove('alpaca.authjwt');
          Cookies.remove('refresh_token');
        }
      } else {
        // Refresh request failed, log out
        api.dispatch({ type: 'auth/logout' });
        Cookies.remove('alpaca.authjwt');
        Cookies.remove('refresh_token');
      }
    } else {
      // No refresh token available, log out
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
  ],
  endpoints: (builder) => ({
    // ============================================
    // PROP FIRM ADMIN ENDPOINTS
    // ============================================
    
    getAdminDashboard: builder.query({
      query: () => '/prop-firm/admin/dashboard/',
      providesTags: ['AdminDashboard'],
    }),
    
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
    
    getAdminViolations: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/violations/',
        params,
      }),
      providesTags: ['AdminViolations'],
    }),
    
    getAdminPlans: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/plans/',
        params,
      }),
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
    
    getAdminUsers: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/users/',
        params,
      }),
      providesTags: ['AdminUsers'],
    }),
    
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/prop-firm/admin/users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    
    getAdminAssets: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/assets/',
        params,
      }),
    }),
    
    getAdminWatchlists: builder.query({
      query: (params) => ({
        url: '/prop-firm/admin/watchlists/',
        params,
      }),
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
  // Admin hooks
  useGetAdminDashboardQuery,
  useGetAdminAccountsQuery,
  useGetAdminAccountDetailQuery,
  useUpdateAdminAccountMutation,
  useDeleteAdminAccountMutation,
  useActivateAccountMutation,
  useUpdateAccountBalanceMutation,
  useAddAccountNoteMutation,
  useGetAdminViolationsQuery,
  useGetAdminPlansQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useDeleteAdminPlanMutation,
  useGetAdminPayoutsQuery,
  useApprovePayoutMutation,
  useCompletePayoutMutation,
  useGetAdminUsersQuery,
  useDeleteAdminUserMutation,
  useGetAdminAssetsQuery,
  useGetAdminWatchlistsQuery,
  
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