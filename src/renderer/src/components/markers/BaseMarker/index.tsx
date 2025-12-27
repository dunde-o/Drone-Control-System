import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { Home } from 'lucide-react'

import styles from './styles.module.scss'

interface BaseMarkerProps {
  position: {
    lat: number
    lng: number
  }
  isSelected?: boolean
  onClick?: () => void
}

const BaseMarker = ({ position, isSelected, onClick }: BaseMarkerProps): React.JSX.Element => {
  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <AdvancedMarker position={position} title="Base">
      <div className={`${styles.wrapper} map-marker`}>
        {isSelected && <span className={styles.pulse} />}
        <div
          className={`${styles.marker} ${isSelected ? styles.selected : ''}`}
          onClick={handleClick}
        >
          <Home size={24} strokeWidth={2.5} />
        </div>
      </div>
    </AdvancedMarker>
  )
}

export default BaseMarker
