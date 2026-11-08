/**
 * Verified Primary Users Directory
 * Strictly limited to authorized, verified participants:
 * 1. Jibin Jijo (+91 92072 93021)
 * 2. Sindhu (+91 94009 86188)
 * 3. Smeety (+91 91887 24538)
 * 4. Jijo P George (+91 98474 16607)
 *
 * All procedural dummy generators and fake names have been removed.
 */

export interface DummyPersonRaw {
  name: string
  photo: string
  phone: string
  isPhoneVerified: boolean
}

export const VERIFIED_PRIMARY_USERS: DummyPersonRaw[] = [
  {
    name: 'Jibin Jijo',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    phone: '+919207293021',
    isPhoneVerified: true,
  },
  {
    name: 'Sindhu',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+919400986188',
    isPhoneVerified: true,
  },
  {
    name: 'Smeety',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+919188724538',
    isPhoneVerified: true,
  },
  {
    name: 'Jijo P George',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+919847416607',
    isPhoneVerified: true,
  },
]

export const DUMMY_PEOPLE_RAW: DummyPersonRaw[] = VERIFIED_PRIMARY_USERS
export const ALL_SUGGESTED_NAMES: DummyPersonRaw[] = VERIFIED_PRIMARY_USERS
