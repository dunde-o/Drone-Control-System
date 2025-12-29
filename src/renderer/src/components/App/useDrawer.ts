import { useState, useEffect, useRef, useCallback } from 'react'

import { TABS } from '@renderer/components/tabs/constants'

interface UseDrawerReturn {
  drawerOpen: boolean
  activeTab: string
  activeTabRef: React.MutableRefObject<string>
  drawerOpenRef: React.MutableRefObject<boolean>
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleToggleDrawerByTab: (tabId: string) => void
}

export const useDrawer = (): UseDrawerReturn => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('main')

  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)

  useEffect(() => {
    activeTabRef.current = activeTab
    drawerOpenRef.current = drawerOpen
  }, [activeTab, drawerOpen])

  const handleToggleDrawerByTab = useCallback(
    (tabId: string): void => {
      if (activeTab === tabId && drawerOpen) {
        setDrawerOpen(false)
      } else {
        setActiveTab(tabId)
        setDrawerOpen(true)
      }
    },
    [activeTab, drawerOpen]
  )

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

  return {
    drawerOpen,
    activeTab,
    activeTabRef,
    drawerOpenRef,
    setDrawerOpen,
    handleToggleDrawerByTab
  }
}
