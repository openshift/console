import * as React from 'react';
import Measure from 'react-measure';
import MonacoEditor from 'react-monaco-editor';
import {
  global_BackgroundColor_100 as lineNumberActiveForeground,
  global_BackgroundColor_300 as lineNumberForeground,
  global_BackgroundColor_dark_100 as editorBackground,
} from '@patternfly/react-tokens';
import './YAMLEditor.scss';
import { registerYAMLinMonaco } from './yaml-editor-utils';

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
    'editorLineNumber.activeForeground': lineNumberActiveForeground.value,
    'editorLineNumber.foreground': lineNumberForeground.value,
  },
});

const defaultEditorOptions = { readOnly: false, scrollBeyondLastLine: false };

interface YAMLEditorProps {
  value?: string;
  options?: object;
  onChange?: (newValue, event) => {};
  save?: () => {};
}

const YAMLEditor: React.FC<YAMLEditorProps> = ({
  value,
  options = defaultEditorOptions,
  onChange,
  save,
}) => {
  const editorDidMount = (editor, monaco) => {
    editor.layout();
    editor.focus();
    registerYAMLinMonaco(monaco);
    monaco.editor.getModels()[0].updateOptions({ tabSize: 2 });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => save()); // eslint-disable-line no-bitwise
  };

  return (
    <Measure bounds>
      {({ measureRef, contentRect }) => (
        <div ref={measureRef} className="ocs-yaml-editor__root">
          <div className="ocs-yaml-editor__wrapper">
            <MonacoEditor
              language="yaml"
              theme="console"
              height={contentRect.bounds.height}
              width={contentRect.bounds.width}
              value={value}
              options={options}
              editorDidMount={editorDidMount}
              onChange={onChange}
            />
          </div>
        </div>
      )}
    </Measure>
  );
};

export default YAMLEditor;
