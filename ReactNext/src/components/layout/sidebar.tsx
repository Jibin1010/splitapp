'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  FilePlus2,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Split,
  Users,
  X,
} from 'lucide-react'
import { useBillStore } from '@/lib/store'
import { getStoredUser, logout, AuthUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SplitLedger'

interface SidebarNavProps {
  onOpenHistory: () => void
  onOpenSettings: () => void
  onOpenVision?: () => void
  onOpenContactSearch?: () => void
  onOpenBills?: () => void
  onNavigate?: () => void
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  href,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  href?: string
}) {
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-950',
          active && 'bg-zinc-900 text-white font-semibold hover:bg-black hover:text-white shadow-xs',
        )}
      >
        {icon}
        {label}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40',
        active && 'bg-zinc-900 text-white font-semibold hover:bg-black hover:text-white shadow-xs',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function SidebarNav({ onOpenHistory, onOpenSettings, onOpenVision, onOpenContactSearch, onOpenBills, onNavigate }: SidebarNavProps) {
  const { state, startNewBill } = useBillStore()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = React.useState(false)
  const [user, setUser] = React.useState<AuthUser | null>(null)

  React.useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const hasContent = state.bill.items.length > 0 || state.bill.people.length > 0

  const handleNewSplit = () => {
    onNavigate?.()
    if (hasContent) {
      setConfirmOpen(true)
    } else {
      startNewBill()
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <NavItem
          icon={<LayoutDashboard />}
          label="Overview"
          active
          onClick={() => {
            onNavigate?.()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
        <NavItem icon={<FilePlus2 />} label="New Split" onClick={handleNewSplit} />
        {onOpenBills && (
          <NavItem
            icon={<FolderKanban className="size-4 text-violet-500" />}
            label="Bills"
            onClick={() => {
              onNavigate?.()
              onOpenBills()
            }}
          />
        )}
        {onOpenContactSearch && (
          <NavItem
            icon={<Search className="size-4 text-emerald-500" />}
            label="5 Lakh Search"
            onClick={() => {
              onNavigate?.()
              onOpenContactSearch()
            }}
          />
        )}
        {onOpenVision && (
          <NavItem
            icon={<Sparkles className="size-4 text-indigo-500" />}
            label="AI Vision & Bills"
            onClick={() => {
              onNavigate?.()
              onOpenVision()
            }}
          />
        )}
        <NavItem icon={<Users />} label="Participants & Split" href="#split-breakdown" onClick={onNavigate} />
        <NavItem
          icon={<History />}
          label="History"
          onClick={() => {
            onNavigate?.()
            onOpenHistory()
          }}
        />
        <NavItem
          icon={<Settings />}
          label="Settings"
          onClick={() => {
            onNavigate?.()
            onOpenSettings()
          }}
        />
        {user && (
          <NavItem
            icon={<LogOut className="size-4 text-rose-500" />}
            label="Log Out"
            onClick={() => {
              onNavigate?.()
              setConfirmLogoutOpen(true)
            }}
          />
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a new split?</DialogTitle>
            <DialogDescription>
              This clears the current bill and starts a fresh one. If you want to keep this bill, use “Save Draft”
              first — it will stay in History.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                startNewBill()
              }}
            >
              Start new split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="size-5 text-rose-600" />
              Sign out?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to sign out of <strong>{user?.name || user?.email || 'your account'}</strong> on this device?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await logout()
                window.location.href = '/login'
              }}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-2xl px-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 hover:opacity-90 transition-opacity"
      aria-label={`${APP_NAME} — back to home`}
    >
      <span className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm ring-1 ring-white/10">
        <Split className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-extrabold tracking-tight text-foreground font-sans">{APP_NAME}</span>
        <span className="block text-xs font-medium text-muted-foreground">Split bills fairly</span>
      </span>
    </Link>
  )
}

/** Fixed sidebar for desktop (lg and up). */
export function Sidebar({ onOpenHistory, onOpenSettings, onOpenVision, onOpenContactSearch, onOpenBills }: SidebarNavProps) {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card p-4 lg:flex">
      <Logo />
      <nav className="mt-4 flex flex-1 flex-col" aria-label="Main navigation">
        <SidebarNav
          onOpenHistory={onOpenHistory}
          onOpenSettings={onOpenSettings}
          onOpenVision={onOpenVision}
          onOpenContactSearch={onOpenContactSearch}
          onOpenBills={onOpenBills}
        />
      </nav>
    </aside>
  )
}

/** Hamburger-driven drawer navigation for mobile. */
export function MobileNav({ onOpenHistory, onOpenSettings, onOpenVision, onOpenContactSearch, onOpenBills }: SidebarNavProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu />
        </Button>
      </DialogTrigger>
      <DialogContent className="left-2 top-2 max-w-xs -translate-x-0 -translate-y-0 origin-top-left sm:left-2 sm:top-2" hideClose>
        <div className="flex items-center justify-between">
          <Logo />
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close navigation menu">
              <X />
            </Button>
          </DialogClose>
        </div>
        <nav className="mt-2 flex flex-1 flex-col" aria-label="Mobile navigation">
          <SidebarNav
            onOpenHistory={() => {
              setOpen(false)
              onOpenHistory()
            }}
            onOpenSettings={() => {
              setOpen(false)
              onOpenSettings()
            }}
            onOpenVision={() => {
              setOpen(false)
              onOpenVision?.()
            }}
            onOpenContactSearch={() => {
              setOpen(false)
              onOpenContactSearch?.()
            }}
            onOpenBills={() => {
              setOpen(false)
              onOpenBills?.()
            }}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </DialogContent>
    </Dialog>
  )
}
