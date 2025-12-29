import { Plane } from 'lucide-react'

import styles from '../styles.module.scss'

interface MarkerContentProps {
  count: number
  onClick: () => void
}

const MarkerContent = ({ count, onClick }: MarkerContentProps): React.JSX.Element => {
  const handleZoomToCluster = (): void => {
    onClick()
  }

  return (
    <div className={`${styles.wrapper} map-marker`}>
      <div className={styles.pulse} />
      <div className={styles.marker} onClick={handleZoomToCluster}>
        <div className={styles.icon}>
          <Plane size={22} strokeWidth={2.5} />
          <span className={styles.count}>{count > 99 ? '99+' : count}</span>
        </div>
      </div>
    </div>
  )
}

export default MarkerContent
