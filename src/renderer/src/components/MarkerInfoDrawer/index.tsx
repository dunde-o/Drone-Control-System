import BaseInfoDrawer from './BaseInfoDrawer'
import DroneInfoDrawer from './DroneInfoDrawer'
import { MarkerInfo, BaseEditProps } from './types'

export type { MarkerInfo, BaseEditProps }

interface MarkerInfoDrawerProps {
  marker: MarkerInfo | null
  onClose: () => void
  onTakeoff?: (droneId: string) => void
  onLand?: (droneId: string) => void
  onReturnToBase?: (droneId: string) => void
  baseEditProps?: BaseEditProps
}

const MarkerInfoDrawer = ({
  marker,
  onClose,
  onTakeoff,
  onLand,
  onReturnToBase,
  baseEditProps
}: MarkerInfoDrawerProps): React.JSX.Element | null => {
  return (
    <>
      {marker?.type === 'drone' && (
        <DroneInfoDrawer
          marker={marker}
          onClose={onClose}
          onTakeoff={onTakeoff}
          onLand={onLand}
          onReturnToBase={onReturnToBase}
        />
      )}
      {marker?.type === 'base' && (
        <BaseInfoDrawer marker={marker} onClose={onClose} baseEditProps={baseEditProps} />
      )}
    </>
  )
}

export default MarkerInfoDrawer
