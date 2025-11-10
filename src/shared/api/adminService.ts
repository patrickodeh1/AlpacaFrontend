import { baseApi } from './baseApi';

// Define types for Admin data
export interface AdminAsset {
  id: number;
  alpaca_id: string;
  symbol: string;
  name: string;
  asset_class: string;
  exchange: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
  created_at: string;
  updated_at: string;
  watchlists_count: number;
  trades_count: number;
}

export interface AdminWatchlist {
  id: number;
  user: number;
  user_email: string;
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  assets_count: number;
}

// Pagination response type
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Admin Assets (with pagination)
    getAdminAssets: builder.query<
      PaginatedResponse<AdminAsset>,
      { page?: number; page_size?: number }
    >({
      query: ({ page = 1, page_size = 20 }) => ({
        url: `/prop-firm/admin/assets/?page=${page}&page_size=${page_size}`,
        method: 'GET',
        headers: { 'Content-type': 'application/json' },
      }),
      providesTags: ['Asset'], // ✅ match existing tagTypes
    }),

    // Admin Watchlists (with pagination)
    getAdminWatchlists: builder.query<
      PaginatedResponse<AdminWatchlist>,
      { page?: number; page_size?: number }
    >({
      query: ({ page = 1, page_size = 20 }) => ({
        url: `/prop-firm/admin/watchlists/?page=${page}&page_size=${page_size}`,
        method: 'GET',
        headers: { 'Content-type': 'application/json' },
      }),
      providesTags: ['WatchList'], // ✅ match existing tagTypes
    }),
  }),
});

export const {
  useGetAdminAssetsQuery,
  useGetAdminWatchlistsQuery,
} = adminApi;
