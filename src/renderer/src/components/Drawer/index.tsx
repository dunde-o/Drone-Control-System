import { ReactNode } from 'react'

import TabButton from './TabButton'

import styles from './styles.module.scss'

interface Tab {
  id: string
  label: string
}

interface DrawerProps {
  isOpen: boolean
  tabs: Tab[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  children: ReactNode
}

const Drawer = ({
  isOpen,
  tabs,
  activeTabId,
  onTabClick,
  children
}: DrawerProps): React.JSX.Element => {
  return (
    <div className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.tabContainer}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={activeTabId === tab.id}
            onClick={onTabClick}
          />
        ))}
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default Drawer
