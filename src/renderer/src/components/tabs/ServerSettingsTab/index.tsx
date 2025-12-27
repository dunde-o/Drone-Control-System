import { ChangeEvent, memo, useCallback, useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import {
  useServerControl,
  useUpdateBaseAltitude,
  useUpdateBaseMoveDuration,
  useUpdateDroneCount,
  useUpdateDroneFlySpeed,
  useUpdateDroneUpdateInterval,
  useUpdateDroneVerticalSpeed,
  useUpdateHeartbeatInterval
} from '@renderer/hooks/mutations'
import {
  useConnectionStatus,
  useDroneCount,
  useDroneLog,
  useHeartbeatLog,
  useServerConfig,
  useServerRunning
} from '@renderer/hooks/queries'
import { DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT } from '@renderer/components/App/constants'

import styles from './styles.module.scss'

// 드론 수 입력 컴포넌트 (useDrones 구독을 격리)
interface DroneCountInputProps {
  isConnected: boolean
}

const DroneCountInput = memo(({ isConnected }: DroneCountInputProps): React.JSX.Element => {
  const droneCount = useDroneCount()
  const updateDroneCount = useUpdateDroneCount()
  const [droneCountInput, setDroneCountInput] = useState('')

  const isDroneCountUpdating = updateDroneCount.isPending
  const isDroneCountUnchanged = droneCountInput === String(droneCount)

  // Sync drone count input when drones change
  useEffect(() => {
    setDroneCountInput(String(droneCount))
  }, [droneCount])

  const handleDroneCountChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setDroneCountInput(e.target.value)
  }, [])

  const handleApplyDroneCount = useCallback((): void => {
    const count = parseInt(droneCountInput, 10)
    if (isNaN(count) || count < 0) return
    updateDroneCount.mutate(count)
  }, [droneCountInput, updateDroneCount])

  return (
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
          disabled={!isConnected || !droneCountInput || isDroneCountUpdating || isDroneCountUnchanged}
        >
          {isDroneCountUpdating ? <Loader2 size={14} className={styles.spinner} /> : '적용'}
        </button>
      </div>
    </div>
  )
})

DroneCountInput.displayName = 'DroneCountInput'

