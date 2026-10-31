'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  Sparkles,
  User,
} from 'lucide-react'
import {
  loginWithCredentials,
  registerWithCredentials,
  saveStoredUser,
  syncGoogleUserToCloud,
} from '@/lib/auth'
import { saveActivePersonId } from '@/lib/storage'
import { WhatsAppVerify } from './whatsapp-verify'

interface AuthFormProps {
  initialMode?: 'login' | 'register' | 'whatsapp'
  onSuccess?: () => void
  isModal?: boolean
}

export function AuthForm({ initialMode = 'login', onSuccess, isModal = false }: AuthFormProps) {
  const router = useRouter()

  const [mode, setMode] = React.useState<'login' | 'register' | 'whatsapp'>(initialMode)
  const [showPassword, setShowPassword] = React.useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = React.useState('')
  const [loginPassword, setLoginPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(true)

  // Register fields
  const [regName, setRegName] = React.useState('')
  const [regEmail, setRegEmail] = React.useState('')
  const [regPassword, setRegPassword] = React.useState('')
  const [regConfirmPassword, setRegConfirmPassword] = React.useState('')
  const [agreeTerms, setAgreeTerms] = React.useState(true)

  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  const handleGoogleLogin = () => {
    setError(null)
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '683073470249-2jfttvl111jep9huk95ma5a5860vs8kb.apps.googleusercontent.com'

    if (typeof window === 'undefined') return

    const launchOAuth = () => {
      const google = (window as unknown as { google?: any }).google
      if (!google?.accounts?.oauth2) {
        setError('Connecting to Google services... Please click Google again.')
        return
      }

      setGoogleLoading(true)

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setGoogleLoading(false)
              if (tokenResponse.error === 'access_denied') {
                setError('Google sign-in was cancelled.')
              } else {
                setError(`Google error: ${tokenResponse.error_description || tokenResponse.error}`)
              }
              return
            }

            if (tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                })

                if (!res.ok) {
                  throw new Error('Failed to retrieve Google profile data.')
                }

                const profile = await res.json()

                // Sync Google identity into Supabase 5NF Cloud Database
                const cloudSync = await syncGoogleUserToCloud({
                  accessToken: tokenResponse.access_token,
                  profile,
                })

                const realUser = cloudSync.success && cloudSync.user
                  ? cloudSync.user
                  : {
                      id: `google-${profile.sub}`,
                      name: profile.name || profile.given_name || profile.email.split('@')[0],
                      email: profile.email,
                      photo: profile.picture || null,
                      createdAt: new Date().toISOString(),
                    }

                saveStoredUser(realUser)
                saveActivePersonId(realUser.id)

                setSuccessMsg(`Welcome, ${realUser.name}! Signed in with Google.`)
                setTimeout(() => {
                  onSuccess?.()
                  router.push('/split')
                }, 600)
              } catch (err: any) {
                setGoogleLoading(false)
                setError(err.message || 'Could not fetch Google profile.')
              }
            }
          },
          error_callback: (err: any) => {
            setGoogleLoading(false)
            if (err?.type === 'popup_closed') {
              setError('Google login popup was closed.')
            } else {
              setError(
                err?.message?.includes('origin')
                  ? 'Google origin mismatch: please ensure http://localhost:3000 is added in Google Cloud Console.'
                  : `Google sign-in: ${err?.message || 'closed'}`
              )
            }
          },
        })

        client.requestAccessToken({ prompt: 'select_account' })
      } catch (err: any) {
        setGoogleLoading(false)
        setError(`Failed to open Google login: ${err?.message || err}`)
      }
    }

    // Ensure GIS script is available
    if (!(window as any).google?.accounts?.oauth2) {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.onload = () => launchOAuth()
        script.onerror = () => setError('Failed to load Google SDK. Check network or ad-blocker.')
        document.body.appendChild(script)
      } else {
        launchOAuth()
      }
    } else {
      launchOAuth()
    }
  }

  const handleDemoFill = () => {
    setMode('login')
    setLoginEmail('maya@splitledger.app')
    setLoginPassword('password123')
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!loginEmail || !loginPassword) {
      setError('Please fill in both email and password.')
      return
    }

    setLoading(true)
    const result = await loginWithCredentials(loginEmail, loginPassword)
    setLoading(false)

    if (!result.success || !result.user) {
      setError(result.error || 'Login failed. Please check your details.')
      return
    }

    setSuccessMsg(`Welcome back, ${result.user.name}! Redirecting...`)

    // Save user ID to localStorage so activePerson matches
    saveActivePersonId(result.user.id)

    setTimeout(() => {
      onSuccess?.()
      router.push('/split')
    }, 600)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!regName || !regEmail || !regPassword) {
      setError('Please complete all required fields.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service to continue.')
      return
    }

    setLoading(true)
    const result = await registerWithCredentials(regName, regEmail, regPassword)
    setLoading(false)

    if (!result.success || !result.user) {
      setError(result.error || 'Registration failed. Please try again.')
      return
    }

    setSuccessMsg(`Account created for ${result.user.name}! Redirecting...`)
    saveActivePersonId(result.user.id)

    setTimeout(() => {
      onSuccess?.()
      router.push('/split')
    }, 600)
  }

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 border border-slate-200/60">
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('whatsapp')
            setError(null)
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:text-emerald-900'
          }`}
        >
          <MessageCircle className="size-3.5" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Error & Success Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/80 p-3 text-xs font-medium text-red-700 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-xs font-medium text-emerald-800 animate-in fade-in">
          <Check className="size-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* LOGIN FORM */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setError('Password reset link is not active in this demo. Try Maya demo account!')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-slate-600">Remember this device</span>
            </label>

            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              title="Autofill Maya Sharma demo credentials"
            >
              <Sparkles className="size-3 text-indigo-600" />
              <span>Autofill Demo</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-bold text-white shadow-md hover:bg-black hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to SplitLedger</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* REGISTER FORM */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Maya Sharma"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] leading-tight text-slate-600">
                I agree to the <span className="font-semibold text-slate-800">Terms of Service</span> and acknowledge private, client-side encryption.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* WHATSAPP FORM */}
      {mode === 'whatsapp' && (
        <WhatsAppVerify onSuccess={onSuccess} />
      )}

      {/* Social and Guest divider */}
      {mode !== 'whatsapp' && (
        <>
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Connecting...' : 'Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('whatsapp')
                setError(null)
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/40 py-2.5 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100/60 transition-colors shadow-2xs cursor-pointer"
            >
              <MessageCircle className="size-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          </div>
        </>
      )}

      {/* Guest Mode fallback */}
      <div className="mt-5 text-center">
        <Link
          href="/split"
          onClick={onSuccess}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors underline"
        >
          Continue as Guest without account →
        </Link>
      </div>
    </div>
  )
}
