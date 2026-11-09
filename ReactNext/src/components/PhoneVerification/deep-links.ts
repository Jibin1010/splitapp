/**
 * Deep Linking & Desktop App Launcher for Telegram and WhatsApp
 *
 * Facilitates direct launching of native desktop applications on Mac (macOS),
 * Windows (PC), and Linux, as well as native mobile apps on Android and iOS (iPhone).
 * Provides graceful fallback to browser endpoints (https://t.me/ or https://wa.me/)
 * when the native app is not installed.
 */

export interface DeviceDetection {
  isAndroid: boolean
  isIOS: boolean
  isMobile: boolean
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  isDesktop: boolean
  osName: 'Mac' | 'Windows' | 'Linux' | 'Android' | 'iPhone' | 'Desktop'
}

/**
 * Detects current device OS and form factor (Mac, Windows, Linux, Android, iOS).
 */
export function detectDevice(): DeviceDetection {
  if (typeof window === 'undefined') {
    return {
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      isMac: false,
      isWindows: false,
      isLinux: false,
      isDesktop: true,
      osName: 'Desktop',
    }
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ''
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || ''

  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isMobile = isAndroid || isIOS

  const isMac = !isMobile && (/Mac|Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) || /Macintosh/i.test(ua))
  const isWindows = !isMobile && (/Win/i.test(platform) || /Windows/i.test(ua))
  const isLinux = !isMobile && !isMac && !isWindows && (/Linux|X11/i.test(platform) || /Linux/i.test(ua))
  const isDesktop = !isMobile

  let osName: DeviceDetection['osName'] = 'Desktop'
  if (isMac) osName = 'Mac'
  else if (isWindows) osName = 'Windows'
  else if (isLinux) osName = 'Linux'
  else if (isAndroid) osName = 'Android'
  else if (isIOS) osName = 'iPhone'

  return {
    isAndroid,
    isIOS,
    isMobile,
    isMac,
    isWindows,
    isLinux,
    isDesktop,
    osName,
  }
}

/**
 * Backward compatibility alias for detectDevice().
 */
export function detectMobileDevice(): { isAndroid: boolean; isIOS: boolean; isMobile: boolean } {
  const d = detectDevice()
  return { isAndroid: d.isAndroid, isIOS: d.isIOS, isMobile: d.isMobile }
}

export interface TelegramLinks {
  botUsername: string
  startParam: string
  appUrl: string
  androidIntentUrl: string
  webUrl: string
}

/**
 * Parses and computes native app schemes (tg://) and web URLs (https://t.me/) for Telegram.
 */
export function getTelegramLinks(
  telegramUrl?: string | null,
  telegramAppUrl?: string | null
): TelegramLinks {
  let botUsername = 'SplitAppVerifyBot'
  let startParam = ''

  if (telegramAppUrl) {
    const domainMatch = telegramAppUrl.match(/[?&]domain=([^&]+)/)
    const startMatch = telegramAppUrl.match(/[?&]start=([^&]+)/)
    if (domainMatch) botUsername = domainMatch[1]
    if (startMatch) startParam = startMatch[1]
  }

  if ((!startParam || botUsername === 'SplitAppVerifyBot') && telegramUrl) {
    try {
      const parsed = new URL(telegramUrl)
      const pathPart = parsed.pathname.replace(/^\//, '')
      if (pathPart) botUsername = pathPart
      const param = parsed.searchParams.get('start')
      if (param) startParam = param
    } catch {
      // ignore parse error
    }
  }

  const appUrl = telegramAppUrl || `tg://resolve?domain=${botUsername}&start=${startParam}`
  const androidIntentUrl = `intent://resolve?domain=${botUsername}&start=${startParam}#Intent;package=org.telegram.messenger;scheme=tg;end;`
  const webUrl = telegramUrl || `https://t.me/${botUsername}?start=${startParam}`

  return {
    botUsername,
    startParam,
    appUrl,
    androidIntentUrl,
    webUrl,
  }
}

/**
 * Opens Telegram directly in the native application on Mac (macOS), Windows (PC),
 * Linux, Android, and iOS (iPhone), falling back to Telegram Web (https://t.me/...)
 * if the app is not installed.
 */
export function openTelegramApp(
  telegramUrl?: string | null,
  telegramAppUrl?: string | null,
  options?: { fallbackToWeb?: boolean; fallbackDelayMs?: number }
): boolean {
  if (typeof window === 'undefined') return false

  const { appUrl, webUrl } = getTelegramLinks(telegramUrl, telegramAppUrl)
  const fallbackDelayMs = options?.fallbackDelayMs ?? 2500

  let appLaunched = false

  const handleAppLaunch = () => {
    appLaunched = true
    window.removeEventListener('pagehide', handleAppLaunch)
    window.removeEventListener('blur', handleAppLaunch)
  }

  window.addEventListener('pagehide', handleAppLaunch, { once: true })
  window.addEventListener('blur', handleAppLaunch, { once: true })
  if (typeof document !== 'undefined') {
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) handleAppLaunch()
      },
      { once: true }
    )
  }

  // Fallback timer: if after 2.5s the user hasn't left or blurred the page (Telegram app not installed),
  // open the web fallback URL
  if (options?.fallbackToWeb !== false) {
    setTimeout(() => {
      if (!appLaunched && typeof document !== 'undefined' && !document.hidden) {
        try {
          window.open(webUrl, '_blank', 'noopener,noreferrer')
        } catch {
          window.location.href = webUrl
        }
      }
    }, fallbackDelayMs)
  }

  // Trigger the custom app URL scheme (tg://resolve?domain=...&start=...)
  // Supported natively by Telegram Desktop on macOS, Windows, Linux, as well as Android and iOS
  try {
    const link = document.createElement('a')
    link.href = appUrl
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link)
      } catch {}
    }, 150)
  } catch {
    window.location.href = appUrl
  }

  return true
}

/**
 * Opens WhatsApp directly in the native application on Mac, Windows, Android, and iOS,
 * falling back to WhatsApp Web if not installed.
 */
export function openWhatsAppApp(
  whatsappUrl?: string | null,
  whatsappAppUrl?: string | null,
  options?: { fallbackToWeb?: boolean; fallbackDelayMs?: number }
): void {
  if (typeof window === 'undefined') return

  const device = detectDevice()
  const targetAppUrl =
    whatsappAppUrl ||
    (whatsappUrl ? whatsappUrl.replace(/^https:\/\/wa\.me/, 'whatsapp://send') : 'whatsapp://')
  const webUrl = whatsappUrl || 'https://web.whatsapp.com'
  const fallbackDelayMs = options?.fallbackDelayMs ?? 2500

  let appLaunched = false

  const handleAppLaunch = () => {
    appLaunched = true
    window.removeEventListener('pagehide', handleAppLaunch)
    window.removeEventListener('blur', handleAppLaunch)
  }

  window.addEventListener('pagehide', handleAppLaunch, { once: true })
  window.addEventListener('blur', handleAppLaunch, { once: true })

  if (options?.fallbackToWeb !== false) {
    setTimeout(() => {
      if (!appLaunched && typeof document !== 'undefined' && !document.hidden) {
        if (device.isDesktop) {
          try {
            window.open(webUrl, '_blank', 'noopener,noreferrer')
          } catch {
            window.location.href = webUrl
          }
        } else {
          window.location.href = webUrl
        }
      }
    }, fallbackDelayMs)
  }

  try {
    const link = document.createElement('a')
    link.href = targetAppUrl
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link)
      } catch {}
    }, 150)
  } catch {
    window.location.href = targetAppUrl
  }
}
