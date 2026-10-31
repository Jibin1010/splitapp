import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SplitLedger'

export const metadata: Metadata = {
  title: {
    default: `${appName} — Split bills fairly`,
    template: `%s · ${appName}`,
  },
  description:
    'Add items, assign people, split fairly. A no-login money-splitting calculator with exact per-item sharing rules, integer-paise accuracy and minimal settlement transfers.',
  applicationName: appName,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  )
}
