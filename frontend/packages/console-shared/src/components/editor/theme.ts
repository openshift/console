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

/**
 * Define the themes `console-light` and `console-dark` for an instance of Monaco editor.
 */
export const defineThemes = (editor: typeof monacoEditor) => {
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
