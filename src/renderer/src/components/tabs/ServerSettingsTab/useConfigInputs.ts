import { useState, useEffect, ChangeEvent, useCallback } from 'react'

import {
  useUpdateBaseAltitude,
  useUpdateBaseMoveDuration,
  useUpdateDroneFlySpeed,
  useUpdateDroneUpdateInterval,
  useUpdateDroneVerticalSpeed,
  useUpdateHeartbeatInterval
} from '@renderer/hooks/mutations'
import { useServerConfig } from '@renderer/hooks/queries'

export interface ConfigInputState {
  value: string
  isUpdating: boolean
  isUnchanged: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApply: () => void
}

interface UseConfigInputsReturn {
  baseMoveDuration: ConfigInputState
  heartbeatInterval: ConfigInputState
  droneUpdateInterval: ConfigInputState
  droneVerticalSpeed: ConfigInputState
  droneFlySpeed: ConfigInputState
  baseAltitude: ConfigInputState
}

export const useConfigInputs = (): UseConfigInputsReturn => {
  const { data: serverConfig } = useServerConfig()

  const updateBaseMoveDuration = useUpdateBaseMoveDuration()
  const updateHeartbeatInterval = useUpdateHeartbeatInterval()
  const updateDroneUpdateInterval = useUpdateDroneUpdateInterval()
  const updateDroneVerticalSpeed = useUpdateDroneVerticalSpeed()
  const updateDroneFlySpeed = useUpdateDroneFlySpeed()
  const updateBaseAltitude = useUpdateBaseAltitude()

  const [baseMoveDurationInput, setBaseMoveDurationInput] = useState('')
  const [heartbeatIntervalInput, setHeartbeatIntervalInput] = useState('')
  const [droneUpdateIntervalInput, setDroneUpdateIntervalInput] = useState('')
  const [droneVerticalSpeedInput, setDroneVerticalSpeedInput] = useState('')
  const [droneFlySpeedInput, setDroneFlySpeedInput] = useState('')
  const [baseAltitudeInput, setBaseAltitudeInput] = useState('')

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

  const handleApplyBaseMoveDuration = useCallback((): void => {
    const duration = parseInt(baseMoveDurationInput, 10)
    if (isNaN(duration) || duration < 0) return
    updateBaseMoveDuration.mutate(duration)
  }, [baseMoveDurationInput, updateBaseMoveDuration])

  const handleApplyHeartbeatInterval = useCallback((): void => {
    const interval = parseInt(heartbeatIntervalInput, 10)
    if (isNaN(interval) || interval < 1000) return
    updateHeartbeatInterval.mutate(interval)
  }, [heartbeatIntervalInput, updateHeartbeatInterval])

  const handleApplyDroneUpdateInterval = useCallback((): void => {
    const interval = parseInt(droneUpdateIntervalInput, 10)
    if (isNaN(interval) || interval < 100) return
    updateDroneUpdateInterval.mutate(interval)
  }, [droneUpdateIntervalInput, updateDroneUpdateInterval])

  const handleApplyDroneVerticalSpeed = useCallback((): void => {
    const speed = parseFloat(droneVerticalSpeedInput)
    if (isNaN(speed) || speed <= 0) return
    updateDroneVerticalSpeed.mutate(speed)
  }, [droneVerticalSpeedInput, updateDroneVerticalSpeed])

  const handleApplyDroneFlySpeed = useCallback((): void => {
    const speed = parseFloat(droneFlySpeedInput)
    if (isNaN(speed) || speed <= 0) return
    updateDroneFlySpeed.mutate(speed)
  }, [droneFlySpeedInput, updateDroneFlySpeed])

  const handleApplyBaseAltitude = useCallback((): void => {
    const altitude = parseFloat(baseAltitudeInput)
    if (isNaN(altitude) || altitude <= 0) return
    updateBaseAltitude.mutate(altitude)
  }, [baseAltitudeInput, updateBaseAltitude])

  return {
    baseMoveDuration: {
      value: baseMoveDurationInput,
      isUpdating: updateBaseMoveDuration.isPending,
      isUnchanged:
        !!serverConfig && baseMoveDurationInput === String(serverConfig.baseMoveDuration),
      onChange: (e) => setBaseMoveDurationInput(e.target.value),
      onApply: handleApplyBaseMoveDuration
    },
    heartbeatInterval: {
      value: heartbeatIntervalInput,
      isUpdating: updateHeartbeatInterval.isPending,
      isUnchanged:
        !!serverConfig && heartbeatIntervalInput === String(serverConfig.heartbeatInterval),
      onChange: (e) => setHeartbeatIntervalInput(e.target.value),
      onApply: handleApplyHeartbeatInterval
    },
    droneUpdateInterval: {
      value: droneUpdateIntervalInput,
      isUpdating: updateDroneUpdateInterval.isPending,
      isUnchanged:
        !!serverConfig && droneUpdateIntervalInput === String(serverConfig.droneUpdateInterval),
      onChange: (e) => setDroneUpdateIntervalInput(e.target.value),
      onApply: handleApplyDroneUpdateInterval
    },
    droneVerticalSpeed: {
      value: droneVerticalSpeedInput,
      isUpdating: updateDroneVerticalSpeed.isPending,
      isUnchanged:
        !!serverConfig && droneVerticalSpeedInput === String(serverConfig.droneVerticalSpeed),
      onChange: (e) => setDroneVerticalSpeedInput(e.target.value),
      onApply: handleApplyDroneVerticalSpeed
    },
    droneFlySpeed: {
      value: droneFlySpeedInput,
      isUpdating: updateDroneFlySpeed.isPending,
      isUnchanged: !!serverConfig && droneFlySpeedInput === String(serverConfig.droneFlySpeed),
      onChange: (e) => setDroneFlySpeedInput(e.target.value),
      onApply: handleApplyDroneFlySpeed
    },
    baseAltitude: {
      value: baseAltitudeInput,
      isUpdating: updateBaseAltitude.isPending,
      isUnchanged: !!serverConfig && baseAltitudeInput === String(serverConfig.baseAltitude),
      onChange: (e) => setBaseAltitudeInput(e.target.value),
      onApply: handleApplyBaseAltitude
    }
  }
}
