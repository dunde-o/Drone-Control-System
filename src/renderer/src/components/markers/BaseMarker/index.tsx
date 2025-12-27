import { AdvancedMarker } from '@vis.gl/react-google-maps'

import { BASE_MARKER_STYLES, HOVER_STYLES, DEFAULT_STYLES } from './constants'

interface BaseMarkerProps {
  position: {
    lat: number
    lng: number
  }
}

const BaseMarker = ({ position }: BaseMarkerProps): React.JSX.Element => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.transform = HOVER_STYLES.transform
    e.currentTarget.style.boxShadow = HOVER_STYLES.boxShadow
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.transform = DEFAULT_STYLES.transform
    e.currentTarget.style.boxShadow = DEFAULT_STYLES.boxShadow
  }

  return (
    <AdvancedMarker position={position} title="Base">
      <div
        style={BASE_MARKER_STYLES}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        B
      </div>
    </AdvancedMarker>
  )
}

export default BaseMarker
