import { ChangeEvent, useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import {
  useServerControl,
  useUpdateBaseMoveDuration,
  useUpdateDroneCount,
  useUpdateDroneUpdateInterval,
  useUpdateHeartbeatInterval
} from '@renderer/hooks/mutations'
import {
  useConnectionStatus,
  useDroneLog,
  useDrones,
  useHeartbeatLog,
  useServerConfig,
  useServerRunning
} from '@renderer/hooks/queries'
import { DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT } from '@renderer/components/App/constants'

import styles from './styles.module.scss'

const ServerSettingsTab = (): React.JSX.Element => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: isServerRunning = false } = useServerRunning()
  const { data: serverConfig } = useServerConfig()
  const { data: drones = [] } = useDrones()
  const { showHeartbeatLog, toggleHeartbeatLog } = useHeartbeatLog()
  const { showDroneLog, toggleDroneLog } = useDroneLog()

  const { startServer, stopServer } = useServerControl()
  const updateBaseMoveDuration = useUpdateBaseMoveDuration()
  const updateHeartbeatInterval = useUpdateHeartbeatInterval()
  const updateDroneCount = useUpdateDroneCount()
  const updateDroneUpdateInterval = useUpdateDroneUpdateInterval()

  // Local input states
  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_HOST)
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_PORT)
  const [baseMoveDurationInput, setBaseMoveDurationInput] = useState('')
  const [heartbeatIntervalInput, setHeartbeatIntervalInput] = useState('')
  const [droneCountInput, setDroneCountInput] = useState('')
  const [droneUpdateIntervalInput, setDroneUpdateIntervalInput] = useState('')

  const isConnected = connectionStatus === 'connected'

  // Sync config inputs when server config changes
  useEffect(() => {
    if (serverConfig) {
      setBaseMoveDurationInput(String(serverConfig.baseMoveDuration))
      setHeartbeatIntervalInput(String(serverConfig.heartbeatInterval))
      setDroneUpdateIntervalInput(String(serverConfig.droneUpdateInterval))
    }
  }, [serverConfig])

  // Sync drone count input when drones change
  useEffect(() => {
    setDroneCountInput(String(drones.length))
  }, [drones.length])

  const handleServerHostChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerHost(e.target.value)
  }

  const handleServerPortChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerPort(e.target.value)
  }

  const handleStartServer = (): void => {
    startServer.mutate({ host: serverHost, port: serverPort })
  }

  const handleStopServer = (): void => {
    stopServer.mutate()
  }

  const handleBaseMoveDurationChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseMoveDurationInput(e.target.value)
  }

  const handleApplyBaseMoveDuration = (): void => {
    const duration = parseInt(baseMoveDurationInput, 10)
    if (isNaN(duration) || duration < 0) return
    updateBaseMoveDuration.mutate(duration)
  }

  const handleHeartbeatIntervalChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setHeartbeatIntervalInput(e.target.value)
  }

  const handleApplyHeartbeatInterval = (): void => {
    const interval = parseInt(heartbeatIntervalInput, 10)
    if (isNaN(interval) || interval < 1000) return
    updateHeartbeatInterval.mutate(interval)
  }

  const handleDroneCountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDroneCountInput(e.target.value)
  }

  const handleApplyDroneCount = (): void => {
    const count = parseInt(droneCountInput, 10)
    if (isNaN(count) || count < 0) return
    updateDroneCount.mutate(count)
  }

  const handleDroneUpdateIntervalChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDroneUpdateIntervalInput(e.target.value)
  }

  const handleApplyDroneUpdateInterval = (): void => {
    const interval = parseInt(droneUpdateIntervalInput, 10)
    if (isNaN(interval) || interval < 100) return
    updateDroneUpdateInterval.mutate(interval)
  }

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

  const isBaseMoveDurationUpdating = updateBaseMoveDuration.isPending
  const isHeartbeatIntervalUpdating = updateHeartbeatInterval.isPending
  const isDroneCountUpdating = updateDroneCount.isPending
  const isDroneUpdateIntervalUpdating = updateDroneUpdateInterval.isPending

  const isBaseMoveDurationUnchanged =
    serverConfig && baseMoveDurationInput === String(serverConfig.baseMoveDuration)
  const isHeartbeatIntervalUnchanged =
    serverConfig && heartbeatIntervalInput === String(serverConfig.heartbeatInterval)
  const isDroneCountUnchanged = droneCountInput === String(drones.length)
  const isDroneUpdateIntervalUnchanged =
    serverConfig && droneUpdateIntervalInput === String(serverConfig.droneUpdateInterval)

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
          <span className={`${styles.statusValue} ${getConnectionStatusClass()}`}>
            {getConnectionStatusText()}
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
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>Base 이동 시간 (ms):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={baseMoveDurationInput}
              onChange={handleBaseMoveDurationChange}
              className={styles.durationInput}
              min="0"
              step="100"
              disabled={!isConnected || isBaseMoveDurationUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyBaseMoveDuration}
              className={styles.applyButton}
              disabled={
                !isConnected ||
                !baseMoveDurationInput ||
                isBaseMoveDurationUpdating ||
                !!isBaseMoveDurationUnchanged
              }
            >
              {isBaseMoveDurationUpdating ? (
                <Loader2 size={14} className={styles.spinner} />
              ) : (
                '적용'
              )}
            </button>
          </div>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>Heartbeat 주기 (ms):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={heartbeatIntervalInput}
              onChange={handleHeartbeatIntervalChange}
              className={styles.durationInput}
              min="1000"
              step="500"
              disabled={!isConnected || isHeartbeatIntervalUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyHeartbeatInterval}
              className={styles.applyButton}
              disabled={
                !isConnected ||
                !heartbeatIntervalInput ||
                isHeartbeatIntervalUpdating ||
                !!isHeartbeatIntervalUnchanged
              }
            >
              {isHeartbeatIntervalUpdating ? (
                <Loader2 size={14} className={styles.spinner} />
              ) : (
                '적용'
              )}
            </button>
          </div>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>드론 수:</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={droneCountInput}
              onChange={handleDroneCountChange}
              className={styles.durationInput}
              min="0"
              step="1"
              disabled={!isConnected || isDroneCountUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyDroneCount}
              className={styles.applyButton}
              disabled={
                !isConnected || !droneCountInput || isDroneCountUpdating || isDroneCountUnchanged
              }
            >
              {isDroneCountUpdating ? <Loader2 size={14} className={styles.spinner} /> : '적용'}
            </button>
          </div>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>드론 업데이트 주기 (ms):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={droneUpdateIntervalInput}
              onChange={handleDroneUpdateIntervalChange}
              className={styles.durationInput}
              min="100"
              step="50"
              disabled={!isConnected || isDroneUpdateIntervalUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyDroneUpdateInterval}
              className={styles.applyButton}
              disabled={
                !isConnected ||
                !droneUpdateIntervalInput ||
                isDroneUpdateIntervalUpdating ||
                !!isDroneUpdateIntervalUnchanged
              }
            >
              {isDroneUpdateIntervalUpdating ? (
                <Loader2 size={14} className={styles.spinner} />
              ) : (
                '적용'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerSettingsTab
