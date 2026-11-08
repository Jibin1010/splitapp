'use client'

import * as React from 'react'
import { BillStoreProvider } from '@/lib/store'
import { PageHeader } from '@/components/layout/page-header'
import { Sidebar } from '@/components/layout/sidebar'
import { HistoryDialog } from '@/components/dashboard/history-dialog'
import { ImageVisionDialog } from '@/components/dashboard/image-vision-dialog'
import { SettlementPreview } from '@/components/dashboard/settlement-preview'
import { SettingsDialog } from '@/components/dashboard/settings-dialog'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ProductsTable } from '@/components/dashboard/products-table'
import { BillSplitBreakdown } from '@/components/dashboard/bill-split-breakdown'
import { UserPerspectiveBar, PersonalSpotlightCard } from '@/components/dashboard/user-perspective-bar'
import { UserSwitcherDialog } from '@/components/dashboard/user-switcher-dialog'
import { ContactSearchDialog } from '@/components/dashboard/contact-search-dialog'
import { BillsDialog } from '@/components/dashboard/bills-dialog'

/**
 * The whole user journey lives on one dashboard: summary figures, the
 * editable product table, people, split summary and settlement preview.
 * The side sections are expandable cards, so the layout stays usable from
 * wide desktop down to small screens.
 */
export function Dashboard() {
  return (
    <BillStoreProvider>
      <DashboardShell />
    </BillStoreProvider>
  )
}

export function DashboardShell() {
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [visionOpen, setVisionOpen] = React.useState(false)
  const [switcherOpen, setSwitcherOpen] = React.useState(false)
  const [contactSearchOpen, setContactSearchOpen] = React.useState(false)
  const [billsOpen, setBillsOpen] = React.useState(false)

  const openHistory = () => setHistoryOpen(true)
  const openSettings = () => setSettingsOpen(true)
  const openVision = () => setVisionOpen(true)
  const openSwitcher = () => setSwitcherOpen(true)
  const openContactSearch = () => setContactSearchOpen(true)
  const openBills = () => setBillsOpen(true)

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K opens 5 Lakh Contact Search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setContactSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div id="top" className="print-reset min-h-screen lg:pl-60">
      <Sidebar
        onOpenHistory={openHistory}
        onOpenSettings={openSettings}
        onOpenVision={openVision}
        onOpenContactSearch={openContactSearch}
        onOpenBills={openBills}
      />
      <PageHeader
        onOpenHistory={openHistory}
        onOpenSettings={openSettings}
        onOpenVision={openVision}
        onOpenUserSwitcher={openSwitcher}
        onOpenContactSearch={openContactSearch}
        onOpenBills={openBills}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6">
        <UserPerspectiveBar onOpenSwitcher={openSwitcher} />
        <PersonalSpotlightCard onOpenSwitcher={openSwitcher} />
        <SummaryCards />
        <ProductsTable onOpenVision={openVision} />
        <BillSplitBreakdown />
        <SettlementPreview />
      </main>

      <footer className="relative z-10 mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          SplitLedger enforces server-side 5NF multi-tenant data isolation. Each user’s bills and expense groups are
          securely synchronized on the cloud backend and accessible strictly by your authenticated account and verified
          members added to your groups.
        </p>
      </footer>

      {/* Decorative Botanical Beautifier — Lower Left */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 lg:left-60 z-0 select-none overflow-hidden w-56 sm:w-72 md:w-80 lg:w-96 opacity-65 transition-opacity"
      >
        <img
          src="/images/production/beautifier-left.png"
          alt=""
          className="w-full h-auto object-contain translate-y-4 sm:translate-y-8 drop-shadow-sm"
        />
      </div>

      {/* Decorative Botanical Beautifier — Lower Right */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 z-0 select-none overflow-hidden w-60 sm:w-80 md:w-96 lg:w-[420px] opacity-65 transition-opacity"
      >
        <img
          src="/images/production/beautifier-right.png"
          alt=""
          className="w-full h-auto object-contain translate-y-4 sm:translate-y-8 drop-shadow-sm"
        />
      </div>

      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ImageVisionDialog open={visionOpen} onOpenChange={setVisionOpen} />
      <UserSwitcherDialog open={switcherOpen} onOpenChange={setSwitcherOpen} />
      <ContactSearchDialog open={contactSearchOpen} onOpenChange={setContactSearchOpen} />
      <BillsDialog open={billsOpen} onOpenChange={setBillsOpen} />
    </div>
  )
}
