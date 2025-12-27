import { useState, useEffect, useRef, ChangeEvent } from 'react'

import { APIProvider, Map } from '@vis.gl/react-google-maps'

import Drawer from '../Drawer'
import BaseMarker from '../markers/BaseMarker'
import TabContent from '../tabs'
import { TABS } from '../tabs/constants'

import { DEFAULT_API_KEY, DEFAULT_BASE_POSITION } from './constants'

const App = (): React.JSX.Element => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [apiKeyInput, setApiKeyInput] = useState(DEFAULT_API_KEY)
  const [basePosition, setBasePosition] = useState(DEFAULT_BASE_POSITION)
  const [baseLatInput, setBaseLatInput] = useState(String(DEFAULT_BASE_POSITION.lat))
  const [baseLngInput, setBaseLngInput] = useState(String(DEFAULT_BASE_POSITION.lng))
  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)

  useEffect(() => {
    activeTabRef.current = activeTab
    drawerOpenRef.current = drawerOpen
  }, [activeTab, drawerOpen])

  const handleToggleDrawerByTab = (tabId: string): (() => void) => {
    return (): void => {
      if (activeTab === tabId && drawerOpen) {
        setDrawerOpen(false)
      } else {
        setActiveTab(tabId)
        setDrawerOpen(true)
      }
    }
  }

  const handleChangeApiKeyInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setApiKeyInput(e.target.value)
  }

  const handleApplyApiKey = (): void => {
    setApiKey(apiKeyInput)
  }

  const handleChangeBaseLatInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLatInput(e.target.value)
  }

  const handleChangeBaseLngInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLngInput(e.target.value)
  }

  const handleApplyBase = (): void => {
    const lat = parseFloat(baseLatInput)
    const lng = parseFloat(baseLngInput)
    if (!isNaN(lat) && !isNaN(lng)) {
      setBasePosition({ lat, lng })
    }
  }

  useEffect(() => {
    const handleToggleDrawerByKeyboard = (e: KeyboardEvent): void => {
      if (e.key === 'Tab') {
        e.preventDefault()
        setDrawerOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleToggleDrawerByKeyboard)

    window.api.onSwitchTab((tabIndex: number) => {
      if (tabIndex <= TABS.length) {
        const targetTabId = TABS[tabIndex - 1].id
        if (drawerOpenRef.current && activeTabRef.current === targetTabId) {
          setDrawerOpen(false)
        } else {
          setActiveTab(targetTabId)
          setDrawerOpen(true)
        }
      }
    })

    return () => window.removeEventListener('keydown', handleToggleDrawerByKeyboard)
  }, [])

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={DEFAULT_BASE_POSITION}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="drone-control-map"
        clickableIcons={false}
      >
        <BaseMarker position={basePosition} />
      </Map>

      <Drawer
        isOpen={drawerOpen}
        tabs={TABS}
        activeTabId={activeTab}
        onTabClick={handleToggleDrawerByTab}
      >
        <TabContent
          activeTabId={activeTab}
          tabProps={{
            baseLat: baseLatInput,
            baseLng: baseLngInput,
            onBaseLatChange: handleChangeBaseLatInput,
            onBaseLngChange: handleChangeBaseLngInput,
            onApplyBase: handleApplyBase,
            apiKeyInput,
            onApiKeyInputChange: handleChangeApiKeyInput,
            onApplyApiKey: handleApplyApiKey
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
