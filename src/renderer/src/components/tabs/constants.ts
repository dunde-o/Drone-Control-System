import { ChangeEvent } from 'react'

export interface TabConfig {
  id: string
  label: string
}

export interface TabProps {
  // Main tab props
  baseLat: string
  baseLng: string
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
  // API settings tab props
  apiKeyInput: string
  onApiKeyInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyApiKey: () => void
}

export const TABS: TabConfig[] = [
  { id: 'main', label: 'MAIN' },
  { id: 'api', label: 'API 세팅' },
  { id: 'help', label: 'HELP' }
]
