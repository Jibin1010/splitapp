'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X, Sparkles, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AuthForm } from '@/components/auth/auth-form'

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 transition-transform hover:scale-[1.02] ${className}`}>
      <div className="relative flex size-9.5 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] p-0.5 shadow-md shadow-blue-500/25">
        <div className="flex size-full items-center justify-center rounded-[14px] bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]">
          <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="16" height="16" x="4" y="4" rx="4" />
            <path d="M9 9h6" />
            <path d="M9 13h4" />
            <path d="M9 17h6" />
          </svg>
        </div>
      </div>
      <span className="text-xl font-black tracking-tight text-slate-900">
        SplitLedger
      </span>
    </Link>
  )
}

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [loginModalOpen, setLoginModalOpen] = React.useState(false)
  const [faqModalOpen, setFaqModalOpen] = React.useState(false)

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="relative z-30 w-full pt-4 sm:pt-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => scrollTo('features')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => scrollTo('features')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => setFaqModalOpen(true)}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-5 py-2 text-xs font-bold text-slate-700 bg-white/90 border border-slate-200/90 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span>Create account</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 p-5 shadow-xl space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-3 font-semibold text-sm text-slate-700">
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="text-left py-1 hover:text-indigo-600"
            >
              Product
            </button>
            <button
              type="button"
              onClick={() => scrollTo('how-it-works')}
              className="text-left py-1 hover:text-indigo-600"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="text-left py-1 hover:text-indigo-600"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setFaqModalOpen(true)
              }}
              className="text-left py-1 hover:text-indigo-600"
            >
              FAQ
            </button>
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white shadow hover:bg-black"
            >
              Create account →
            </Link>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-950">
              <Sparkles className="size-5 text-[#2563EB]" />
              <span>SplitLedger Account</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sign in or create your profile to manage and track shared splits.
            </DialogDescription>
          </DialogHeader>
          <AuthForm isModal onSuccess={() => setLoginModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* FAQ Modal */}
      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="size-5 text-indigo-600" />
              <span>Frequently Asked Questions</span>
            </DialogTitle>
            <DialogDescription>
              Everything you need to know about SplitLedger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-slate-600 max-h-[60vh] overflow-y-auto pr-1">
            <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
              <h4 className="font-bold text-slate-800">Do my friends need to create an account?</h4>
              <p>No! Nobody needs an account. You can copy a clean WhatsApp/clipboard summary with each person’s exact items, GST, and settlement transfer in 1 click.</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
              <h4 className="font-bold text-slate-800">How is the math calculated?</h4>
              <p>SplitLedger does all calculations with integer paise precision on the backend to avoid rounding errors. Taxes and discounts are apportioned proportionally to individual food totals.</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
              <h4 className="font-bold text-slate-800">Can I scan bills with AI?</h4>
              <p>Yes! SplitLedger includes an AI Vision tool that extracts item names, quantities, and prices automatically from bill photos.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
