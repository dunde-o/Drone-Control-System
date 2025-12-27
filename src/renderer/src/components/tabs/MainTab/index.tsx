import { ChangeEvent, useEffect, useRef, useState } from 'react'

import { Loader2, Locate, MapPinned, X } from 'lucide-react'

import { useUpdateBasePosition } from '@renderer/hooks/mutations'
import { useBasePosition, useConnectionStatus } from '@renderer/hooks/queries'

import styles from './styles.module.scss'

interface MainTabProps {
  isPickingBase: boolean
  onTogglePickBase: () => void
  pickingLat: string
  pickingLng: string
  onPanToBase?: () => void
}

const MainTab = ({
  isPickingBase,
  onTogglePickBase,
  pickingLat,
  pickingLng,
  onPanToBase
}: MainTabProps): React.JSX.Element => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: basePosition } = useBasePosition()
  const updateBasePosition = useUpdateBasePosition()

  const [baseLatInput, setBaseLatInput] = useState('')
  const [baseLngInput, setBaseLngInput] = useState('')

  // Track if user has modified inputs locally
  const isPickingBaseRef = useRef(isPickingBase)

  const isBaseEnabled = connectionStatus === 'connected'
  const isBaseUpdating = updateBasePosition.isPending

  // Sync inputs when server value changes (only if not picking)
  useEffect(() => {
    if (basePosition && !isPickingBaseRef.current) {
      setBaseLatInput(String(basePosition.lat))
      setBaseLngInput(String(basePosition.lng))
    }
  }, [basePosition])

  // Update inputs when picking from map
  useEffect(() => {
    isPickingBaseRef.current = isPickingBase
    if (isPickingBase && pickingLat && pickingLng) {
      setBaseLatInput(pickingLat)
      setBaseLngInput(pickingLng)
    }
  }, [isPickingBase, pickingLat, pickingLng])

  const handleBaseLatChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLatInput(e.target.value)
  }

  const handleBaseLngChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLngInput(e.target.value)
  }

  const handleApplyBase = (): void => {
    const lat = parseFloat(baseLatInput)
    const lng = parseFloat(baseLngInput)
    if (isNaN(lat) || isNaN(lng)) return

    updateBasePosition.mutate({ lat, lng })
  }

  const isInputDisabled = !isBaseEnabled || isBaseUpdating
  const isUnchanged =
    basePosition &&
    baseLatInput === String(basePosition.lat) &&
    baseLngInput === String(basePosition.lng)
  const isApplyDisabled =
    !isBaseEnabled || isBaseUpdating || !baseLatInput || !baseLngInput || !!isUnchanged

  return (
    <div className={styles.container}>
      <h2>MAIN</h2>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Base 위치 설정</h3>
          <button
            onClick={onPanToBase}
            className={styles.panButton}
            title="Base 위치로 이동"
            disabled={!isBaseEnabled || !basePosition}
          >
            <Locate size={16} />
          </button>
        </div>
        {!isBaseEnabled && (
          <p className={styles.disabledHint}>서버가 연결되어야 Base 위치를 설정할 수 있습니다</p>
        )}
        <div className={styles.coordGroup}>
          <div className={styles.coordInput}>
            <label className={styles.label}>위도 (Latitude)</label>
            <input
              type="number"
              step="any"
              value={baseLatInput}
              onChange={handleBaseLatChange}
              placeholder={isBaseEnabled ? '37.5665' : '-'}
              className={styles.input}
              disabled={isInputDisabled}
            />
          </div>
          <div className={styles.coordInput}>
            <label className={styles.label}>경도 (Longitude)</label>
            <input
              type="number"
              step="any"
              value={baseLngInput}
              onChange={handleBaseLngChange}
              placeholder={isBaseEnabled ? '126.978' : '-'}
              className={styles.input}
              disabled={isInputDisabled}
            />
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={handleApplyBase} className={styles.button} disabled={isApplyDisabled}>
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
            disabled={isInputDisabled}
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
