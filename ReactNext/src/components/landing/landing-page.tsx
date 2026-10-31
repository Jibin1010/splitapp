'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileText,
  Laptop,
  PieChart,
  Play,
  Receipt,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { LandingNavbar } from './landing-navbar'
import { LandingVideoCard } from './landing-video'

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#F2F7FF] via-[#FAFCFF] to-white text-slate-900 overflow-x-hidden">
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
        className="pointer-events-none absolute top-72 -right-32 w-[500px] h-[500px] bg-indigo-200/30 blur-3xl rounded-full"
      />

      {/* Top Navigation */}
      <LandingNavbar />

      {/* Main Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pill Badge */}
            <div>
              <span className="inline-flex items-center rounded-full bg-[#E0EDFF] border border-blue-200/60 px-3 py-1 text-[11px] font-extrabold tracking-wider text-[#2563EB] uppercase">
                SIMPLE • FAIR • STRESS-FREE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-950 leading-[1.08]">
              Split bills.<br />
              <span className="text-[#2563EB]">Not friendships.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md font-normal">
              Add the items, choose who shared them, and get a fair split in seconds. No awkward maths. No account
              required.
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/split"
                className="inline-flex items-center gap-2.5 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <span>Create a split</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* 3-Step Mini Badges Strip — Matching Upgraded Reference */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-slate-900">
                <span className="flex size-7.5 items-center justify-center rounded-xl bg-[#E0EDFF] text-[#2563EB] shadow-2xs">
                  <FileText className="size-4" />
                </span>
                <span>Add items</span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400 shrink-0 font-light" />
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-slate-900">
                <span className="flex size-7.5 items-center justify-center rounded-xl bg-[#E0EDFF] text-[#2563EB] shadow-2xs">
                  <Users className="size-4" />
                </span>
                <span>Assign people</span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400 shrink-0 font-light" />
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-slate-900">
                <span className="flex size-7.5 items-center justify-center rounded-xl bg-[#E0EDFF] text-[#2563EB] shadow-2xs">
                  <PieChart className="size-4" />
                </span>
                <span>Split fairly</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-slate-400" />
                <span>Free forever</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 text-slate-400" />
                <span>No sign-up</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Laptop className="size-3.5 text-slate-400" />
                <span>Any device</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Video Card */}
          <div className="lg:col-span-7 pb-6 sm:pb-8 lg:pb-0">
            <LandingVideoCard />
          </div>
        </div>

        {/* "HOW IT WORKS" Section */}
        <section id="how-it-works" className="mt-20 sm:mt-28 space-y-8 text-center scroll-mt-20">
          <div>
            <span className="inline-block text-xs font-black tracking-widest text-[#2563EB] uppercase">
              HOW IT WORKS
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              From receipt to <span className="text-[#2563EB]">fair split.</span>
            </h2>
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto text-left">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-2xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-start gap-3.5">
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB] shadow-2xs">
                <FileText className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#2563EB] text-white text-[10px] font-black ring-2 ring-white">
                  1
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add the items</h3>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  Enter the products and prices from your bill.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-2xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-start gap-3.5">
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#D97706] shadow-2xs">
                <Users className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#D97706] text-white text-[10px] font-black ring-2 ring-white">
                  2
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assign each share</h3>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  Choose who shared each item and how to split it.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-2xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-start gap-3.5">
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#7C3AED] shadow-2xs">
                <Calculator className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#7C3AED] text-white text-[10px] font-black ring-2 ring-white">
                  3
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Settle fairly</h3>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  See who owes whom and settle in seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Value Proposition Highlights Row */}
          <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-200/60 text-left scroll-mt-24">
            {/* Value 1 */}
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] shadow-2xs">
                <Zap className="size-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">No login required</h4>
                <p className="text-[11px] text-slate-500">Start splitting instantly</p>
              </div>
            </div>

            {/* Value 2 */}
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB] shadow-2xs">
                <ShieldCheck className="size-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Transparent calculations</h4>
                <p className="text-[11px] text-slate-500">Always accurate and fair</p>
              </div>
            </div>

            {/* Value 3 */}
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FCE7F3] text-[#DB2777] shadow-2xs">
                <Users className="size-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Made for groups</h4>
                <p className="text-[11px] text-slate-500">Friends, family, trips and more</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Decorative Botanical Beautifiers — Matching Reference Images exactly */}
      {/* Lower Left Botanical Leaf */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 z-0 select-none overflow-hidden w-52 sm:w-72 md:w-80 lg:w-96 opacity-75"
      >
        <img
          src="/images/production/beautifier-left.png"
          alt=""
          className="w-full h-auto object-contain translate-y-4 sm:translate-y-6 drop-shadow-sm"
        />
      </div>

      {/* Lower Right Botanical Leaf */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 z-0 select-none overflow-hidden w-56 sm:w-80 md:w-96 lg:w-[420px] opacity-75"
      >
        <img
          src="/images/production/beautifier-right.png"
          alt=""
          className="w-full h-auto object-contain translate-y-4 sm:translate-y-6 drop-shadow-sm"
        />
      </div>
    </div>
  )
}
