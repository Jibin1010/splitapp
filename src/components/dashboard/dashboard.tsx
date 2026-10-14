'use client'

import * as React from 'react'
import { BillStoreProvider } from '@/lib/store'
import { PageHeader } from '@/components/layout/page-header'
import { Sidebar } from '@/components/layout/sidebar'
import { HistoryDialog } from '@/components/dashboard/history-dialog'
import { PeoplePanel } from '@/components/dashboard/people-panel'
import { ProductsTable } from '@/components/dashboard/products-table'
import { ImageVisionDialog } from '@/components/dashboard/image-vision-dialog'
import { SettlementPreview } from '@/components/dashboard/settlement-preview'
import { SettingsDialog } from '@/components/dashboard/settings-dialog'
import { SplitSummary } from '@/components/dashboard/split-summary'
import { SummaryCards } from '@/components/dashboard/summary-cards'

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

function DashboardShell() {
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [visionOpen, setVisionOpen] = React.useState(false)

  const openHistory = () => setHistoryOpen(true)
  const openSettings = () => setSettingsOpen(true)
  const openVision = () => setVisionOpen(true)

  return (
    <div id="top" className="print-reset min-h-screen lg:pl-60">
      <Sidebar onOpenHistory={openHistory} onOpenSettings={openSettings} onOpenVision={openVision} />
      <PageHeader onOpenHistory={openHistory} onOpenSettings={openSettings} onOpenVision={openVision} />

      <main className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6">
        <SummaryCards />

        <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <ProductsTable onOpenVision={openVision} />
          </div>

          <aside id="people-panel" aria-label="People and split summary" className="min-w-0 scroll-mt-20 space-y-4 sm:space-y-6">
            <PeoplePanel />
            <SplitSummary />
          </aside>
        </div>

        <SettlementPreview />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          SplitLedger keeps your bill in this browser’s local storage — it never syncs to other devices and no
          account is needed. Calculations are sent only to this app’s own backend, which does the arithmetic with
          integer-paise precision. If you clear this site’s stored data, saved bills are gone.
        </p>
      </footer>

      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ImageVisionDialog open={visionOpen} onOpenChange={setVisionOpen} />
    </div>
  )
}
