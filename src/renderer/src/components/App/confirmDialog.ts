export type ConfirmDialogType =
  | 'takeoff'
  | 'land'
  | 'allTakeoff'
  | 'allReturnToBase'
  | 'allRandomMove'

export interface ConfirmDialogState {
  isOpen: boolean
  type: ConfirmDialogType | null
  droneId: string | null
  droneName: string | null
}

export const INITIAL_CONFIRM_DIALOG_STATE: ConfirmDialogState = {
  isOpen: false,
  type: null,
  droneId: null,
  droneName: null
}

export const CONFIRM_DIALOG_TITLE: Record<ConfirmDialogType, string> = {
  takeoff: '이륙 확인',
  land: '착륙 확인',
  allTakeoff: '전체 이륙 확인',
  allReturnToBase: '전체 복귀 확인',
  allRandomMove: '전체 랜덤 이동 확인'
}

export const CONFIRM_DIALOG_CONFIRM_TEXT: Record<ConfirmDialogType, string> = {
  takeoff: '이륙',
  land: '착륙',
  allTakeoff: '이륙',
  allReturnToBase: '복귀',
  allRandomMove: '이동'
}

export const getConfirmDialogMessage = (
  type: ConfirmDialogType,
  droneName: string | null
): string => {
  const messages: Record<ConfirmDialogType, string> = {
    takeoff: `${droneName}을(를) 이륙시키시겠습니까?`,
    land: `${droneName}을(를) 현재 위치에 착륙시키시겠습니까?`,
    allTakeoff: '대기 중인 모든 드론을 이륙시키시겠습니까?',
    allReturnToBase: '비행 중인 모든 드론을 베이스로 복귀시키시겠습니까?',
    allRandomMove:
      '비행 중인 모든 드론을 베이스 기준 5~10km 반경 내 랜덤 위치로 이동시키시겠습니까?'
  }
  return messages[type]
}
