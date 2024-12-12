import {
  t_temp_dev_tbd as globalBackground200 /* CODEMODS: you should update this color token, original v5 token was global_BackgroundColor_200 */,

  t_temp_dev_tbd as darkEditorBackground /* CODEMODS: you should update this color token, original v5 token was global_BackgroundColor_dark_100 */,
,
  t_temp_dev_tbd as globalBackgroundDark200 /* CODEMODS: you should update this color token, original v5 token was global_BackgroundColor_dark_200 */,
,
  t_temp_dev_tbd as lightEditorBackground /* CODEMODS: you should update this color token, original v5 token was global_BackgroundColor_light_100 */,
,
  t_temp_dev_tbd as globalColorDark100 /* CODEMODS: you should update this color token, original v5 token was global_Color_dark_100 */,
,
  t_temp_dev_tbd as globalColorLight100 /* CODEMODS: you should update this color token, original v5 token was global_Color_light_100 */,
} from '@patternfly/react-tokens/dist/js/t_temp_dev_tbd';






(window as any).monaco.editor.defineTheme('console-light', {
  base: 'vs',
  inherit: true,
  colors: {
    'editor.background': lightEditorBackground.value,
    'editorGutter.background': '#f5f5f5', // black-150
    'editorLineNumber.activeForeground': globalColorDark100.value,
    'editorLineNumber.foreground': globalBackgroundDark200.value,
  },
  rules: [
    { token: 'number', foreground: '486b00' }, // light-green-600
    { token: 'type', foreground: '795600' }, // gold-500
    { token: 'string', foreground: '004080' }, // blue-600
    { token: 'keyword', foreground: '40199a' }, // purple-600
  ],
});

(window as any).monaco.editor.defineTheme('console-dark', {
  base: 'vs-dark',
  inherit: true,
  colors: {
    'editor.background': darkEditorBackground.value,
    'editorGutter.background': '#292e34', // no pf token defined
    'editorLineNumber.activeForeground': globalColorLight100.value,
    'editorLineNumber.foreground': globalBackground200.value,
  },
  rules: [
    { token: 'number', foreground: 'ace12e' }, // light-green-600
    { token: 'type', foreground: '73bcf7' }, // blue-200
    { token: 'string', foreground: 'f0ab00' }, // gold-400
    { token: 'keyword', foreground: 'cbc1ff' }, // purple-100
  ],
});
