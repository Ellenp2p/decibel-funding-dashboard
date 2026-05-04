import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 4_000,
      gcTime: 5 * 60_000,
      refetchInterval: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
