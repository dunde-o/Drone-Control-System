import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { DEFAULT_API_KEY } from '@renderer/components/App/constants'
import { queryKeys } from './queryKeys'

const STORAGE_KEY = 'google-maps-api-key'

const getStoredApiKey = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ?? DEFAULT_API_KEY
}

interface UseApiKeyReturn {
  apiKey: string
  setApiKey: (newKey: string) => void
}

export const useApiKey = (): UseApiKeyReturn => {
  const queryClient = useQueryClient()

  const { data: apiKey = DEFAULT_API_KEY } = useQuery<string>({
    queryKey: queryKeys.settings.apiKey(),
    queryFn: getStoredApiKey,
    staleTime: Infinity
  })

  const setApiKey = useCallback(
    (newKey: string) => {
      localStorage.setItem(STORAGE_KEY, newKey)
      queryClient.setQueryData<string>(queryKeys.settings.apiKey(), newKey)
    },
    [queryClient]
  )

  return { apiKey, setApiKey }
}
