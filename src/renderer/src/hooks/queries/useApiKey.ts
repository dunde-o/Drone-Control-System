import { useCallback } from 'react'

import { INITIAL_API_KEY } from '@renderer/components/App/constants'

const STORAGE_KEY = 'google-maps-api-key'

interface UseApiKeyReturn {
  apiKey: string
  setApiKey: (newKey: string) => void
}

/**
 * API 키 관리 훅
 *
 * INITIAL_API_KEY는 모듈 로드 시점에 constants.ts에서 한 번만 읽어온 값.
 * 이 훅에서는 상태를 관리하지 않고, 저장만 담당함.
 * API 키 변경 시에는 페이지 새로고침이 필요함 (Google Maps API 특성상).
 */
export const useApiKey = (): UseApiKeyReturn => {
  const setApiKey = useCallback((newKey: string) => {
    localStorage.setItem(STORAGE_KEY, newKey)
    // API 키 변경 후에는 페이지 새로고침이 필요함
    // (ApiSettingsTab에서 reload 처리)
  }, [])

  return { apiKey: INITIAL_API_KEY, setApiKey }
}
