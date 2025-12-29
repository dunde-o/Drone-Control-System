import { X } from 'lucide-react'

import styles from '../styles.module.scss'

interface DrawerLayoutProps {
  title: string
  icon: React.ReactNode
  iconClassName: string
  headerActions?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}

const DrawerLayout = ({
  title,
  icon,
  iconClassName,
  headerActions,
  onClose,
  children
}: DrawerLayoutProps): React.JSX.Element => {
  return (
    <div className={styles.drawer}>
      <div className={styles.header}>
        <span className={`${styles.typeIcon} ${iconClassName}`}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
        {headerActions}
        <button className={styles.closeButton} onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default DrawerLayout
