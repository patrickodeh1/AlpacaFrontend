import { baseApi } from '@/api/baseApi';
import type {
  CancelPaperTradePayload,
  ClosePaperTradePayload,
  CreatePaperTradePayload,
  PaperTrade,
  PaperTradeStatus,
} from './types';

interface GetPaperTradesArgs {
  assetId?: number | string;
  status?: PaperTradeStatus;
  currentPrice?: number;
}

interface UpdatePaperTradePayload {
  id: number;
  stop_loss?: string | number | null;
  take_profit?: string | number | null;
}

export const paperTradingApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getPaperTrades: builder.query<PaperTrade[], GetPaperTradesArgs | void>({
      query: args => {
        const params: Record<string, string | number> = {};
        if (args?.assetId) {
          params.asset = args.assetId as number;
        }
        if (args?.status) {
          params.status = args.status;
        }
        if (args?.currentPrice !== undefined) {
          params.current_price = args.currentPrice;
        }
        return {
          url: '/paper-trading/trades/',
          method: 'GET',
          params,
        };
      },
      providesTags: result => {
        // FIX: Handle non-array responses (errors, null, undefined)
        if (!result || !Array.isArray(result)) {
          return [{ type: 'PaperTrade' as const, id: 'LIST' }];
        }
        
        return [
          ...result.map(trade => ({
            type: 'PaperTrade' as const,
            id: trade.id,
          })),
          { type: 'PaperTrade' as const, id: 'LIST' },
        ];
      },
      // Transform response to handle API wrapper format
      transformResponse: (response: any) => {
        // If response has a 'data' field (your API wrapper), extract it
        if (response && typeof response === 'object' && 'data' in response) {
          return Array.isArray(response.data) ? response.data : [];
        }
        // If it's already an array, return it
        if (Array.isArray(response)) {
          return response;
        }
        // Otherwise return empty array
        return [];
      },
      // Add error handling
      transformErrorResponse: (response: any) => {
        console.error('Paper trading API error:', response);
        return response;
      },
    }),
    createPaperTrade: builder.mutation<PaperTrade, CreatePaperTradePayload>({
      query: body => ({
        url: '/paper-trading/trades/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        // Handle API wrapper format
        return response?.data || response;
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data: newTrade } = await queryFulfilled;
          dispatch(
            paperTradingApi.util.updateQueryData(
              'getPaperTrades',
              { assetId: newTrade.asset },
              draftTrades => {
                draftTrades.push(newTrade);
              }
            )
          );
        } catch {
          // If the mutation fails, do nothing
        }
      },
      invalidatesTags: [{ type: 'PaperTrade', id: 'LIST' }],
    }),
    updatePaperTrade: builder.mutation<PaperTrade, UpdatePaperTradePayload>({
      query: ({ id, ...body }) => ({
        url: `/paper-trading/trades/${id}/`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => {
        return response?.data || response;
      },
      invalidatesTags: (_results, _error, arg) => [
        { type: 'PaperTrade', id: arg.id },
        { type: 'PaperTrade', id: 'LIST' },
      ],
    }),
    closePaperTrade: builder.mutation<PaperTrade, ClosePaperTradePayload>({
      query: ({ id, ...body }) => ({
        url: `/paper-trading/trades/${id}/close/`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response?.data || response;
      },
      invalidatesTags: (_results, _error, arg) => [
        { type: 'PaperTrade', id: arg.id },
        { type: 'PaperTrade', id: 'LIST' },
      ],
    }),
    cancelPaperTrade: builder.mutation<PaperTrade, CancelPaperTradePayload>({
      query: ({ id, ...body }) => ({
        url: `/paper-trading/trades/${id}/cancel/`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response?.data || response;
      },
      invalidatesTags: (_results, _error, arg) => [
        { type: 'PaperTrade', id: arg.id },
        { type: 'PaperTrade', id: 'LIST' },
      ],
    }),
    deletePaperTrade: builder.mutation<void, number>({
      query: id => ({
        url: `/paper-trading/trades/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_results, _error, id) => [
        { type: 'PaperTrade', id },
        { type: 'PaperTrade', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPaperTradesQuery,
  useCreatePaperTradeMutation,
  useUpdatePaperTradeMutation,
  useClosePaperTradeMutation,
  useCancelPaperTradeMutation,
  useDeletePaperTradeMutation,
} = paperTradingApi;