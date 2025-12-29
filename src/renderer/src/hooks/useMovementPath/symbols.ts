export interface PathSymbols {
  dash: google.maps.Symbol
  endCircle: google.maps.Symbol
  glow: google.maps.Symbol
}

export const createPathSymbols = (): PathSymbols | null => {
  if (typeof google === 'undefined') return null

  return {
    dash: {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeWeight: 3,
      scale: 4
    },
    endCircle: {
      path: google.maps.SymbolPath.CIRCLE,
      strokeOpacity: 1,
      fillOpacity: 1,
      scale: 6
    },
    glow: {
      path: 'M -2,0 A 2,2 0 1,1 2,0 A 2,2 0 1,1 -2,0',
      strokeOpacity: 0,
      fillOpacity: 1,
      scale: 3
    }
  }
}
