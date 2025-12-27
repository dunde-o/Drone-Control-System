import { ChangeEvent } from 'react'

import styles from './styles.module.scss'

interface ServerSettingsTabProps {
  serverHost: string
  serverPort: string
  onServerHostChange: (e: ChangeEvent<HTMLInputElement>) => void
  onServerPortChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyServer: () => void
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
}

const ServerSettingsTab = ({
  serverHost,
  serverPort,
  onServerHostChange,
  onServerPortChange,
  onApplyServer,
  isConnected,
  onConnect,
  onDisconnect
}: ServerSettingsTabProps): React.JSX.Element => {
  return (
    <div className={styles.container}>
      <h2>Server Settings</h2>

      <div className={styles.section}>
        <label className={styles.label}>Host</label>
        <input
          type="text"
          value={serverHost}
          onChange={onServerHostChange}
          placeholder="localhost"
          className={styles.input}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Port</label>
        <input
          type="text"
          value={serverPort}
          onChange={onServerPortChange}
          placeholder="8080"
          className={styles.input}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={onApplyServer} className={styles.button}>
          Apply
        </button>
        {isConnected ? (
          <button onClick={onDisconnect} className={styles.disconnectButton}>
            Disconnect
          </button>
        ) : (
          <button onClick={onConnect} className={styles.connectButton}>
            Connect
          </button>
        )}
      </div>

      <div className={styles.statusBox}>
        <h3>Connection Status</h3>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={`${styles.statusValue} ${isConnected ? styles.connected : styles.disconnected}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Server:</span>
          <span className={styles.statusValue}>
            {serverHost}:{serverPort}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ServerSettingsTab
