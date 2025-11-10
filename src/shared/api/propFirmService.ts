// api/propFirmService.ts
import { baseApi } from './baseApi';

export const propFirmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Plans
    getPropFirmPlans: builder.query<any, void>({
      query: () => '/prop-firm/plans/',
      providesTags: ['PropFirmPlan'],
    }),

    getPropFirmPlan: builder.query<any, number>({
      query: (id) => `/prop-firm/plans/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'PropFirmPlan', id }],
    }),

    // Accounts
    getPropFirmAccounts: builder.query<any, { status?: string }>({
      query: (params) => ({
        url: '/prop-firm/accounts/',
        params,
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

    // Checkout
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

    // Payouts
    getPayouts: builder.query<any, void>({
      query: () => '/prop-firm/payouts/',
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

    // Admin
    getAdminDashboard: builder.query<any, void>({
      query: () => '/prop-firm/admin/dashboard/',
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
} = propFirmApi;