import { createContext, useContext, useState } from 'react';

export type ColorSchemePreference = 'light' | 'dark' | 'system';

export const ColorSchemeContext = createContext<{
  preference: ColorSchemePreference;
  setPreference: (p: ColorSchemePreference) => void;
}>({ preference: 'system', setPreference: () => {} });

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ColorSchemePreference>('system');
  return (
    <ColorSchemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorSchemePreference() {
  return useContext(ColorSchemeContext);
}
