import styles from './styles.module.scss'

const HelpTab = (): React.JSX.Element => {
  return (
    <div className={styles.container}>
      <h2>HELP</h2>

      <h3>단축키</h3>
      <div className={styles.shortcutList}>
        <div className={styles.shortcutRow}>
          <span>사이드바 열기/닫기</span>
          <code className={styles.shortcutKey}>Tab</code>
        </div>
        <div className={styles.shortcutRow}>
          <span>MAIN 탭</span>
          <code className={styles.shortcutKey}>Ctrl + 1</code>
        </div>
        <div className={styles.shortcutRow}>
          <span>API 세팅 탭</span>
          <code className={styles.shortcutKey}>Ctrl + 2</code>
        </div>
        <div className={styles.shortcutRow}>
          <span>HELP 탭</span>
          <code className={styles.shortcutKey}>Ctrl + 3</code>
        </div>
      </div>
    </div>
  )
}

export default HelpTab
