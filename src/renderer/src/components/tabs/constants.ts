export interface TabConfig {
  id: string
  label: string
}

export interface MainTabProps {
  onPanToBase?: () => void
  onTakeoff?: (droneId: string, droneName: string) => void
  onLand?: (droneId: string, droneName: string) => void
  onReturnToBase?: (droneId: string) => void
  onLocateDrone?: (droneId: string) => void
  onRandomMove?: (droneId: string, lat: number, lng: number) => void
  onDirectTakeoff?: (droneId: string) => void
  onShowConfirmDialog?: (
    type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove',
    onConfirm: () => void
  ) => void
  pathVisibility?: Record<string, boolean>
  onTogglePath?: (droneId: string) => void
  onToggleAllPaths?: (show: boolean) => void
}

export const TABS: TabConfig[] = [
  { id: 'main', label: 'MAIN' },
  { id: 'server', label: 'SERVER' },
  { id: 'api', label: 'API' },
  { id: 'help', label: 'HELP' }
]
