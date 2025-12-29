// 배터리 레벨 임계값
export const BATTERY_LEVEL = {
  CRITICAL: 20, // 위험 (아이콘: BatteryWarning)
  LOW: 40, // 낮음 (아이콘: BatteryLow, 색상: danger)
  MEDIUM: 70 // 보통 (아이콘: BatteryMedium, 색상: warning)
  // 70 이상: 양호 (아이콘: BatteryFull, 색상: good)
} as const

export const getBatteryColorClass = (battery: number): string => {
  if (battery < BATTERY_LEVEL.LOW) return 'batteryDanger'
  if (battery < BATTERY_LEVEL.MEDIUM) return 'batteryWarning'
  return 'batteryGood'
}
