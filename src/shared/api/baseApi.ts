import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type { RootState } from 'src/app/store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
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
    const refreshToken = Cookies.get('refresh_token');
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
          Cookies.set('access_token', data.access);
          if (data.refresh) {
            Cookies.set('refresh_token', data.refresh);
          }
          result = await baseQuery(args, api, extraOptions);
        }
      } else {
        api.dispatch({ type: 'auth/logout' });
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      }
    } else {
      api.dispatch({ type: 'auth/logout' });
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
    'WatchList',
    'Candle',
    'Tick',
    'Health',
    'PaperTrade',
    // Prop Firm Tags
    'PropFirmPlan',
    'PropFirmAccount',
    'Payout',
  ],
  endpoints: () => ({}),
});

// Health check endpoint
export const healthApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    checkHealth: builder.query<{ status: string }, void>({
      query: () => '/core/alpaca/alpaca_status/',
      providesTags: ['Health'],
    }),
  }),
});

export const { useCheckHealthQuery } = healthApi;