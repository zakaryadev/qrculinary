import QRCode from 'qrcode'

/**
 * Generate a QR code as a data URL (PNG), optionally with a logo centered
 */
export async function generateQRDataURL(url: string, logoUrl?: string | null): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#1C1C1C',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: logoUrl ? 'H' : 'M',
  })

  if (!logoUrl) return canvas.toDataURL('image/png')

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const size = canvas.width * 0.22
        const x = (canvas.width - size) / 2
        const y = (canvas.height - size) / 2
        
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x - 4, y - 4, size + 8, size + 8, 8)
        else ctx.rect(x - 4, y - 4, size + 8, size + 8) // Fallback for older browsers
        ctx.fill()
        
        ctx.drawImage(img, x, y, size, size)
      }
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      resolve(canvas.toDataURL('image/png')) // Fallback if image fails
    }
    img.src = logoUrl
  })
}

/**
 * Download a QR code as a PNG file
 */
export async function downloadQRPNG(url: string, filename: string, logoUrl?: string | null): Promise<void> {
  const dataURL = await generateQRDataURL(url, logoUrl)
  const link = document.createElement('a')
  link.href = dataURL
  link.download = `${filename}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generate QR as canvas for high-quality export
 */
export async function generateQRCanvas(url: string, logoUrl?: string | null): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#1C1C1C',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: logoUrl ? 'H' : 'M',
  })

  if (!logoUrl) return canvas

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const size = canvas.width * 0.22
        const x = (canvas.width - size) / 2
        const y = (canvas.height - size) / 2
        
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x - 4, y - 4, size + 8, size + 8, 8)
        else ctx.rect(x - 4, y - 4, size + 8, size + 8)
        ctx.fill()
        
        ctx.drawImage(img, x, y, size, size)
      }
      resolve(canvas)
    }
    img.onerror = () => resolve(canvas)
    img.src = logoUrl
  })
}
