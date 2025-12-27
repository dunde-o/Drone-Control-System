import { ChangeEvent } from 'react'

import styles from './styles.module.scss'

interface MainTabProps {
  baseLat: string
  baseLng: string
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
}

const MainTab = ({
  baseLat,
  baseLng,
  onBaseLatChange,
  onBaseLngChange,
  onApplyBase
}: MainTabProps): React.JSX.Element => {
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
        <button onClick={onApplyBase} className={styles.button}>
          Base 위치 적용
        </button>
        <p className={styles.hint}>드론의 이착륙 기지 위치를 설정합니다</p>
      </div>
    </div>
  )
}

export default MainTab
