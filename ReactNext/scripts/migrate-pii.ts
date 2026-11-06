import { pool } from '../src/lib/supabase/db'
import { encryptPII, isEncryptedPII, encryptBillForStorage } from '../src/lib/crypto/pii-crypto'

async function migrateLegacyData() {
  const client = await pool.connect()
  try {
    console.log('Starting Zero-Knowledge Database PII Scrubbing & Encryption...')

    // 1. Scrub bills.data
    const bills = await client.query('SELECT id, data FROM public.bills')
    let billsUpdated = 0
    for (const row of bills.rows) {
      if (row.data && Array.isArray(row.data.people)) {
        const needsEncryption = row.data.people.some((p: any) => p.name && !isEncryptedPII(p.name))
        if (needsEncryption) {
          const encBill = encryptBillForStorage(row.data)
          await client.query('UPDATE public.bills SET data = $1 WHERE id = $2', [JSON.stringify(encBill), row.id])
          billsUpdated++
        }
      }
    }
    console.log('Bills updated:', billsUpdated)

    // 2. Scrub bill_people
    const people = await client.query('SELECT id, name FROM public.bill_people')
    let peopleUpdated = 0
    for (const row of people.rows) {
      if (row.name && !isEncryptedPII(row.name)) {
        const enc = encryptPII(row.name)
        await client.query('UPDATE public.bill_people SET name = $1 WHERE id = $2', [enc, row.id])
        peopleUpdated++
      }
    }
    console.log('Bill people updated:', peopleUpdated)

    // 3. Scrub identity_profiles
    const profiles = await client.query('SELECT identity_id, display_name FROM public.identity_profiles')
    let profilesUpdated = 0
    for (const row of profiles.rows) {
      if (row.display_name && !isEncryptedPII(row.display_name)) {
        const enc = encryptPII(row.display_name)
        await client.query('UPDATE public.identity_profiles SET display_name = $1 WHERE identity_id = $2', [enc, row.identity_id])
        profilesUpdated++
      }
    }
    console.log('Profiles updated:', profilesUpdated)

    // 4. Scrub google_oauth_accounts
    const google = await client.query('SELECT google_sub, email, raw_profile FROM public.google_oauth_accounts')
    let googleUpdated = 0
    for (const row of google.rows) {
      const needsEmailEnc = row.email && !isEncryptedPII(row.email)
      let raw = row.raw_profile || {}
      let rawChanged = false
      if (raw.email && !isEncryptedPII(raw.email)) {
        raw.email = encryptPII(raw.email)
        rawChanged = true
      }
      if (raw.name && !isEncryptedPII(raw.name)) {
        raw.name = encryptPII(raw.name)
        rawChanged = true
      }
      if (needsEmailEnc || rawChanged) {
        const encEmail = encryptPII(row.email)
        await client.query(
          'UPDATE public.google_oauth_accounts SET email = $1, raw_profile = $2 WHERE google_sub = $3',
          [encEmail, JSON.stringify(raw), row.google_sub]
        )
        googleUpdated++
      }
    }
    console.log('Google accounts updated:', googleUpdated)

    // 5. Scrub local_credentials
    const local = await client.query('SELECT identity_id, email FROM public.local_credentials')
    let localUpdated = 0
    for (const row of local.rows) {
      if (row.email && !isEncryptedPII(row.email)) {
        const enc = encryptPII(row.email)
        await client.query('UPDATE public.local_credentials SET email = $1 WHERE identity_id = $2', [enc, row.identity_id])
        localUpdated++
      }
    }
    console.log('Local credentials updated:', localUpdated)

    // 6. Scrub phone_whatsapp_identities
    const phones = await client.query('SELECT identity_id, e164_phone FROM public.phone_whatsapp_identities')
    let phonesUpdated = 0
    for (const row of phones.rows) {
      if (row.e164_phone && !isEncryptedPII(row.e164_phone)) {
        const enc = encryptPII(row.e164_phone)
        await client.query('UPDATE public.phone_whatsapp_identities SET e164_phone = $1 WHERE identity_id = $2', [enc, row.identity_id])
        phonesUpdated++
      }
    }
    console.log('Phones updated:', phonesUpdated)

    // 7. Scrub phone_verification_challenges
    const challenges = await client.query(
      'SELECT id, claimed_phone_number, claimed_phone_e164, actual_sender_number, actual_sender_e164 FROM public.phone_verification_challenges'
    )
    let challengesUpdated = 0
    for (const row of challenges.rows) {
      let changed = false
      let claimedPhone = row.claimed_phone_number
      if (claimedPhone && !isEncryptedPII(claimedPhone)) {
        claimedPhone = encryptPII(claimedPhone)
        changed = true
      }
      let claimedE164 = row.claimed_phone_e164
      if (claimedE164 && !isEncryptedPII(claimedE164)) {
        claimedE164 = encryptPII(claimedE164)
        changed = true
      }
      let actualPhone = row.actual_sender_number
      if (actualPhone && !isEncryptedPII(actualPhone)) {
        actualPhone = encryptPII(actualPhone)
        changed = true
      }
      let actualE164 = row.actual_sender_e164
      if (actualE164 && !isEncryptedPII(actualE164)) {
        actualE164 = encryptPII(actualE164)
        changed = true
      }
      if (changed) {
        await client.query(
          'UPDATE public.phone_verification_challenges SET claimed_phone_number = $1, claimed_phone_e164 = $2, actual_sender_number = $3, actual_sender_e164 = $4 WHERE id = $5',
          [claimedPhone, claimedE164, actualPhone, actualE164, row.id]
        )
        challengesUpdated++
      }
    }
    console.log('Challenges updated:', challengesUpdated)

    console.log('SUCCESS: All legacy PII securely encrypted!')
  } finally {
    client.release()
    await pool.end()
  }
}

migrateLegacyData().catch(console.error)

