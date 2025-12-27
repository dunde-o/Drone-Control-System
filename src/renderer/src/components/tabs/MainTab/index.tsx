import { ChangeEvent } from 'react'

import { MapPinned, X } from 'lucide-react'

import styles from './styles.module.scss'

interface MainTabProps {
  baseLat: string
  baseLng: string
  currentBaseLat: number
  currentBaseLng: number
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
  isPickingBase: boolean
  onTogglePickBase: () => void
}

const MainTab = ({
  baseLat,
  baseLng,
  currentBaseLat,
  currentBaseLng,
  onBaseLatChange,
  onBaseLngChange,
  onApplyBase,
  isPickingBase,
  onTogglePickBase
}: MainTabProps): React.JSX.Element => {
  const isInputChanged =
    parseFloat(baseLat) !== currentBaseLat || parseFloat(baseLng) !== currentBaseLng
  return (
    <div className={styles.container}>
      <h2>MAIN</h2>

      <div className={styles.section}>
        <h3>Base 위치 설정</h3>
        <div className={styles.coordGroup}>
          <div className={styles.coordInput}>
            <label className={styles.label}>위도 (Latitude)</label>
            <input
              type="number"
              step="any"
              value={baseLat}
              onChange={onBaseLatChange}
              placeholder="37.5665"
              className={styles.input}
            />
          </div>
          <div className={styles.coordInput}>
            <label className={styles.label}>경도 (Longitude)</label>
            <input
              type="number"
              step="any"
              value={baseLng}
              onChange={onBaseLngChange}
              placeholder="126.978"
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={onApplyBase} className={styles.button} disabled={!isInputChanged}>
            Base 위치 적용
          </button>
          <button
            onClick={onTogglePickBase}
            className={`${styles.pickButton} ${isPickingBase ? styles.active : ''}`}
            title={isPickingBase ? '선택 취소' : '지도에서 선택'}
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
