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
    'WatchList',
    'Candle',
    'Tick',
    'Health',
    'PaperTrade',
    // Prop Firm Tags
    'PropFirmPlan',
    'PropFirmAccount',
    'Payout',
    // Additional tags
    'SyncStatus',
    'Instrument',
  ],
  endpoints: () => ({}),
});

// Health check endpoint
export const healthApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    checkHealth: builder.query<{ status: string }, void>({
      query: () => '/account/profile/',
      providesTags: ['Health'],
    }),
  }),
});

export const { useCheckHealthQuery } = healthApi;
