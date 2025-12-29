import { useHeartbeatLog, useDroneLog } from '@renderer/hooks/queries'

import ConfigInput from './ConfigInput'
import DroneCountInput from './DroneCountInput'
import { CONNECTION_STATUS_TEXT, CONNECTION_STATUS_CLASS } from './constants'
import { useServerConnection } from './useServerConnection'
import { useConfigInputs } from './useConfigInputs'

import styles from './styles.module.scss'

const ServerSettingsTab = (): React.JSX.Element => {
  const {
    serverHost,
    serverPort,
    connectionStatus,
    isServerRunning,
    isConnected,
    handleServerHostChange,
    handleServerPortChange,
    handleStartServer,
    handleStopServer
  } = useServerConnection()

  const { showHeartbeatLog, toggleHeartbeatLog } = useHeartbeatLog()
  const { showDroneLog, toggleDroneLog } = useDroneLog()

  const {
    baseMoveDuration,
    heartbeatInterval,
    droneUpdateInterval,
    droneVerticalSpeed,
    droneFlySpeed,
    baseAltitude
  } = useConfigInputs()

  const connectionStatusText = CONNECTION_STATUS_TEXT[connectionStatus]
  const connectionStatusClass = styles[CONNECTION_STATUS_CLASS[connectionStatus]]

  return (
    <div className={styles.container}>
      <h2>Server Settings</h2>

      <div className={styles.addressRow}>
        <div className={styles.hostSection}>
          <label className={styles.label}>Host</label>
          <input
            type="text"
            value={serverHost}
            onChange={handleServerHostChange}
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
            onChange={handleServerPortChange}
            placeholder="8080"
            className={styles.portInput}
            disabled={isServerRunning}
            maxLength={5}
          />
        </div>
      </div>

      {isServerRunning ? (
        <button onClick={handleStopServer} className={styles.disconnectButton}>
          Stop Server
        </button>
      ) : (
        <button onClick={handleStartServer} className={styles.connectButton}>
          Start Server
        </button>
      )}

      <div className={styles.statusBox}>
        <h3>Server Status</h3>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={`${styles.statusValue} ${connectionStatusClass}`}>
            {connectionStatusText}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Heartbeat Log:</span>
          <label className={styles.switch}>
            <input type="checkbox" checked={showHeartbeatLog} onChange={toggleHeartbeatLog} />
            <span className={styles.slider} />
          </label>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Drone Log:</span>
          <label className={styles.switch}>
            <input type="checkbox" checked={showDroneLog} onChange={toggleDroneLog} />
            <span className={styles.slider} />
          </label>
        </div>

        <ConfigInput
          label="Base 이동 시간 (ms):"
          value={baseMoveDuration.value}
          onChange={baseMoveDuration.onChange}
          onApply={baseMoveDuration.onApply}
          isUpdating={baseMoveDuration.isUpdating}
          isUnchanged={baseMoveDuration.isUnchanged}
          isConnected={isConnected}
          min="0"
          step="100"
        />

        <ConfigInput
          label="Heartbeat 주기 (ms):"
          value={heartbeatInterval.value}
          onChange={heartbeatInterval.onChange}
          onApply={heartbeatInterval.onApply}
          isUpdating={heartbeatInterval.isUpdating}
          isUnchanged={heartbeatInterval.isUnchanged}
          isConnected={isConnected}
          min="1000"
          step="500"
        />

        <DroneCountInput isConnected={isConnected} />

        <ConfigInput
          label="드론 업데이트 주기 (ms):"
          value={droneUpdateInterval.value}
          onChange={droneUpdateInterval.onChange}
          onApply={droneUpdateInterval.onApply}
          isUpdating={droneUpdateInterval.isUpdating}
          isUnchanged={droneUpdateInterval.isUnchanged}
          isConnected={isConnected}
          min="100"
          step="50"
        />

        <ConfigInput
          label="드론 수직 속도 (m/s):"
          value={droneVerticalSpeed.value}
          onChange={droneVerticalSpeed.onChange}
          onApply={droneVerticalSpeed.onApply}
          isUpdating={droneVerticalSpeed.isUpdating}
          isUnchanged={droneVerticalSpeed.isUnchanged}
          isConnected={isConnected}
          min="0.1"
          step="0.5"
        />

        <ConfigInput
          label="드론 비행 속도 (m/s):"
          value={droneFlySpeed.value}
          onChange={droneFlySpeed.onChange}
          onApply={droneFlySpeed.onApply}
          isUpdating={droneFlySpeed.isUpdating}
          isUnchanged={droneFlySpeed.isUnchanged}
          isConnected={isConnected}
          min="0.1"
          step="1"
        />

        <ConfigInput
          label="적정 비행 고도 (m):"
          value={baseAltitude.value}
          onChange={baseAltitude.onChange}
          onApply={baseAltitude.onApply}
          isUpdating={baseAltitude.isUpdating}
          isUnchanged={baseAltitude.isUnchanged}
          isConnected={isConnected}
          min="1"
          step="5"
        />
      </div>
    </div>
  )
}

export default ServerSettingsTab
