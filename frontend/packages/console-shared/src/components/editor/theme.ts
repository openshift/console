import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200';
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100';
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100';

window.monaco.editor.defineTheme('console', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
    { token: 'number', foreground: 'ace12e' },
    { token: 'type', foreground: '73bcf7' },
    { token: 'string', foreground: 'f0ab00' },
    { token: 'keyword', foreground: 'cbc0ff' },
  ],
  colors: {
    'editor.background': editorBackground.value,
    'editorGutter.background': '#292e34', // no pf token defined
    'editorLineNumber.activeForeground': globalColorLight100.value,
    'editorLineNumber.foreground': globalBackground200.value,
  },
});
