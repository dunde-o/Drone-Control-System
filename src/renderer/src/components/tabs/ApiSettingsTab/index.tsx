import { ChangeEvent, useState, useEffect } from 'react'

import { useApiKey } from '@renderer/hooks/queries'

import styles from './styles.module.scss'

const ApiSettingsTab = (): React.JSX.Element => {
  const { apiKey } = useApiKey()
  const [apiKeyInput, setApiKeyInput] = useState(apiKey)

  // apiKey가 변경되면 input 동기화 (React Query 로드 완료 시)
  useEffect(() => {
    setApiKeyInput(apiKey)
  }, [apiKey])

  const handleApiKeyInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setApiKeyInput(e.target.value)
  }

  const handleApplyApiKey = (): void => {
    // localStorage에 직접 저장 후 reload
    localStorage.setItem('google-maps-api-key', apiKeyInput)
    console.log('[ApiSettingsTab] Saved API Key:', apiKeyInput)
    console.log('[ApiSettingsTab] Verify:', localStorage.getItem('google-maps-api-key'))
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleOpenCloudConsole = (): void => {
    window.open('https://console.cloud.google.com/google/maps-apis', '_blank')
  }

  const isUnchanged = apiKeyInput === apiKey

  return (
    <div className={styles.container}>
      <h2>API 세팅</h2>

      <div className={styles.section}>
        <label className={styles.label}>Google Maps API Key</label>
        <div className={styles.inputGroup}>
          <input
            type="password"
            value={apiKeyInput}
            onChange={handleApiKeyInputChange}
            placeholder="API 키를 입력하세요"
            className={styles.input}
          />
          <button onClick={handleApplyApiKey} className={styles.button} disabled={isUnchanged}>
            적용
          </button>
        </div>
        <p className={styles.hint}>적용 시 페이지가 새로고침됩니다</p>
      </div>

      <div className={styles.usageBox}>
        <h3>API 사용량</h3>
        <p className={styles.usageNote}>
          Maps JavaScript API 사용량은 Google Cloud Console에서 확인하세요
        </p>
        <button onClick={handleOpenCloudConsole} className={styles.linkButton}>
          Google Cloud Console 열기
        </button>
      </div>
    </div>
  )
}

export default ApiSettingsTab
