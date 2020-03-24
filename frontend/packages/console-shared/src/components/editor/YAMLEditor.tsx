import * as React from 'react';
import Measure from 'react-measure';
import MonacoEditor from 'react-monaco-editor';

import { registerYAMLinMonaco, defaultEditorOptions } from './yaml-editor-utils';
import YAMLEditorToolbar from './YAMLEditorToolbar';

import './YAMLEditor.scss';

interface YAMLEditorProps {
  value?: string;
  options?: object;
  minHeight?: string | number;
  showShortcuts?: boolean;
  toolbarLinks?: React.ReactNodeArray;
  onChange?: (newValue, event) => {};
  onSave?: () => {};
}

const YAMLEditor = React.forwardRef<MonacoEditor, YAMLEditorProps>((props, ref) => {
  const {
    value,
    options = defaultEditorOptions,
    showShortcuts,
    toolbarLinks,
    minHeight,
    onChange,
    onSave,
  } = props;

  const editorDidMount = (editor, monaco) => {
    editor.layout();
    editor.focus();
    registerYAMLinMonaco(monaco);
    monaco.editor.getModels()[0].updateOptions({ tabSize: 2 });
    onSave && editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, onSave); // eslint-disable-line no-bitwise
  };

  return (
    <>
      <YAMLEditorToolbar showShortcuts={showShortcuts} toolbarLinks={toolbarLinks} />
      <Measure bounds>
        {({ measureRef, contentRect }) => (
          <div ref={measureRef} className="ocs-yaml-editor__root" style={{ minHeight }}>
            <div className="ocs-yaml-editor__wrapper">
              <MonacoEditor
                ref={ref}
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
    </>
  );
});

export default YAMLEditor;
