export interface TabConfig {
  id: string
  label: string
}

// MainTab still needs props for map picking coordination
export interface MainTabProps {
  isPickingBase: boolean
  onTogglePickBase: () => void
  pickingLat: string
  pickingLng: string
  onPanToBase?: () => void
  onTakeoff?: (droneId: string) => void
  onLand?: (droneId: string) => void
  onReturnToBase?: (droneId: string) => void
  onLocateDrone?: (droneId: string) => void
}

export const TABS: TabConfig[] = [
  { id: 'main', label: 'MAIN' },
  { id: 'server', label: 'SERVER' },
  { id: 'api', label: 'API' },
  { id: 'help', label: 'HELP' }
]
