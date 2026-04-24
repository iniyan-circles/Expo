import * as Updates from 'expo-updates'
import { Platform } from 'react-native'

export type BuildVariant = 'debug' | 'qa' | 'production' | 'local-qa'

export interface BuildVariantInfo {
  variant: BuildVariant
  label: string
  color: string
  channel: string | undefined
  isDebug: boolean
  platform: string
  runtimeVersion: string | undefined
  updateId: string | undefined
}

export function useBuildVariant(): BuildVariantInfo {
  const channel = Updates.channel
  const isDebug = __DEV__

  let variant: BuildVariant
  let label: string
  let color: string

  if (isDebug) {
    variant = 'debug'
    label = 'Debug (Metro)'
    color = '#22c55e'
  } else if (channel === 'production') {
    variant = 'production'
    label = 'Production'
    color = '#3b82f6'
  } else if (channel === 'preview') {
    variant = 'qa'
    label = 'QA'
    color = '#f59e0b'
  } else {
    // Local assembleQa or assembleRelease — no EAS channel set
    variant = 'local-qa'
    label = 'Local Build'
    color = '#8b5cf6'
  }

  return {
    variant,
    label,
    color,
    channel: channel || undefined,
    isDebug,
    platform: Platform.OS,
    runtimeVersion: Updates.runtimeVersion ?? undefined,
    updateId: Updates.updateId ?? undefined,
  }
}
