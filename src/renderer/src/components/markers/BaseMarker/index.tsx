import { AdvancedMarker } from '@vis.gl/react-google-maps'

import styles from './styles.module.scss'

interface BaseMarkerProps {
  position: {
    lat: number
    lng: number
  }
}

const BaseMarker = ({ position }: BaseMarkerProps): React.JSX.Element => {
  return (
    <AdvancedMarker position={position} title="Base">
      <div className={styles.marker}>B</div>
    </AdvancedMarker>
  )
}

export default BaseMarker
