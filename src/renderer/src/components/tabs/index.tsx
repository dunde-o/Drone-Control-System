import ApiSettingsTab from './ApiSettingsTab'
import { TabProps } from './constants'
import HelpTab from './HelpTab'
import MainTab from './MainTab'

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
        onBaseLatChange={tabProps.onBaseLatChange}
        onBaseLngChange={tabProps.onBaseLngChange}
        onApplyBase={tabProps.onApplyBase}
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
