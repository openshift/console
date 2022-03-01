import { Dispatch, SetStateAction } from 'react';
import { useUserSettings } from '@console/shared';

export const usePreferredTheme = (): [string, Dispatch<SetStateAction<string>>, boolean] => {
  const [preferredTheme, setPreferredTheme, preferredThemeLoaded] = useUserSettings<string>(
    'console.theme',
    'light',
  );

  return [preferredTheme, setPreferredTheme, preferredThemeLoaded];
};
