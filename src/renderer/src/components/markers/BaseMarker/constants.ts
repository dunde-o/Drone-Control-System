import { CSSProperties } from 'react'

export const BASE_MARKER_STYLES: CSSProperties = {
  width: 64,
  height: 64,
  backgroundColor: '#4285f4',
  borderRadius: '50%',
  border: '4px solid white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: 24,
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s'
}

export const HOVER_STYLES = {
  transform: 'scale(1.1)',
  boxShadow: '0 6px 16px rgba(0,0,0,0.4)'
}

export const DEFAULT_STYLES = {
  transform: 'scale(1)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
}
