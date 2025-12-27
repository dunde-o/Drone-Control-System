import { ChangeEvent } from 'react'

import styles from './styles.module.scss'

interface ApiSettingsTabProps {
  apiKeyInput: string
  onApiKeyInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyApiKey: () => void
}

const ApiSettingsTab = ({
  apiKeyInput,
  onApiKeyInputChange,
  onApplyApiKey
}: ApiSettingsTabProps): React.JSX.Element => {
  const handleOpenCloudConsole = (): void => {
    window.open('https://console.cloud.google.com/google/maps-apis', '_blank')
  }

  return (
    <div className={styles.container}>
      <h2>API 세팅</h2>

      <div className={styles.section}>
        <label className={styles.label}>Google Maps API Key</label>
        <div className={styles.inputGroup}>
          <input
            type="password"
            value={apiKeyInput}
            onChange={onApiKeyInputChange}
            placeholder="API 키를 입력하세요"
            className={styles.input}
          />
          <button onClick={onApplyApiKey} className={styles.button}>
            적용
          </button>
        </div>
        <p className={styles.hint}>API 키 변경 시 페이지 새로고침이 필요할 수 있습니다</p>
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
