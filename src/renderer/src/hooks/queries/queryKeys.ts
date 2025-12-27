export const queryKeys = {
  connection: {
    all: ['connection'] as const,
    status: () => [...queryKeys.connection.all, 'status'] as const
  },

  server: {
    all: ['server'] as const,
    config: () => [...queryKeys.server.all, 'config'] as const,
    running: () => [...queryKeys.server.all, 'running'] as const
  },

  map: {
    all: ['map'] as const,
    basePosition: () => [...queryKeys.map.all, 'basePosition'] as const,
    baseMovement: () => [...queryKeys.map.all, 'baseMovement'] as const,
    selectedMarker: () => [...queryKeys.map.all, 'selectedMarker'] as const
  },

  settings: {
    all: ['settings'] as const,
    apiKey: () => [...queryKeys.settings.all, 'apiKey'] as const,
    heartbeatLog: () => [...queryKeys.settings.all, 'heartbeatLog'] as const
  }
} as const
