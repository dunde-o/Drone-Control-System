import ApiSettingsTab from './ApiSettingsTab'
import { MainTabProps } from './constants'
import HelpTab from './HelpTab'
import MainTab from './MainTab'
import ServerSettingsTab from './ServerSettingsTab'

interface TabContentProps {
  activeTabId: string
  mainTabProps: MainTabProps
}

const TabContent = ({ activeTabId, mainTabProps }: TabContentProps): React.JSX.Element | null => {
  return (
    <>
      {activeTabId === 'main' && (
        <MainTab
          onPanToBase={mainTabProps.onPanToBase}
          onTakeoff={mainTabProps.onTakeoff}
          onLand={mainTabProps.onLand}
          onReturnToBase={mainTabProps.onReturnToBase}
          onLocateDrone={mainTabProps.onLocateDrone}
          onShowConfirmDialog={mainTabProps.onShowConfirmDialog}
          pathVisibility={mainTabProps.pathVisibility}
          onTogglePath={mainTabProps.onTogglePath}
          onToggleAllPaths={mainTabProps.onToggleAllPaths}
        />
      )}
      {activeTabId === 'server' && <ServerSettingsTab />}
      {activeTabId === 'api' && <ApiSettingsTab />}
      {activeTabId === 'help' && <HelpTab />}
    </>
  )
}

export default TabContent
