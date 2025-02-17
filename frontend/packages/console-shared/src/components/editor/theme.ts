import { useContext, useEffect, useState } from 'react';
import {
  t_color_green_70,
  t_color_yellow_70,
  t_color_blue_70,
  t_color_purple_70,
  t_color_green_30,
  t_color_blue_30,
  t_color_yellow_30,
  t_color_purple_30,
  t_color_white,
  t_color_gray_20,
  t_color_gray_60,
  t_color_gray_90,
  t_color_black,
} from '@patternfly/react-tokens';
import type { editor as monacoEditor } from 'monaco-editor/esm/vs/editor/editor.api';
import { ThemeContext } from '@console/internal/components/ThemeProvider';

/**
 * Define the themes `console-light` and `console-dark` for an instance of Monaco editor.
 */
const defineThemes = (editor: typeof monacoEditor) => {
  editor.defineTheme('console-light', {
    base: 'vs',
    inherit: true,
    colors: {
      'editor.background': t_color_white.value,
      'editorLineNumber.activeForeground': t_color_black.value,
      'editorLineNumber.foreground': t_color_gray_60.value,
    },
    rules: [
      { token: 'number', foreground: t_color_green_70.value },
      { token: 'type', foreground: t_color_yellow_70.value },
      { token: 'string', foreground: t_color_blue_70.value },
      { token: 'keyword', foreground: t_color_purple_70.value },
    ],
  });

  editor.defineTheme('console-dark', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': t_color_gray_90.value,
      'editorLineNumber.activeForeground': t_color_white.value,
      'editorLineNumber.foreground': t_color_gray_20.value,
    },
    rules: [
      { token: 'number', foreground: t_color_green_30.value },
      { token: 'type', foreground: t_color_blue_30.value },
      { token: 'string', foreground: t_color_yellow_30.value },
      { token: 'keyword', foreground: t_color_purple_30.value },
    ],
  });
};

const useSystemTheme = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setTheme(query.matches ? 'dark' : 'light');

    query.addEventListener('change', updateTheme);
    updateTheme();

    return () => query.removeEventListener('change', updateTheme);
  }, []);

  return theme;
};

/**
 * Sets the theme of a provided Monaco editor instance based on the current theme.
 */
export const useConsoleMonacoTheme = (editor: typeof monacoEditor | null) => {
  const systemTheme = useSystemTheme();
  const theme = useContext(ThemeContext);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    if (editor) {
      if (!themeLoaded) {
        defineThemes(editor);
        setThemeLoaded(true);
      }

      if (theme === 'light') {
        editor.setTheme('console-light');
      } else if (theme === 'dark') {
        editor.setTheme('console-dark');
      } else if (theme === 'systemDefault') {
        editor.setTheme(`console-${systemTheme}`);
      }
    }
  }, [theme, editor, themeLoaded, systemTheme]);
};
