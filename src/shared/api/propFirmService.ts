// api/propFirmService.ts
import { baseApi } from './baseApi';

interface AdminDashboardData {
  users_count: number;
  accounts_count: number;
  plans_count: number;
  payouts_count: number;
  active_accounts: number;
  total_balance: string;
  recent_accounts: Array<{
    id: number;
    account_number: string;
    user_email: string;
    status: string;
    current_balance: string;
    created_at: string;
  }>;
  recent_violations: Array<{
    id: number;
    account_number: string;
    violation_type: string;
    description: string;
    created_at: string;
  }>;
  revenue_stats: {
    total_revenue: number;
    monthly_revenue: number;
    pending_payouts: number;
  };
}

interface ApiResponse<T> {
  msg?: string;
  data: T;
  count?: number;
}

export const propFirmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // User Endpoints
    getPropFirmPlans: builder.query<any, void>({
      query: () => '/prop-firm/plans/',
      providesTags: ['PropFirmPlan'],
    }),

    getPropFirmPlan: builder.query<any, number>({
      query: (id) => `/prop-firm/plans/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'PropFirmPlan', id }],
    }),

    getPropFirmAccounts: builder.query<any, { status?: string } | undefined>({
      query: (params) => ({
        url: '/prop-firm/accounts/',
        params: params || {},
      }),
      providesTags: ['PropFirmAccount'],
    }),

    getPropFirmAccount: builder.query<any, number>({
      query: (id) => `/prop-firm/accounts/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'PropFirmAccount', id }],
    }),

    refreshAccountBalance: builder.mutation<any, number>({
      query: (id) => ({
        url: `/prop-firm/accounts/${id}/refresh_balance/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PropFirmAccount', id },
        'PropFirmAccount',
      ],
    }),

    getAccountStatistics: builder.query<any, number>({
      query: (id) => `/prop-firm/accounts/${id}/statistics/`,
    }),

    createCheckoutSession: builder.mutation<any, {
      plan_id: number;
      success_url: string;
      cancel_url: string;
    }>({
      query: (data) => ({
        url: '/prop-firm/checkout/create_session/',
        method: 'POST',
        body: data,
      }),
    }),

    verifyPayment: builder.mutation<any, {
      account_id: number;
      payment_intent_id: string;
    }>({
      query: (data) => ({
        url: '/prop-firm/checkout/verify_payment/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PropFirmAccount'],
    }),

    getPayouts: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/payouts/',
        params: params || {},
      }),
      providesTags: ['Payout'],
    }),

    requestPayout: builder.mutation<any, {
      account_id: number;
      payment_method: string;
      payment_details?: any;
    }>({
      query: (data) => ({
        url: '/prop-firm/payouts/request_payout/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payout', 'PropFirmAccount'],
    }),

    // Admin Endpoints
    getAdminDashboard: builder.query<ApiResponse<AdminDashboardData>, void>({
      query: () => '/prop-firm/admin/dashboard/',
      providesTags: ['AdminDashboard'],
    }),
    
    getAdminAccounts: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/accounts/',
        params: params || {},
      }),
      providesTags: ['AdminAccounts'],
    }),
    
    getAdminAccountDetail: builder.query<any, number | string>({
      query: (id) => `/prop-firm/admin/accounts/${id}/`,
      providesTags: ['AdminAccounts'],
    }),
    
    updateAdminAccount: builder.mutation<any, { id: number | string; [key: string]: any }>({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/accounts/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),
    
    activateAccount: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/accounts/${id}/activate/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),
    
    updateAccountBalance: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/accounts/${id}/update_balance/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminAccounts'],
    }),
    
    addAccountNote: builder.mutation<any, { id: number | string; note: string }>({
      query: ({ id, note }) => ({
        url: `/prop-firm/admin/accounts/${id}/add_note/`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['AdminAccounts'],
    }),
    
    getAdminViolations: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/violations/',
        params: params || {},
      }),
      providesTags: ['AdminViolations'],
    }),
    
    getAdminPlans: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/plans/',
        params: params || {},
      }),
      providesTags: ['AdminPlans'],
    }),
    
    createAdminPlan: builder.mutation<any, { [key: string]: any }>({
      query: (data) => ({
        url: '/prop-firm/admin/plans/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminPlans'],
    }),
    
    updateAdminPlan: builder.mutation<any, { id: number | string; [key: string]: any }>({
      query: ({ id, ...data }) => ({
        url: `/prop-firm/admin/plans/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AdminPlans'],
    }),
    
    getAdminPayouts: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/payouts/',
        params: params || {},
      }),
      providesTags: ['AdminPayouts'],
    }),
    
    approvePayout: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/payouts/${id}/approve/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminPayouts', 'AdminDashboard'],
    }),
    
    completePayout: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/payouts/${id}/complete/`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminPayouts', 'AdminDashboard'],
    }),
    
    getAdminUsers: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/users/',
        params: params || {},
      }),
      providesTags: ['AdminUsers'],
    }),
    
    getAdminAssets: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/assets/',
        params: params || {},
      }),
    }),
    
    getAdminWatchlists: builder.query<any, { [key: string]: any } | undefined>({
      query: (params) => ({
        url: '/prop-firm/admin/watchlists/',
        params: params || {},
      }),
    }),

    // Admin Delete Endpoints
    deleteAdminUser: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    deleteAdminAccount: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/accounts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminAccounts', 'AdminDashboard'],
    }),

    deleteAdminPlan: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/prop-firm/admin/plans/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminPlans'],
    }),
  }),
});

export const {
  useGetPropFirmPlansQuery,
  useGetPropFirmPlanQuery,
  useGetPropFirmAccountsQuery,
  useGetPropFirmAccountQuery,
  useRefreshAccountBalanceMutation,
  useGetAccountStatisticsQuery,
  useCreateCheckoutSessionMutation,
  useVerifyPaymentMutation,
  useGetPayoutsQuery,
  useRequestPayoutMutation,
  useGetAdminDashboardQuery,
  useGetAdminAccountsQuery,
  useGetAdminAccountDetailQuery,
  useUpdateAdminAccountMutation,
  useActivateAccountMutation,
  useUpdateAccountBalanceMutation,
  useAddAccountNoteMutation,
  useGetAdminViolationsQuery,
  useGetAdminPlansQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useGetAdminPayoutsQuery,
  useApprovePayoutMutation,
  useCompletePayoutMutation,
  useGetAdminUsersQuery,
  useGetAdminAssetsQuery,
  useGetAdminWatchlistsQuery,
  useDeleteAdminUserMutation,
  useDeleteAdminAccountMutation,
  useDeleteAdminPlanMutation,
} = propFirmApi;