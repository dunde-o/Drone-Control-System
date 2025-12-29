import { useState, useCallback } from 'react'

import { useWebSocket } from '@renderer/contexts/WebSocketContext'

import {
  ConfirmDialogState,
  ConfirmDialogType,
  INITIAL_CONFIRM_DIALOG_STATE
} from './confirmDialog'

interface UseConfirmDialogReturn {
  confirmDialog: ConfirmDialogState
  handleShowDroneConfirmDialog: (
    type: 'takeoff' | 'land',
    droneId: string,
    droneName: string
  ) => void
  handleShowBulkConfirmDialog: (type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove') => void
  handleTakeoffRequest: (droneId: string, droneName: string) => void
  handleLandRequest: (droneId: string, droneName: string) => void
  handleReturnToBase: (droneId: string) => void
  handleConfirmAction: () => void
  handleCancelConfirm: () => void
}

export const useConfirmDialog = (): UseConfirmDialogReturn => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(
    INITIAL_CONFIRM_DIALOG_STATE
  )
  const { sendMessage } = useWebSocket()

  const handleShowDroneConfirmDialog = useCallback(
    (type: 'takeoff' | 'land', droneId: string, droneName: string): void => {
      setConfirmDialog({
        isOpen: true,
        type,
        droneId,
        droneName
      })
    },
    []
  )

  const handleShowBulkConfirmDialog = useCallback(
    (type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove'): void => {
      setConfirmDialog({
        isOpen: true,
        type,
        droneId: null,
        droneName: null
      })
    },
    []
  )

  const handleTakeoffRequest = useCallback(
    (droneId: string, droneName: string): void => {
      handleShowDroneConfirmDialog('takeoff', droneId, droneName)
    },
    [handleShowDroneConfirmDialog]
  )

  const handleLandRequest = useCallback(
    (droneId: string, droneName: string): void => {
      handleShowDroneConfirmDialog('land', droneId, droneName)
    },
    [handleShowDroneConfirmDialog]
  )

  const handleReturnToBase = useCallback(
    (droneId: string): void => {
      sendMessage({
        type: 'drone:returnToBase',
        payload: { droneId }
      })
    },
    [sendMessage]
  )

  const handleConfirmAction = useCallback((): void => {
    const { type, droneId } = confirmDialog

    const MESSAGE_TYPE_MAP: Record<ConfirmDialogType, string> = {
      takeoff: 'drone:takeoff',
      land: 'drone:land',
      allTakeoff: 'drone:allTakeoff',
      allReturnToBase: 'drone:allReturnToBase',
      allRandomMove: 'drone:allRandomMove'
    }

    if (type) {
      const messageType = MESSAGE_TYPE_MAP[type]
      if (type === 'takeoff' || type === 'land') {
        if (droneId) {
          sendMessage({ type: messageType, payload: { droneId } })
        }
      } else {
        sendMessage({ type: messageType })
      }
    }

    setConfirmDialog(INITIAL_CONFIRM_DIALOG_STATE)
  }, [confirmDialog, sendMessage])

  const handleCancelConfirm = useCallback((): void => {
    setConfirmDialog(INITIAL_CONFIRM_DIALOG_STATE)
  }, [])

  return {
    confirmDialog,
    handleShowDroneConfirmDialog,
    handleShowBulkConfirmDialog,
    handleTakeoffRequest,
    handleLandRequest,
    handleReturnToBase,
    handleConfirmAction,
    handleCancelConfirm
  }
}
