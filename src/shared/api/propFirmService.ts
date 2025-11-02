import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types/common-types';

// Types for Prop Firm
export interface PropFirmPlan {
  id: number;
  name: string;
  description: string;
  plan_type: 'EVALUATION' | 'FUNDED';
  starting_balance: string;
  price: string;
  max_daily_loss: string;
  max_total_loss: string;
  profit_target: string | null;
  min_trading_days: number;
  max_position_size: string;
  profit_split: string;
  is_active: boolean;
  created_at: string;
}

export interface PropFirmAccount {
  id: number;
  account_number: string;
  status: 'PENDING' | 'ACTIVE' | 'PASSED' | 'FAILED' | 'SUSPENDED' | 'CLOSED';
  stage: 'EVALUATION' | 'FUNDED';
  plan: number;
  plan_name: string;
  plan_details: PropFirmPlan;
  starting_balance: string;
  current_balance: string;
  high_water_mark: string;
  daily_loss: string;
  total_loss: string;
  profit_earned: string;
  trading_days: number;
  last_trade_date: string | null;
  created_at: string;
  activated_at: string | null;
  passed_at: string | null;
  failed_at: string | null;
  closed_at: string | null;
  failure_reason: string;
  violations: RuleViolation[];
  recent_activities: AccountActivity[];
  total_pnl: string;
  pnl_percentage: string;
  days_active: number;
  can_trade: boolean;
}

export interface RuleViolation {
  id: number;
  violation_type: 'DAILY_LOSS' | 'TOTAL_LOSS' | 'POSITION_SIZE' | 'MIN_DAYS';
  description: string;
  threshold_value: string;
  actual_value: string;
  related_trade: number | null;
  created_at: string;
}

export interface AccountActivity {
  id: number;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface AccountStatistics {
  total_trades: number;
  open_trades: number;
  closed_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: string;
  profit_earned: string;
  total_loss: string;
  trading_days: number;
  days_active: number;
  average_win: string;
  average_loss: string;
}

export interface CheckoutSession {
  session_id: string;
  session_url: string;
  account_id: number;
  account_number: string;
}

export interface Payout {
  id: number;
  account: number;
  account_number: string;
  amount: string;
  profit_earned: string;
  profit_split: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payment_method: string;
  payment_details: Record<string, unknown>;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
  notes: string;
}

// API Service
export const propFirmApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Plans
    getPlans: builder.query<ApiResponse<PropFirmPlan[]>, void>({
      query: () => '/prop-firm/plans/',
      providesTags: ['PropFirmPlan'],
    }),

    getPlan: builder.query<ApiResponse<PropFirmPlan>, number>({
      query: id => `/prop-firm/plans/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'PropFirmPlan', id }],
    }),

    // Accounts
    getAccounts: builder.query<
      ApiResponse<PropFirmAccount[]>,
      { status?: string } | void
    >({
      query: params => ({
        url: '/prop-firm/accounts/',
        params,
      }),
      providesTags: result =>
        result
          ? [
              ...result.data.map(account => ({
                type: 'PropFirmAccount' as const,
                id: account.id,
              })),
              { type: 'PropFirmAccount', id: 'LIST' },
            ]
          : [{ type: 'PropFirmAccount', id: 'LIST' }],
    }),

    getAccount: builder.query<ApiResponse<PropFirmAccount>, number>({
      query: id => `/prop-firm/accounts/${id}/`,
      providesTags: (_result, _error, id) => [
        { type: 'PropFirmAccount', id },
      ],
    }),

    refreshAccountBalance: builder.mutation<ApiResponse<PropFirmAccount>, number>({
      query: id => ({
        url: `/prop-firm/accounts/${id}/refresh_balance/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PropFirmAccount', id },
        { type: 'PropFirmAccount', id: 'LIST' },
      ],
    }),

    getAccountActivities: builder.query<
      ApiResponse<AccountActivity[]>,
      { accountId: number; limit?: number; offset?: number }
    >({
      query: ({ accountId, limit = 20, offset = 0 }) => ({
        url: `/prop-firm/accounts/${accountId}/activities/`,
        params: { limit, offset },
      }),
    }),

    getAccountViolations: builder.query<
      ApiResponse<RuleViolation[]>,
      number
    >({
      query: accountId => `/prop-firm/accounts/${accountId}/violations/`,
    }),

    getAccountStatistics: builder.query<
      ApiResponse<AccountStatistics>,
      number
    >({
      query: accountId => `/prop-firm/accounts/${accountId}/statistics/`,
    }),

    // Checkout
    createCheckoutSession: builder.mutation<
      ApiResponse<CheckoutSession>,
      {
        plan_id: number;
        success_url: string;
        cancel_url: string;
      }
    >({
      query: body => ({
        url: '/prop-firm/checkout/create_session/',
        method: 'POST',
        body,
      }),
    }),

    verifyPayment: builder.mutation<
      ApiResponse<PropFirmAccount>,
      {
        account_id: number;
        payment_intent_id: string;
      }
    >({
      query: body => ({
        url: '/prop-firm/checkout/verify_payment/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'PropFirmAccount', id: 'LIST' }],
    }),

    // Payouts
    getPayouts: builder.query<ApiResponse<Payout[]>, void>({
      query: () => '/prop-firm/payouts/',
      providesTags: ['Payout'],
    }),

    requestPayout: builder.mutation<
      ApiResponse<Payout>,
      {
        account_id: number;
        payment_method: string;
        payment_details?: Record<string, unknown>;
      }
    >({
      query: body => ({
        url: '/prop-firm/payouts/request_payout/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payout'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPlansQuery,
  useGetPlanQuery,
  useGetAccountsQuery,
  useGetAccountQuery,
  useRefreshAccountBalanceMutation,
  useGetAccountActivitiesQuery,
  useGetAccountViolationsQuery,
  useGetAccountStatisticsQuery,
  useCreateCheckoutSessionMutation,
  useVerifyPaymentMutation,
  useGetPayoutsQuery,
  useRequestPayoutMutation,
} = propFirmApi;