import { APIProvider, Map } from '@vis.gl/react-google-maps'

import { useApiKey, useBaseMovement, useBasePosition } from '@renderer/hooks/queries'
import ConfirmDialog from '@renderer/components/ConfirmDialog'
import Drawer from '@renderer/components/Drawer'
import DroneMarkersLayer from '@renderer/components/DroneMarkersLayer'
import BaseMarker from '@renderer/components/markers/BaseMarker'
import SelectedMarkerInfo from '@renderer/components/SelectedMarkerInfo'
import TabContent from '@renderer/components/tabs'
import { TABS } from '@renderer/components/tabs/constants'

import MapController from './MapController'
import { DEFAULT_MAP_CENTER } from './constants'
import {
  CONFIRM_DIALOG_TITLE,
  CONFIRM_DIALOG_CONFIRM_TEXT,
  getConfirmDialogMessage
} from './confirmDialog'
import { useConfirmDialog } from './useConfirmDialog'
import { useDrawer } from './useDrawer'
import { useMapPicking } from './useMapPicking'
import { useMapInteraction } from './useMapInteraction'

const App = (): React.JSX.Element => {
  const { apiKey } = useApiKey()
  const { data: basePosition } = useBasePosition()
  const { data: baseMovement } = useBaseMovement()

  const { drawerOpen, activeTab, handleToggleDrawerByTab } = useDrawer()

  const {
    isPickingBase,
    pickingLat,
    pickingLng,
    handleTogglePickBase,
    handleMapClick,
    handleMapMouseMove,
    setSelectedMarkerId,
    selectedMarkerId
  } = useMapPicking()

  const {
    confirmDialog,
    handleShowDroneConfirmDialog,
    handleShowBulkConfirmDialog,
    handleTakeoffRequest,
    handleLandRequest,
    handleReturnToBase,
    handleConfirmAction,
    handleCancelConfirm
  } = useConfirmDialog()

  const {
    mapZoom,
    mapBounds,
    pathVisibility,
    panToRef,
    setSelectedDrone,
    handleBaseMarkerClick,
    handleDroneMarkerClick,
    handleCloseMarkerInfo,
    handleSetPanTo,
    handlePanToBase,
    handleLocateDrone,
    handleMapStateChange,
    handleClusterClick,
    handleTogglePath,
    handleToggleAllPaths,
    handleDroneMove
  } = useMapInteraction({ basePosition, setSelectedMarkerId })

  return (
    <APIProvider key={apiKey} apiKey={apiKey}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="drone-control-map"
        clickableIcons={false}
        onClick={handleMapClick}
        onMousemove={handleMapMouseMove}
      >
        {basePosition && (
          <BaseMarker
            position={basePosition}
            isSelected={selectedMarkerId === 'base'}
            onClick={handleBaseMarkerClick}
          />
        )}
        <DroneMarkersLayer
          mapZoom={mapZoom}
          mapBounds={mapBounds}
          selectedMarkerId={selectedMarkerId}
          pathVisibility={pathVisibility}
          panToRef={panToRef}
          onDroneMarkerClick={handleDroneMarkerClick}
          onClusterClick={handleClusterClick}
          onSelectedDroneChange={setSelectedDrone}
        />
        <MapController
          onPanToBase={handleSetPanTo}
          onDroneMove={handleDroneMove}
          onMapStateChange={handleMapStateChange}
          baseMovement={baseMovement ?? null}
        />
      </Map>

      <SelectedMarkerInfo
        selectedMarkerId={selectedMarkerId}
        onClose={handleCloseMarkerInfo}
        onShowConfirmDialog={handleShowDroneConfirmDialog}
        isPickingBase={isPickingBase}
        onTogglePickBase={handleTogglePickBase}
        pickingLat={pickingLat}
        pickingLng={pickingLng}
      />

      {confirmDialog.type && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={CONFIRM_DIALOG_TITLE[confirmDialog.type]}
          message={getConfirmDialogMessage(confirmDialog.type, confirmDialog.droneName)}
          confirmText={CONFIRM_DIALOG_CONFIRM_TEXT[confirmDialog.type]}
          cancelText="취소"
          variant={confirmDialog.type === 'land' ? 'danger' : 'primary'}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirm}
        />
      )}

      <Drawer
        isOpen={drawerOpen}
        tabs={TABS}
        activeTabId={activeTab}
        onTabClick={handleToggleDrawerByTab}
      >
        <TabContent
          activeTabId={activeTab}
          mainTabProps={{
            onPanToBase: handlePanToBase,
            onTakeoff: handleTakeoffRequest,
            onLand: handleLandRequest,
            onReturnToBase: handleReturnToBase,
            onLocateDrone: handleLocateDrone,
            onShowConfirmDialog: handleShowBulkConfirmDialog,
            pathVisibility,
            onTogglePath: handleTogglePath,
            onToggleAllPaths: handleToggleAllPaths
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
