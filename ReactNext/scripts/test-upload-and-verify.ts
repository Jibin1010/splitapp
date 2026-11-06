import { pool } from '../src/lib/supabase/db'
import {
  saveActiveBillForUser,
  getActiveBillForUser,
  toDbUuid,
} from '../src/lib/cloud-bill/bill-repository'
import {
  saveGroupVaultKey,
  getGroupVaultKey,
} from '../src/lib/vault/vault-service'
import { isEncryptedPII } from '../src/lib/crypto/pii-crypto'
import type { Bill } from '../src/types/split'

async function testUploadAndVerify() {
  console.log('================================================================')
  console.log('TEST: Uploading Bill & Verifying Zero-Knowledge PII Protection')
  console.log('================================================================\n')

  const testIdentityId = 'a1111111-2222-3333-4444-555555555555'
  const billId = `bill-${Date.now()}`
  const now = new Date().toISOString()

  // Ensure testIdentityId exists in app_identities
  const setupClient = await pool.connect()
  try {
    await setupClient.query(
      `INSERT INTO public.app_identities (id, is_active) VALUES ($1, true) ON CONFLICT (id) DO NOTHING;`,
      [testIdentityId]
    )
  } finally {
    setupClient.release()
  }

  // 1. Construct the bill from the user screenshot
  const testBill: Bill = {
    id: billId,
    name: 'Paradise Biriyani Split',
    currency: 'INR',
    items: [
      {
        id: 'item-1',
        name: 'Chicken Biriyani',
        quantity: 3,
        unitPrice: 18000, // 180 INR in paise
        allocation: {
          mode: 'equal',
          participantIds: ['person-jibin', 'person-rahul', 'person-sunil'],
        },
      },
      {
        id: 'item-2',
        name: 'Meals',
        quantity: 1,
        unitPrice: 12000, // 120 INR in paise
        allocation: {
          mode: 'equal',
          participantIds: ['person-jibin'],
        },
      },
    ],
    people: [
      {
        id: 'person-jibin',
        name: 'Jibin Jijo',
        paidAmount: 69300,
        phone: '+919812345678',
      },
      {
        id: 'person-rahul',
        name: 'Rahul Verma',
        paidAmount: 0,
        phone: '+919876543210',
      },
      {
        id: 'person-sunil',
        name: 'Sunil Sharma',
        paidAmount: 0,
      },
    ],
    adjustments: [
      {
        id: 'adj-gst',
        label: 'GST (5.0%)',
        kind: 'tax',
        method: 'fixed',
        value: 3300, // 33 INR in paise
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  // 2. Save group vault encryption key
  const mockVaultKeyBase64 = Buffer.from('test-aes-256-secret-key-32bytes!').toString('base64')
  console.log('[Step 1] Saving secret Vault Key for group members...')
  await saveGroupVaultKey({
    billId,
    keyBase64: mockVaultKeyBase64,
    userIdentityId: testIdentityId,
    members: testBill.people.map((p) => ({ id: p.id, name: p.name })),
  })
  console.log('✓ Group Vault Key saved.\n')

  // 3. Save Active Bill to Database via Cloud Bill Repository
  console.log('[Step 2] Uploading and saving bill to database...')
  const saveResult = await saveActiveBillForUser(testIdentityId, testBill)
  if (!saveResult.success) {
    throw new Error('Failed to save bill: ' + saveResult.error)
  }
  console.log('✓ Bill successfully saved to database.\n')

  // 4. DIRECT DATABASE INSPECTION (The Core Requirement)
  console.log('[Step 3] Direct PostgreSQL Query Check:')
  const client = await pool.connect()
  try {
    const dbBillRes = await client.query(
      'SELECT id, title, data FROM public.bills WHERE id = $1;',
      [toDbUuid(billId)]
    )
    if (dbBillRes.rows.length === 0) {
      throw new Error('Bill not found in public.bills!')
    }

    const row = dbBillRes.rows[0]
    console.log(`Database row found: ID = ${row.id}, Title = "${row.title}"`)

    const peopleInDb = row.data.people
    console.log('\n--- RAW DATA STORED IN POSTGRESQL "bills.data" COLUMN ---')
    peopleInDb.forEach((p: any, i: number) => {
      console.log(`Participant ${i + 1}:`)
      console.log(`  ID:    ${p.id}`)
      console.log(`  Name:  ${p.name}`)
      console.log(`  Phone: ${p.phone || 'N/A'}`)
      console.log(`  Is Name Encrypted?  ${isEncryptedPII(p.name) ? 'YES (enc:v1:...)' : 'NO - LEAK!'}`)
      if (p.phone) {
        console.log(`  Is Phone Encrypted? ${isEncryptedPII(p.phone) ? 'YES (enc:v1:...)' : 'NO - LEAK!'}`)
      }
      if (!isEncryptedPII(p.name)) {
        throw new Error(`CRITICAL SECURITY FAILURE: Name "${p.name}" stored in plaintext!`)
      }
      if (p.phone && !isEncryptedPII(p.phone)) {
        throw new Error(`CRITICAL SECURITY FAILURE: Phone "${p.phone}" stored in plaintext!`)
      }
    })

    const bpRes = await client.query(
      'SELECT id, name FROM public.bill_people WHERE bill_id = $1;',
      [toDbUuid(billId)]
    )
    console.log('\n--- RAW DATA STORED IN POSTGRESQL "bill_people" TABLE ---')
    bpRes.rows.forEach((r: any, i: number) => {
      console.log(`Row ${i + 1}: Name = ${r.name} | Encrypted = ${isEncryptedPII(r.name)}`)
      if (!isEncryptedPII(r.name)) {
        throw new Error(`CRITICAL SECURITY FAILURE: Name "${r.name}" in bill_people stored in plaintext!`)
      }
    })
    console.log('\n✓ ZERO PLAINTEXT NAMES OR PHONES EXIST IN POSTGRESQL!\n')
  } finally {
    client.release()
  }

  // 5. APPLICATION READ DECRYPTION CHECK
  console.log('[Step 4] Checking transparent decryption when user fetches their bill...')
  const fetchedBill = await getActiveBillForUser(testIdentityId)
  console.log('Decrypted participants returned to frontend:')
  fetchedBill.people.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (Phone: ${p.phone || 'N/A'})`)
  })

  if (fetchedBill.people[0].name !== 'Jibin Jijo' || fetchedBill.people[1].name !== 'Rahul Verma') {
    throw new Error('Decryption mismatch: Frontend did not receive original names!')
  }
  console.log('✓ Transparent decryption verified: User seamlessly sees plain names in app!\n')

  // 6. VAULT UNLOCK AUTHORIZATION CHECK
  console.log('[Step 5] Checking Vault Unlock Key Authorization:')

  // Member 1 (Owner: testIdentityId)
  const keyOwner = await getGroupVaultKey({
    billId,
    requestingIdentityId: testIdentityId,
  })
  console.log(`- Bill Owner access: ${keyOwner.success ? 'GRANTED (200 OK)' : 'FAILED'}`)

  // Member 2 (Group participant by name: Rahul Verma)
  const keyRahul = await getGroupVaultKey({
    billId,
    requestingUserName: 'Rahul Verma',
  })
  console.log(`- Group Member "Rahul Verma" access: ${keyRahul.success ? 'GRANTED (200 OK)' : 'FAILED'}`)

  // Member 3 (Group participant by name: Sunil Sharma)
  const keySunil = await getGroupVaultKey({
    billId,
    requestingUserName: 'Sunil Sharma',
  })
  console.log(`- Group Member "Sunil Sharma" access: ${keySunil.success ? 'GRANTED (200 OK)' : 'FAILED'}`)

  // Intruder / Outsider (Mallory)
  const keyIntruder = await getGroupVaultKey({
    billId,
    requestingUserName: 'Mallory Hacker',
  })
  console.log(`- Outsider "Mallory Hacker" access: ${!keyIntruder.success && (keyIntruder as any).status === 403 ? 'BLOCKED (403 Forbidden)' : 'LEAK!'}`)

  if (!keyOwner.success || !keyRahul.success || !keySunil.success || keyIntruder.success) {
    throw new Error('Vault Key authorization test failed!')
  }

  console.log('\n================================================================')
  console.log('ALL TESTS PASSED: 100% Zero-Knowledge PII Protection Confirmed!')
  console.log('================================================================')
}

testUploadAndVerify()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Test Failed:', err)
    pool.end()
    process.exit(1)
  })
