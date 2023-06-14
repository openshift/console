import * as React from 'react';
import Measure from 'react-measure';
import MonacoEditor from 'react-monaco-editor';
import { CodeEditorProps } from '@console/dynamic-plugin-sdk';
import './theme';
import CodeEditorToolbar from './CodeEditorToolbar';
import { registerYAMLinMonaco, defaultEditorOptions } from './yaml-editor-utils';

import './CodeEditor.scss';

const CodeEditor = React.forwardRef<MonacoEditor, CodeEditorProps>((props, ref) => {
  const {
    value,
    options = defaultEditorOptions,
    showShortcuts,
    toolbarLinks,
    minHeight,
    onChange,
    onSave,
    language,
  } = props;

  const [usesValue] = React.useState<boolean>(value !== undefined);
  const editorDidMount = React.useCallback(
    (editor, monaco) => {
      editor.layout();
      editor.focus();
      registerYAMLinMonaco(editor, monaco, usesValue);
      monaco.editor.getModels()[0].updateOptions({ tabSize: 2 });
      onSave && editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, onSave); // eslint-disable-line no-bitwise
    },
    [onSave, usesValue],
  );

  return (
    <>
      <CodeEditorToolbar showShortcuts={showShortcuts} toolbarLinks={toolbarLinks} />
      <Measure bounds>
        {({ measureRef, contentRect }) => (
          <div ref={measureRef} className="ocs-yaml-editor__root" style={{ minHeight }}>
            <div className="ocs-yaml-editor__wrapper">
              <MonacoEditor
                ref={ref}
                language={language ?? 'yaml'}
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
    </>
  );
});

export default CodeEditor;
