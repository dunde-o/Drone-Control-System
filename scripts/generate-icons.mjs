import sharp from 'sharp'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const buildDir = join(__dirname, '..', 'build')

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function generateIcons() {
  const svgPath = join(buildDir, 'icon.svg')
  const pngPath = join(buildDir, 'icon.png')

  console.log('Converting SVG to PNG (512x512)...')

  await sharp(svgPath).resize(512, 512).png().toFile(pngPath)

  console.log('PNG created:', pngPath)

  console.log('Generating icons with electron-icon-builder...')

  execSync(`npx electron-icon-builder --input="${pngPath}" --output="${buildDir}"`, {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  })

  console.log('Icons generated successfully!')
}

generateIcons().catch(console.error)
