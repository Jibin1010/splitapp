'use client'

import * as React from 'react'
import { PhoneVerificationCard } from '@/components/PhoneVerification'

interface WhatsAppVerifyProps {
  onSuccess?: () => void
}

export function WhatsAppVerify({ onSuccess }: WhatsAppVerifyProps) {
  return (
    <PhoneVerificationCard
      onSuccess={(_phone) => {
        onSuccess?.()
      }}
    />
  )
}
