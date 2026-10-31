import { getRandomAvatarForName } from '@/lib/dummy-people'
import type { DialogPerson, EditableDetectedItem, VisionApiResponse } from './vision-types'

export const SAMPLE_PEOPLE: DialogPerson[] = [
  { id: 'person-sandeep', name: 'Sandeep Chawla', photo: getRandomAvatarForName('Sandeep Chawla') },
  { id: 'person-aarav', name: 'Aarav Patel', photo: getRandomAvatarForName('Aarav Patel') },
  { id: 'person-farhan', name: 'Farhan Akhtar', photo: getRandomAvatarForName('Farhan Akhtar') },
  { id: 'person-fatima', name: 'Fatima Sana', photo: getRandomAvatarForName('Fatima Sana') },
  { id: 'person-radhika', name: 'Radhika Soni', photo: getRandomAvatarForName('Radhika Soni') },
]

export const SAMPLE_ITEMS: EditableDetectedItem[] = [
  {
    id: 'sample-item-1',
    name: 'Chicken Biryani',
    quantity: 3,
    unitPricePaise: 18000,
    totalPaise: 54000,
    assignedParticipantIds: ['person-sandeep', 'person-aarav', 'person-farhan', 'person-fatima', 'person-radhika'],
  },
  {
    id: 'sample-item-2',
    name: 'Meals',
    quantity: 1,
    unitPricePaise: 12000,
    totalPaise: 12000,
    assignedParticipantIds: ['person-fatima', 'person-radhika', 'person-sandeep'],
  },
]

export const SAMPLE_VISION_RESULT: VisionApiResponse = {
  ok: true,
  model: 'meta/llama-3.2-11b-vision-instruct',
  vendor: 'Duniyav Bir',
  date: '03/10/26',
  invoiceNumber: '99307',
  durationMs: 13440,
  subtotalPaise: 66000,
  taxPaise: 3300,
  grandTotalPaise: 69300,
  detectedItems: [
    { name: 'Chicken Biryani', quantity: 3, unitPricePaise: 18000, totalPaise: 54000 },
    { name: 'Meals', quantity: 1, unitPricePaise: 12000, totalPaise: 12000 },
  ],
  prepopulatedItems: SAMPLE_ITEMS,
  rawText: 'DUNIYAV BIR\nDate: 03/10/26\nInvoice #99307\n\n1. Chicken Biriyani x3  180.00  540.00\n2. Meals x1             120.00  120.00\n\nSubtotal: 660.00\nGST 5%: 33.00\nTOTAL: 693.00',
  description: 'Extracted 2 food products from Duniyav Bir invoice #99307 dated 03/10/26 with 5% GST.',
}
