import { useContext } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { ColorSchemeContext } from '@/context/color-scheme';

export function useColorScheme(): 'light' | 'dark' {
  const system = useNativeColorScheme() === 'dark' ? 'dark' : 'light';
  const { preference } = useContext(ColorSchemeContext);
  return preference === 'system' ? system : preference;
}
