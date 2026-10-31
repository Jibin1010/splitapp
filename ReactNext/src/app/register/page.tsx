import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandLogo } from '@/components/landing/landing-navbar'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Create Account — SplitLedger',
  description: 'Create your free SplitLedger account to track group expenses and settle fairly.',
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#F2F7FF] via-[#FAFCFF] to-white text-slate-900 flex flex-col justify-between overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-200/40 via-indigo-100/30 to-transparent blur-3xl rounded-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-48 -left-32 w-[500px] h-[500px] bg-sky-200/30 blur-3xl rounded-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 -right-32 w-[500px] h-[500px] bg-indigo-200/30 blur-3xl rounded-full"
      />

      {/* Header bar */}
      <header className="relative z-20 w-full pt-6 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <BrandLogo />
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:py-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E0EDFF] border border-blue-200/60 px-3 py-1 text-[11px] font-extrabold tracking-wider text-[#2563EB] uppercase">
              <Sparkles className="size-3" />
              <span>START FREE IN SECONDS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-slate-950 leading-[1.12]">
              Create your <br />
              <span className="text-[#2563EB]">SplitLedger</span> account
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed font-normal max-w-md">
              Join thousands of friends, roommates, and travel groups who split receipts accurately without awkward money talks.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                <span>Personal profile perspective and role assignments</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                <span>AI camera receipt scanner with auto line extraction</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                <span>No subscription fees, completely free forever</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 text-[11px] text-slate-500">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span>Zero credit card required. Private data encryption.</span>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
              <div className="mb-6">
                <h2 className="text-xl font-black text-slate-950">Get Started</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create your personal account to save and sync your splits.
                </p>
              </div>

              <AuthForm initialMode="register" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} SplitLedger. Fair money splitting for friends and teams.</p>
      </footer>

      {/* Decorative Botanical Beautifier */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 z-0 select-none overflow-hidden w-48 sm:w-64 opacity-50 transition-opacity"
      >
        <img
          src="/images/production/beautifier-left.png"
          alt=""
          className="w-full h-auto object-contain translate-y-6 drop-shadow-sm"
        />
      </div>
    </div>
  )
}

