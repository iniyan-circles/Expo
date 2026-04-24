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
  const isDebug = __DEV__
  const nativeAppId = Constants.expoConfig?.android?.package || ''
  
  // In our project, variants are distinguished by appId suffixes
  const isQaVariant = nativeAppId.endsWith('.qa')
  const isDebugVariant = nativeAppId.endsWith('.debug')

  let variant: BuildVariant
  let label: string
  let color: string

  if (isDebug || isDebugVariant) {
    variant = 'debug'
    label = 'Debug (Metro)'
    color = '#22c55e'
  } else if (channel === 'production') {
    variant = 'production'
    label = 'Production'
    color = '#3b82f6'
  } else if (channel === 'preview' || isQaVariant) {
    variant = 'qa'
    label = isQaVariant ? 'Local QA' : 'QA (EAS)'
    color = '#f59e0b'
  } else {
    // Local assembleRelease — no EAS channel and no .qa/.debug suffix
    variant = 'production'
    label = 'Local Release'
    color = '#3b82f6'
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
