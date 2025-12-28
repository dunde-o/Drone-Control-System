import { memo, useCallback } from 'react'

import styles from '../styles.module.scss'

interface TabButtonProps {
  id: string
  label: string
  isActive: boolean
  onClick: (tabId: string) => void
}

const TabButtonComponent = ({
  id,
  label,
  isActive,
  onClick
}: TabButtonProps): React.JSX.Element => {
  const handleClickTab = useCallback((): void => {
    onClick(id)
  }, [onClick, id])

  return (
    <button
      onClick={handleClickTab}
      className={`${styles.tabButton} ${isActive ? styles.active : styles.inactive}`}
    >
      <span className={styles.tabLabel}>{label}</span>
    </button>
  )
}

const TabButton = memo(TabButtonComponent)

TabButton.displayName = 'TabButton'

export default TabButton
