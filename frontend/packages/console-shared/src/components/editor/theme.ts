(window as any).monaco.editor.defineTheme('console-light', {
  base: 'vs',
  inherit: true,
  colors: {
    'editor.background': '#fff',
    'editorGutter.background': '#f5f5f5', // black-150
    'editorLineNumber.activeForeground': '#151515',
    'editorLineNumber.foreground': '#151515',
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
    'editor.background': '#151515',
    'editorGutter.background': '#292e34', // no pf token defined
    'editorLineNumber.activeForeground': '#fff',
    'editorLineNumber.foreground': '#f0f0f0',
  },
  rules: [
    { token: 'number', foreground: 'ace12e' }, // light-green-600
    { token: 'type', foreground: '73bcf7' }, // blue-200
    { token: 'string', foreground: 'f0ab00' }, // gold-400
    { token: 'keyword', foreground: 'cbc1ff' }, // purple-100
  ],
});
