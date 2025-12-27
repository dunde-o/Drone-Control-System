import { ChangeEvent } from 'react'

import { Loader2, MapPinned, X } from 'lucide-react'

import styles from './styles.module.scss'

interface MainTabProps {
  baseLat: string
  baseLng: string
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
  isPickingBase: boolean
  onTogglePickBase: () => void
  isBaseEnabled: boolean
  isBaseUpdating: boolean
}

const MainTab = ({
  baseLat,
  baseLng,
  onBaseLatChange,
  onBaseLngChange,
  onApplyBase,
  isPickingBase,
  onTogglePickBase,
  isBaseEnabled,
  isBaseUpdating
}: MainTabProps): React.JSX.Element => {
  const isDisabled = !isBaseEnabled || isBaseUpdating

  return (
    <div className={styles.container}>
      <h2>MAIN</h2>

      <div className={styles.section}>
        <h3>Base 위치 설정</h3>
        {!isBaseEnabled && (
          <p className={styles.disabledHint}>서버가 연결되어야 Base 위치를 설정할 수 있습니다</p>
        )}
        <div className={styles.coordGroup}>
          <div className={styles.coordInput}>
            <label className={styles.label}>위도 (Latitude)</label>
            <input
              type="number"
              step="any"
              value={baseLat}
              onChange={onBaseLatChange}
              placeholder={isBaseEnabled ? '37.5665' : '-'}
              className={styles.input}
              disabled={isDisabled}
            />
          </div>
          <div className={styles.coordInput}>
            <label className={styles.label}>경도 (Longitude)</label>
            <input
              type="number"
              step="any"
              value={baseLng}
              onChange={onBaseLngChange}
              placeholder={isBaseEnabled ? '126.978' : '-'}
              className={styles.input}
              disabled={isDisabled}
            />
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={onApplyBase} className={styles.button} disabled={isDisabled}>
            {isBaseUpdating ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                적용 중...
              </>
            ) : (
              'Base 위치 적용'
            )}
          </button>
          <button
            onClick={onTogglePickBase}
            className={`${styles.pickButton} ${isPickingBase ? styles.active : ''}`}
            title={isPickingBase ? '선택 취소' : '지도에서 선택'}
            disabled={isDisabled}
          >
            {isPickingBase ? <X size={20} /> : <MapPinned size={20} />}
          </button>
        </div>
        <p className={styles.hint}>
          {isPickingBase
            ? '지도를 클릭하여 Base 위치를 선택하세요'
            : '드론의 이착륙 기지 위치를 설정합니다'}
        </p>
      </div>
    </div>
  )
}

export default MainTab
