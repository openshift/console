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
    showMiniMap,
    toolbarLinks,
    minHeight,
    onChange,
    onSave,
    language,
  } = props;

  const [usesValue] = React.useState<boolean>(value !== undefined);
  const editorDidMount = React.useCallback(
    (editor, monaco) => {
      const currentLanguage = editor.getModel().getModeId();
      editor.layout();
      editor.focus();
      switch (currentLanguage) {
        case 'yaml':
          registerYAMLinMonaco(editor, monaco, usesValue);
          break;
        case 'json':
          editor.getAction('editor.action.formatDocument').run();
          break;
        default:
          break;
      }
      monaco.editor.getModels()[0].updateOptions({ tabSize: 2 });
      onSave && editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, onSave); // eslint-disable-line no-bitwise
    },
    [onSave, usesValue],
  );

  const editorOptions = React.useMemo(() => {
    return {
      ...options,
      minimap: {
        enabled: showMiniMap,
      },
    };
  }, [options, showMiniMap]);

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
                options={editorOptions}
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
