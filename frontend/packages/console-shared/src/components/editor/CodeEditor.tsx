import * as React from 'react';
import Measure from 'react-measure';
import MonacoEditor, { EditorDidMount } from 'react-monaco-editor';
import { CodeEditorProps } from '@console/dynamic-plugin-sdk';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import CodeEditorToolbar from './CodeEditorToolbar';
import { registerYAMLinMonaco, defaultEditorOptions } from './yaml-editor-utils';
import './CodeEditor.scss';

const CodeEditor = React.forwardRef<any, CodeEditorProps>((props, ref) => {
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

  const theme = React.useContext(ThemeContext);
  const [usesValue] = React.useState<boolean>(value !== undefined);
  const editorDidMount: EditorDidMount = React.useCallback(
    (editor, monaco) => {
      const currentLanguage = editor.getModel()?.getLanguageId();
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
      monaco.editor.getModels()[0]?.updateOptions({ tabSize: 2 });
      onSave && editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, onSave); // eslint-disable-line no-bitwise
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
            <div className="ocs-yaml-editor__wrapper" ref={ref}>
              <MonacoEditor
                language={language ?? 'yaml'}
                theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
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
