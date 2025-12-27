import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rendererSrcPath = resolve(__dirname, 'src/renderer/src')

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': rendererSrcPath,
        '~styles': resolve(rendererSrcPath, 'styles'),
        '~components': resolve(rendererSrcPath, 'components')
      }
    },
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        } as Record<string, unknown>
      }
    }
  }
})
