import { useContext, useEffect, useState } from 'react';
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
      'editor.background': '#ffffff', // global_BackgroundColor_light_100
      'editorGutter.background': '#f5f5f5', // black-150
      'editorLineNumber.activeForeground': '#151515', // global_Color_dark_100
      'editorLineNumber.foreground': '#3c3f42', // global_BackgroundColor_dark_200
    },
    rules: [
      { token: 'number', foreground: '486b00' }, // light-green-600
      { token: 'type', foreground: '795600' }, // gold-500
      { token: 'string', foreground: '004080' }, // blue-600
      { token: 'keyword', foreground: '40199a' }, // purple-600
    ],
  });

  editor.defineTheme('console-dark', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#151515', // global_BackgroundColor_dark_100
      'editorGutter.background': '#292e34', // no pf token defined
      'editorLineNumber.activeForeground': '#ffffff', // global_Color_light_100
      'editorLineNumber.foreground': '#f0f0f0', // global_BackgroundColor_200
    },
    rules: [
      { token: 'number', foreground: 'ace12e' }, // light-green-600
      { token: 'type', foreground: '73bcf7' }, // blue-200
      { token: 'string', foreground: 'f0ab00' }, // gold-400
      { token: 'keyword', foreground: 'cbc1ff' }, // purple-100
    ],
  });
};

/**
 * Sets the theme of a provided Monaco editor instance based on the current theme.
 */
export const useConsoleMonacoTheme = (editor: typeof monacoEditor | null) => {
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
      } else {
        editor.setTheme('console-dark');
      }
    }
  }, [theme, editor, themeLoaded]);
};
