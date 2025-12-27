import { ChangeEvent } from 'react'

import styles from './styles.module.scss'

interface ServerSettingsTabProps {
  serverHost: string
  serverPort: string
  onServerHostChange: (e: ChangeEvent<HTMLInputElement>) => void
  onServerPortChange: (e: ChangeEvent<HTMLInputElement>) => void
  isServerRunning: boolean
  connectionStatus: 'disconnected' | 'connected' | 'connecting'
  onStartServer: () => void
  onStopServer: () => void
  showHeartbeatLog: boolean
  onToggleHeartbeatLog: () => void
  baseMoveDuration: string
  onBaseMoveDurationChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBaseMoveDuration: () => void
  heartbeatInterval: string
  onHeartbeatIntervalChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyHeartbeatInterval: () => void
}

const ServerSettingsTab = ({
  serverHost,
  serverPort,
  onServerHostChange,
  onServerPortChange,
  isServerRunning,
  connectionStatus,
  onStartServer,
  onStopServer,
  showHeartbeatLog,
  onToggleHeartbeatLog,
  baseMoveDuration,
  onBaseMoveDurationChange,
  onApplyBaseMoveDuration,
  heartbeatInterval,
  onHeartbeatIntervalChange,
  onApplyHeartbeatInterval
}: ServerSettingsTabProps): React.JSX.Element => {
  const isConnected = connectionStatus === 'connected'
  const getConnectionStatusText = (): string => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected'
      default:
        return 'Disconnected'
    }
  }

  const getConnectionStatusClass = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return styles.connected
      case 'connecting':
        return styles.connecting
      default:
        return styles.disconnected
    }
  }

  return (
    <div className={styles.container}>
      <h2>Server Settings</h2>

      <div className={styles.addressRow}>
        <div className={styles.hostSection}>
          <label className={styles.label}>Host</label>
          <input
            type="text"
            value={serverHost}
            onChange={onServerHostChange}
            placeholder="localhost"
            className={styles.input}
            disabled={isServerRunning}
          />
        </div>
        <div className={styles.portSection}>
          <label className={styles.label}>Port</label>
          <input
            type="text"
            value={serverPort}
            onChange={onServerPortChange}
            placeholder="8080"
            className={styles.portInput}
            disabled={isServerRunning}
            maxLength={5}
          />
        </div>
      </div>

      {isServerRunning ? (
        <button onClick={onStopServer} className={styles.disconnectButton}>
          Stop Server
        </button>
      ) : (
        <button onClick={onStartServer} className={styles.connectButton}>
          Start Server
        </button>
      )}

      <div className={styles.statusBox}>
        <h3>Server Status</h3>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={`${styles.statusValue} ${getConnectionStatusClass()}`}>
            {getConnectionStatusText()}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Heartbeat Log:</span>
          <label className={styles.switch}>
            <input type="checkbox" checked={showHeartbeatLog} onChange={onToggleHeartbeatLog} />
            <span className={styles.slider} />
          </label>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>Base 이동 시간 (ms):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={baseMoveDuration}
              onChange={onBaseMoveDurationChange}
              className={styles.durationInput}
              min="0"
              step="100"
              disabled={!isConnected}
              placeholder="-"
            />
            <button
              onClick={onApplyBaseMoveDuration}
              className={styles.applyButton}
              disabled={!isConnected || !baseMoveDuration}
            >
              적용
            </button>
          </div>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>Heartbeat 주기 (ms):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={heartbeatInterval}
              onChange={onHeartbeatIntervalChange}
              className={styles.durationInput}
              min="1000"
              step="500"
              disabled={!isConnected}
              placeholder="-"
            />
            <button
              onClick={onApplyHeartbeatInterval}
              className={styles.applyButton}
              disabled={!isConnected || !heartbeatInterval}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerSettingsTab
