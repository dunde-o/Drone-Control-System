// Vite 환경변수에서 가져온 기본 API 키 (빌드 시 인라인됨)
export const DEFAULT_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// localStorage 키
export const API_KEY_STORAGE_KEY = 'google-maps-api-key'

// Google Cloud Console URL
export const GOOGLE_CLOUD_CONSOLE_URL = 'https://console.cloud.google.com/google/maps-apis'

// 모듈 로드 시점에 localStorage에서 API 키를 읽어옴 (React 렌더링 전)
// 이렇게 하면 첫 렌더링에서도 올바른 키를 사용할 수 있음
const getInitialApiKey = (): string => {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (stored && stored.trim() !== '') {
      return stored
    }
  } catch {
    // localStorage 접근 실패 시 기본값 사용
  }
  return DEFAULT_API_KEY
}

// 앱 시작 시 한 번만 읽어서 고정된 값으로 사용
export const INITIAL_API_KEY = getInitialApiKey()

// Server
export const DEFAULT_SERVER_HOST = import.meta.env.VITE_SERVER_HOST || 'localhost'
export const DEFAULT_SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '8080'

// 한양대학교 ERICA (안산) - 지도 기본 중심 위치
export const DEFAULT_MAP_CENTER = {
  lat: 37.2939,
  lng: 126.8349
}
