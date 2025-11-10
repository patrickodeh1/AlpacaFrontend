import { baseApi } from './baseApi';

export const paperTradingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaperTrades: builder.query<any, { account_id?: number }>({
      query: (params) => ({
        url: '/paper-trading/trades/',
        params,
      }),
      providesTags: ['PaperTrade'],
    }),

    createPaperTrade: builder.mutation<any, {
      account_id: number;
      symbol: string;
      side: 'buy' | 'sell';
      quantity: number;
      order_type: 'market' | 'limit' | 'stop' | 'stop_limit';
      limit_price?: number;
      stop_price?: number;
    }>({
      query: (data) => ({
        url: '/paper-trading/trades/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaperTrade'],
    }),
  }),
});

export const {
  useGetPaperTradesQuery,
  useCreatePaperTradeMutation,
} = paperTradingApi;