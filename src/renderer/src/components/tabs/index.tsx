import ApiSettingsTab from './ApiSettingsTab'
import { TabProps } from './constants'
import HelpTab from './HelpTab'
import MainTab from './MainTab'
import ServerSettingsTab from './ServerSettingsTab'

interface TabContentProps {
  activeTabId: string
  tabProps: TabProps
}

const TabContent = ({ activeTabId, tabProps }: TabContentProps): React.JSX.Element | null => {
  const tabComponents: Record<string, React.JSX.Element> = {
    main: (
      <MainTab
        baseLat={tabProps.baseLat}
        baseLng={tabProps.baseLng}
        baseLatServer={tabProps.baseLatServer}
        baseLngServer={tabProps.baseLngServer}
        onBaseLatChange={tabProps.onBaseLatChange}
        onBaseLngChange={tabProps.onBaseLngChange}
        onApplyBase={tabProps.onApplyBase}
        isPickingBase={tabProps.isPickingBase}
        onTogglePickBase={tabProps.onTogglePickBase}
        isBaseEnabled={tabProps.isBaseEnabled}
        isBaseUpdating={tabProps.isBaseUpdating}
      />
    ),
    server: (
      <ServerSettingsTab
        serverHost={tabProps.serverHost}
        serverPort={tabProps.serverPort}
        onServerHostChange={tabProps.onServerHostChange}
        onServerPortChange={tabProps.onServerPortChange}
        isServerRunning={tabProps.isServerRunning}
        connectionStatus={tabProps.connectionStatus}
        onStartServer={tabProps.onStartServer}
        onStopServer={tabProps.onStopServer}
        showHeartbeatLog={tabProps.showHeartbeatLog}
        onToggleHeartbeatLog={tabProps.onToggleHeartbeatLog}
        baseMoveDuration={tabProps.baseMoveDuration}
        baseMoveDurationServer={tabProps.baseMoveDurationServer}
        onBaseMoveDurationChange={tabProps.onBaseMoveDurationChange}
        onApplyBaseMoveDuration={tabProps.onApplyBaseMoveDuration}
        isBaseMoveDurationUpdating={tabProps.isBaseMoveDurationUpdating}
        heartbeatInterval={tabProps.heartbeatInterval}
        heartbeatIntervalServer={tabProps.heartbeatIntervalServer}
        onHeartbeatIntervalChange={tabProps.onHeartbeatIntervalChange}
        onApplyHeartbeatInterval={tabProps.onApplyHeartbeatInterval}
        isHeartbeatIntervalUpdating={tabProps.isHeartbeatIntervalUpdating}
      />
    ),
    api: (
      <ApiSettingsTab
        apiKeyInput={tabProps.apiKeyInput}
        onApiKeyInputChange={tabProps.onApiKeyInputChange}
        onApplyApiKey={tabProps.onApplyApiKey}
      />
    ),
    help: <HelpTab />
  }

  return tabComponents[activeTabId] || null
}

export default TabContent
