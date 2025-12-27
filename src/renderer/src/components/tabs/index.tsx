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
  const tabComponents: Record<string, React.JSX.Element> = {
    main: (
      <MainTab
        isPickingBase={mainTabProps.isPickingBase}
        onTogglePickBase={mainTabProps.onTogglePickBase}
        pickingLat={mainTabProps.pickingLat}
        pickingLng={mainTabProps.pickingLng}
      />
    ),
    server: <ServerSettingsTab />,
    api: <ApiSettingsTab />,
    help: <HelpTab />
  }

  return tabComponents[activeTabId] || null
}

export default TabContent
