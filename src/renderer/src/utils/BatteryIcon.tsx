import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning } from 'lucide-react'

import { BATTERY_LEVEL } from './battery'

export const getBatteryIcon = (battery: number, size: number = 14): React.JSX.Element => {
  if (battery < BATTERY_LEVEL.CRITICAL) return <BatteryWarning size={size} />
  if (battery < BATTERY_LEVEL.LOW) return <BatteryLow size={size} />
  if (battery < BATTERY_LEVEL.MEDIUM) return <BatteryMedium size={size} />
  return <BatteryFull size={size} />
}
