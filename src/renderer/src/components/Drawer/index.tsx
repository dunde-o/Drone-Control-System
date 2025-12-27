import { ReactNode } from 'react'

import styles from './styles.module.scss'

interface Tab {
  id: string
  label: string
}

interface DrawerProps {
  isOpen: boolean
  tabs: Tab[]
  activeTabId: string
  onTabClick: (tabId: string) => () => void
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
          <button
            key={tab.id}
            onClick={onTabClick(tab.id)}
            className={`${styles.tabButton} ${activeTabId === tab.id ? styles.active : styles.inactive}`}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default Drawer
