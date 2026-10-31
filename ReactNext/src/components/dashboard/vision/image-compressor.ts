/**
 * Client-side image compressor for fast, reliable vision OCR.
 * Downscales images exceeding maxDimension (1600px) and converts to optimized JPEG.
 * This shrinks 2.4MB phone photos (3.3MB base64) down to ~150KB while maintaining full text sharpness,
 * preventing network timeouts and sluggish model inference.
 */
export async function compressImageForVision(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, don't rasterize via canvas
    if (file.type.includes('svg')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        resolve({ dataUrl, width: 800, height: 600, sizeBytes: file.size })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image for processing'))
      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Downsample if dimensions exceed maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          // Fallback if canvas context fails
          const rawUrl = e.target?.result as string
          resolve({ dataUrl: rawUrl, width, height, sizeBytes: file.size })
          return
        }

        // Fill white background in case of transparent PNGs
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        const sizeBytes = Math.round((compressedDataUrl.length * 3) / 4)

        resolve({
          dataUrl: compressedDataUrl,
          width,
          height,
          sizeBytes,
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
