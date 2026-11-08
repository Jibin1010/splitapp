import { getRandomAvatarForName } from '@/lib/dummy-people'
import type { DialogPerson, EditableDetectedItem, VisionApiResponse } from './vision-types'

export const SAMPLE_PEOPLE: DialogPerson[] = [
  {
    id: 'person-jibin',
    name: 'Jibin Jijo',
    phone: '+919207293021',
    isPhoneVerified: true,
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'person-sindhu',
    name: 'Sindhu',
    phone: '+919400986188',
    isPhoneVerified: true,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'person-smeety',
    name: 'Smeety',
    phone: '+919188724538',
    isPhoneVerified: true,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'person-jijo',
    name: 'Jijo P George',
    phone: '+919847416607',
    isPhoneVerified: true,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
]

export const SAMPLE_ITEMS: EditableDetectedItem[] = [
  {
    id: 'sample-item-1',
    name: 'Chicken Biryani',
    quantity: 3,
    unitPricePaise: 18000,
    totalPaise: 54000,
    assignedParticipantIds: ['person-jibin', 'person-sindhu', 'person-smeety', 'person-jijo'],
  },
  {
    id: 'sample-item-2',
    name: 'Meals',
    quantity: 1,
    unitPricePaise: 12000,
    totalPaise: 12000,
    assignedParticipantIds: ['person-sindhu', 'person-smeety'],
  },
]

export const SAMPLE_VISION_RESULT: VisionApiResponse = {
  ok: true,
  model: 'google/diffusiongemma-26b-a4b-it',
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
