import { ChangeEvent } from 'react'

import { Loader2 } from 'lucide-react'

import styles from '../styles.module.scss'

interface ConfigInputProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApply: () => void
  isUpdating: boolean
  isUnchanged: boolean
  isConnected: boolean
  min?: string
  step?: string
  type?: 'number' | 'text'
}

const ConfigInput = ({
  label,
  value,
  onChange,
  onApply,
  isUpdating,
  isUnchanged,
  isConnected,
  min = '0',
  step = '1',
  type = 'number'
}: ConfigInputProps): React.JSX.Element => {
  const isDisabled = !isConnected || isUpdating
  const isApplyDisabled = !isConnected || !value || isUpdating || isUnchanged

  return (
    <div className={styles.durationRow}>
      <label className={styles.statusLabel}>{label}</label>
      <div className={styles.durationInputGroup}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={styles.durationInput}
          min={min}
          step={step}
          disabled={isDisabled}
          placeholder="-"
        />
        <button onClick={onApply} className={styles.applyButton} disabled={isApplyDisabled}>
          {isUpdating ? <Loader2 size={14} className={styles.spinner} /> : '적용'}
        </button>
      </div>
    </div>
  )
}

export default ConfigInput
