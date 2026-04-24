import * as Updates from 'expo-updates'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

export type BuildVariant = 'debug' | 'qa' | 'production' | 'local-qa' | 'local-release'

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
  const runtimeVersion = Updates.runtimeVersion
  const isDebug = __DEV__

  let variant: BuildVariant
  let label: string
  let color: string

  if (isDebug || runtimeVersion === 'debug') {
    variant = 'debug'
    label = 'Debug (Local)'
    color = '#22c55e'
  } else if (channel === 'production' || runtimeVersion === 'production') {
    variant = 'production'
    label = channel ? 'Production (EAS)' : 'Local Release'
    color = '#3b82f6'
  } else if (channel === 'preview' || runtimeVersion === 'qa') {
    variant = 'qa'
    label = runtimeVersion === 'qa' ? 'Local QA' : 'QA (EAS)'
    color = '#f59e0b'
  } else {
    // Fallback for unexpected states
    variant = 'local-qa'
    label = 'Hybrid Build'
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
