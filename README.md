# SplitApp — Cloud-First Multi-Platform Bill Splitting & Operations

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2017%20(5NF)-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat&logo=flutter)](https://flutter.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)

A modern, high-assurance multi-platform application (Next.js 15 Web + Flutter Mobile & Desktop) for itemized bill splitting, restaurant operations, receipt AI recognition, and frictionless multi-provider authentication.

---

## 🌟 Key Architecture Principles

1. **5th Normal Form (5NF / Project-Join Normal Form) Database Architecture**:
   - Zero redundancy: Authentication identities, user profiles, local credentials, Google OAuth accounts, WhatsApp identities, and roles are fully decomposed into orthogonal projections.
   - Eliminates update and delete anomalies when unlinking OAuth providers or altering passwords.
   - Direct PostgreSQL 17 hosting on Supabase (`ap-northeast-1`).

2. **Cloud-First & Edge Compute**:
   - **Thin Client Philosophy:** The client only renders UI and dispatches user intent. All destructive calculations (net balances, tax/discount proportional redistribution, and debt graph simplification via min-cash-flow algorithm) execute authoritatively in the cloud / Edge Functions (`/api/cloud-bill/sync`).
   - Clients cannot tamper with allocations or final settlement transfers.

3. **Multi-Provider Authentication**:
   - **Google OAuth 2.0:** Server-verified, atomic account linking and profile sync in Supabase.
   - **Local Credentials:** PBKDF2-SHA256 (100,000 iterations) with cryptographic salt and timing-safe comparisons.
   - **Zero-Cost WhatsApp Verification:** User-initiated `wa.me` verification challenges without paid SMS or outbound WhatsApp fees.

4. **Vercel Ready**:
   - Pre-configured `vercel.json` with Tokyo edge regions (`hnd1`) matching Supabase's `ap-northeast-1` region for sub-millisecond database connection latency.

---

## 📁 Repository Structure

```
splitapp/
├── ReactNext/                     # Next.js 15 Web Application & Cloud API
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── cloud-auth/    # 5NF Supabase Auth (Register, Login, Google, Session)
│   │   │   │   ├── cloud-bill/    # Edge Function for Cloud Bill Splitting & Settlements
│   │   │   │   ├── phone-verification/ # Zero-Cost WhatsApp Challenges
│   │   │   │   └── webhooks/      # Meta WhatsApp Cloud API Webhook
│   │   │   ├── split/             # Main SplitLedger Dashboard
│   │   │   ├── login/ & register/ # Auth Modals & Pages
│   │   ├── components/            # React 19 UI Components
│   │   └── lib/
│   │       ├── supabase/          # 5NF Schema DDL & Connection Pool
│   │       └── calculations/      # Cloud Arithmetic & Settlement Engine
│   └── tests/                     # Vitest Test Suites
│
├── flutter/splitapp/              # Flutter Mobile & Desktop Application
│   ├── lib/
│   │   ├── services/              # API Clients (Calculate, Vision, Phone Verification)
│   │   └── widgets/               # Native Flutter UI
│   └── test/                      # Flutter Test Suites
│
├── supabase/                      # Database Schemas & Credentials Reference
│   ├── schema_5nf.sql             # Complete 5NF PostgreSQL DDL Script
│   └── supabase.pdf               # Project Configuration Reference
│
├── vercel.json                    # Vercel Deployment Configuration
└── README.md
```

---

## 🗄️ 5th Normal Form (5NF) Schema Overview

The database decomposes the authentication and bill domains into projections:

| Table | Normal Form Purpose |
| :--- | :--- |
| `app_identities` | Base atomic surrogate identity. |
| `identity_profiles` | Dependent projection: display name and avatar URL. |
| `auth_providers` | Canonical dictionary of enabled authentication methods. |
| `identity_auth_methods` | 5NF join projection between identity and active provider codes. |
| `local_credentials` | Username, email, salt, PBKDF2 hash, and lockout state. |
| `google_oauth_accounts` | Google unique subject ID (`sub`), verified email, and profile JSONB. |
| `phone_whatsapp_identities` | E.164 verified phone number store. |
| `auth_sessions` | Cloud-authoritative session tokens with IP/User-Agent tracking. |
| `auth_roles` & `identity_role_assignments` | Pure 5NF role-based access control (RBAC). |
| `cloud_audit_events` | Immutable security log for cloud tracking. |
| `bills`, `bill_people`, `bill_items`, `bill_item_shares`, `bill_adjustments`, `bill_settlements` | Cloud-computed bill state and debt transfers. |

---

## 🚀 Getting Started

### 1. Environment Configuration
Create `ReactNext/.env.local`:
```bash
# Supabase Database (5NF PostgreSQL 17)
NEXT_PUBLIC_SUPABASE_URL=https://waqyadioyacpuwqjnmui.supabase.co
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.waqyadioyacpuwqjnmui.supabase.co:5432/postgres

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# WhatsApp Verification
NEXT_PUBLIC_WHATSAPP_BOT_NUMBER=+919876543210
WHATSAPP_WEBHOOK_VERIFY_TOKEN=splitledger_wa_verify_secret
```

### 2. Run Locally
```bash
# Web application
cd ReactNext
npm install
npm run dev

# Flutter application
cd flutter/splitapp
flutter run -d macos # or -d chrome / -d ios
```

### 3. Run Tests
```bash
cd ReactNext
npx vitest run tests/supabase-5nf.test.ts
npx vitest run tests/phone-verification.test.ts
```

---

## ☁️ Deployment to Vercel

1. Push this repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com/new).
3. Set the Root Directory to `ReactNext` (or use the root `vercel.json`).
4. Add the `DATABASE_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variables in Vercel Project Settings.
5. Deploy!
