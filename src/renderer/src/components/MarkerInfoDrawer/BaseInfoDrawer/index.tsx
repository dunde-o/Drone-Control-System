import { Home, Loader2, MapPinned, X } from 'lucide-react'

import { DEFAULT_MAP_CENTER } from '@renderer/components/App/constants'

import DrawerLayout from '../DrawerLayout'
import styles from '../styles.module.scss'
import { BaseMarkerInfo, BaseEditProps } from '../types'

interface BaseInfoDrawerProps {
  marker: BaseMarkerInfo
  onClose: () => void
  baseEditProps?: BaseEditProps
}

const BaseInfoDrawer = ({
  marker,
  onClose,
  baseEditProps
}: BaseInfoDrawerProps): React.JSX.Element => {
  return (
    <DrawerLayout
      title={marker.name}
      icon={<Home size={16} />}
      iconClassName={styles.typeIconBase}
      onClose={onClose}
    >
      {baseEditProps ? (
        <div className={styles.baseEditSection}>
          <div className={styles.coordGroup}>
            <div className={styles.coordInput}>
              <label className={styles.coordLabel}>위도 (Latitude)</label>
              <input
                type="number"
                step="any"
                value={baseEditProps.baseLatInput}
                onChange={baseEditProps.onBaseLatChange}
                placeholder={String(DEFAULT_MAP_CENTER.lat)}
                className={styles.coordInputField}
                disabled={baseEditProps.isInputDisabled}
              />
            </div>
            <div className={styles.coordInput}>
              <label className={styles.coordLabel}>경도 (Longitude)</label>
              <input
                type="number"
                step="any"
                value={baseEditProps.baseLngInput}
                onChange={baseEditProps.onBaseLngChange}
                placeholder={String(DEFAULT_MAP_CENTER.lng)}
                className={styles.coordInputField}
                disabled={baseEditProps.isInputDisabled}
              />
            </div>
          </div>
          <div className={styles.baseButtonGroup}>
            <button
              onClick={baseEditProps.onApplyBase}
              className={styles.applyButton}
              disabled={baseEditProps.isApplyDisabled}
            >
              {baseEditProps.isBaseUpdating ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  적용 중...
                </>
              ) : (
                '위치 적용'
              )}
            </button>
            <button
              onClick={baseEditProps.onTogglePickBase}
              className={`${styles.pickButton} ${baseEditProps.isPickingBase ? styles.active : ''}`}
              title={baseEditProps.isPickingBase ? '선택 취소' : '지도에서 선택'}
              disabled={baseEditProps.isInputDisabled}
            >
              {baseEditProps.isPickingBase ? <X size={18} /> : <MapPinned size={18} />}
            </button>
          </div>
          {baseEditProps.isPickingBase && (
            <p className={styles.pickingHint}>지도를 클릭하여 위치를 선택하세요</p>
          )}
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>위치</h4>
            <div className={styles.info}>
              <span className={styles.label}>위도</span>
              <span className={styles.value}>{marker.position.lat.toFixed(6)}</span>
            </div>
            <div className={styles.info}>
              <span className={styles.label}>경도</span>
              <span className={styles.value}>{marker.position.lng.toFixed(6)}</span>
            </div>
          </div>

          {marker.details && Object.keys(marker.details).length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>상세 정보</h4>
              {Object.entries(marker.details).map(([key, value]) => (
                <div key={key} className={styles.info}>
                  <span className={styles.label}>{key}</span>
                  <span className={styles.value}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DrawerLayout>
  )
}

export default BaseInfoDrawer
