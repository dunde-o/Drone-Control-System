import MarkerInfoDrawer from '@renderer/components/MarkerInfoDrawer'

import { useBaseEdit } from './useBaseEdit'
import { useDroneActions } from './useDroneActions'
import { useSelectedMarker } from './useSelectedMarker'

interface SelectedMarkerInfoProps {
  selectedMarkerId: string | null
  onClose: () => void
  onShowConfirmDialog: (type: 'takeoff' | 'land', droneId: string, droneName: string) => void
  isPickingBase: boolean
  onTogglePickBase: () => void
  pickingLat: string
  pickingLng: string
}

const SelectedMarkerInfo = ({
  selectedMarkerId,
  onClose,
  onShowConfirmDialog,
  isPickingBase,
  onTogglePickBase,
  pickingLat,
  pickingLng
}: SelectedMarkerInfoProps): React.JSX.Element | null => {
  const selectedMarker = useSelectedMarker(selectedMarkerId)

  const baseEditProps = useBaseEdit({
    isPickingBase,
    onTogglePickBase,
    pickingLat,
    pickingLng
  })

  const { handleTakeoffRequest, handleLandRequest, handleReturnToBase } = useDroneActions({
    onShowConfirmDialog
  })

  return (
    <MarkerInfoDrawer
      marker={selectedMarker}
      onClose={onClose}
      onTakeoff={handleTakeoffRequest}
      onLand={handleLandRequest}
      onReturnToBase={handleReturnToBase}
      baseEditProps={selectedMarker?.type === 'base' ? baseEditProps : undefined}
    />
  )
}

export default SelectedMarkerInfo