const ServerSettingsTab = (): React.JSX.Element => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: isServerRunning = false } = useServerRunning()
  const { data: serverConfig } = useServerConfig()
  const { showHeartbeatLog, toggleHeartbeatLog } = useHeartbeatLog()
  const { showDroneLog, toggleDroneLog } = useDroneLog()

  const { startServer, stopServer } = useServerControl()
  const updateBaseMoveDuration = useUpdateBaseMoveDuration()
  const updateHeartbeatInterval = useUpdateHeartbeatInterval()
  const updateDroneUpdateInterval = useUpdateDroneUpdateInterval()
  const updateDroneVerticalSpeed = useUpdateDroneVerticalSpeed()
  const updateDroneFlySpeed = useUpdateDroneFlySpeed()
  const updateBaseAltitude = useUpdateBaseAltitude()

  // Local input states
  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_HOST)
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_PORT)
  const [baseMoveDurationInput, setBaseMoveDurationInput] = useState('')
  const [heartbeatIntervalInput, setHeartbeatIntervalInput] = useState('')
  const [droneUpdateIntervalInput, setDroneUpdateIntervalInput] = useState('')
  const [droneVerticalSpeedInput, setDroneVerticalSpeedInput] = useState('')
  const [droneFlySpeedInput, setDroneFlySpeedInput] = useState('')
  const [baseAltitudeInput, setBaseAltitudeInput] = useState('')

  const isConnected = connectionStatus === 'connected'

  // Sync config inputs when server config changes
  useEffect(() => {
    if (serverConfig) {
      setBaseMoveDurationInput(String(serverConfig.baseMoveDuration))
      setHeartbeatIntervalInput(String(serverConfig.heartbeatInterval))
      setDroneUpdateIntervalInput(String(serverConfig.droneUpdateInterval))
      setDroneVerticalSpeedInput(String(serverConfig.droneVerticalSpeed))
      setDroneFlySpeedInput(String(serverConfig.droneFlySpeed))
      setBaseAltitudeInput(String(serverConfig.baseAltitude))
    }
  }, [serverConfig])

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

  const handleDroneUpdateIntervalChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDroneUpdateIntervalInput(e.target.value)
  }

  const handleApplyDroneUpdateInterval = (): void => {
    const interval = parseInt(droneUpdateIntervalInput, 10)
    if (isNaN(interval) || interval < 100) return
    updateDroneUpdateInterval.mutate(interval)
  }

  const handleDroneVerticalSpeedChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDroneVerticalSpeedInput(e.target.value)
  }

  const handleApplyDroneVerticalSpeed = (): void => {
    const speed = parseFloat(droneVerticalSpeedInput)
    if (isNaN(speed) || speed <= 0) return
    updateDroneVerticalSpeed.mutate(speed)
  }

  const handleDroneFlySpeedChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDroneFlySpeedInput(e.target.value)
  }

  const handleApplyDroneFlySpeed = (): void => {
    const speed = parseFloat(droneFlySpeedInput)
    if (isNaN(speed) || speed <= 0) return
    updateDroneFlySpeed.mutate(speed)
  }

  const handleBaseAltitudeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseAltitudeInput(e.target.value)
  }

  const handleApplyBaseAltitude = (): void => {
    const altitude = parseFloat(baseAltitudeInput)
    if (isNaN(altitude) || altitude <= 0) return
    updateBaseAltitude.mutate(altitude)
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
  const isDroneUpdateIntervalUpdating = updateDroneUpdateInterval.isPending
  const isDroneVerticalSpeedUpdating = updateDroneVerticalSpeed.isPending
  const isDroneFlySpeedUpdating = updateDroneFlySpeed.isPending
  const isBaseAltitudeUpdating = updateBaseAltitude.isPending

  const isBaseMoveDurationUnchanged =
    serverConfig && baseMoveDurationInput === String(serverConfig.baseMoveDuration)
  const isHeartbeatIntervalUnchanged =
    serverConfig && heartbeatIntervalInput === String(serverConfig.heartbeatInterval)
  const isDroneUpdateIntervalUnchanged =
    serverConfig && droneUpdateIntervalInput === String(serverConfig.droneUpdateInterval)
  const isDroneVerticalSpeedUnchanged =
    serverConfig && droneVerticalSpeedInput === String(serverConfig.droneVerticalSpeed)
  const isDroneFlySpeedUnchanged =
    serverConfig && droneFlySpeedInput === String(serverConfig.droneFlySpeed)
  const isBaseAltitudeUnchanged =
    serverConfig && baseAltitudeInput === String(serverConfig.baseAltitude)

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
        <DroneCountInput isConnected={isConnected} />
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
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>드론 수직 속도 (m/s):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={droneVerticalSpeedInput}
              onChange={handleDroneVerticalSpeedChange}
              className={styles.durationInput}
              min="0.1"
              step="0.5"
              disabled={!isConnected || isDroneVerticalSpeedUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyDroneVerticalSpeed}
              className={styles.applyButton}
              disabled={
                !isConnected ||
                !droneVerticalSpeedInput ||
                isDroneVerticalSpeedUpdating ||
                !!isDroneVerticalSpeedUnchanged
              }
            >
              {isDroneVerticalSpeedUpdating ? (
                <Loader2 size={14} className={styles.spinner} />
              ) : (
                '적용'
              )}
            </button>
          </div>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>드론 비행 속도 (m/s):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={droneFlySpeedInput}
              onChange={handleDroneFlySpeedChange}
              className={styles.durationInput}
              min="0.1"
              step="1"
              disabled={!isConnected || isDroneFlySpeedUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyDroneFlySpeed}
              className={styles.applyButton}
              disabled={
                !isConnected ||
                !droneFlySpeedInput ||
                isDroneFlySpeedUpdating ||
                !!isDroneFlySpeedUnchanged
              }
            >
              {isDroneFlySpeedUpdating ? <Loader2 size={14} className={styles.spinner} /> : '적용'}
            </button>
          </div>
        </div>
        <div className={styles.durationRow}>
          <label className={styles.statusLabel}>적정 비행 고도 (m):</label>
          <div className={styles.durationInputGroup}>
            <input
              type="number"
              value={baseAltitudeInput}
              onChange={handleBaseAltitudeChange}
              className={styles.durationInput}
              min="1"
              step="5"
              disabled={!isConnected || isBaseAltitudeUpdating}
              placeholder="-"
            />
            <button
              onClick={handleApplyBaseAltitude}
              className={styles.applyButton}
              disabled={
                !isConnected ||
                !baseAltitudeInput ||
                isBaseAltitudeUpdating ||
                !!isBaseAltitudeUnchanged
              }
            >
              {isBaseAltitudeUpdating ? <Loader2 size={14} className={styles.spinner} /> : '적용'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerSettingsTab
