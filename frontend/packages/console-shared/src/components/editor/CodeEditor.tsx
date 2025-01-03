import * as React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import Measure from 'react-measure';
import { CodeEditorRef, CodeEditorProps } from '@console/dynamic-plugin-sdk';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import CodeEditorToolbar from './CodeEditorToolbar';
import { registerYAMLinMonaco, defaultEditorOptions } from './yaml-editor-utils';
import './CodeEditor.scss';

const CodeEditor = React.forwardRef<CodeEditorRef, CodeEditorProps>((props, ref) => {
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
    onEditorDidMount,
  } = props;

  const theme = React.useContext(ThemeContext);
  const [editorRef, setEditorRef] = React.useState<editor.IStandaloneCodeEditor | null>(null);
  const [usesValue] = React.useState<boolean>(value !== undefined);
  const editorDidMount: OnMount = React.useCallback(
    (editor, monaco) => {
      setEditorRef(editor);
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
      onEditorDidMount && onEditorDidMount(editor);
    },
    [onSave, usesValue, onEditorDidMount],
  );

  const editorOptions = React.useMemo(() => {
    return {
      ...options,
      minimap: {
        enabled: showMiniMap,
      },
    };
  }, [options, showMiniMap]);

  // expose the editor instance to the parent component via ref
  React.useImperativeHandle(
    ref,
    () => ({
      getEditor: () => editorRef,
    }),
    [editorRef],
  );

  return (
    <>
      <CodeEditorToolbar showShortcuts={showShortcuts} toolbarLinks={toolbarLinks} />
      <Measure bounds>
        {({ measureRef, contentRect }) => (
          <div ref={measureRef} className="ocs-yaml-editor__root" style={{ minHeight }}>
            <Editor
              language={language ?? 'yaml'}
              height={contentRect.bounds.height}
              width={contentRect.bounds.width}
              value={value}
              options={editorOptions}
              onMount={editorDidMount}
              onChange={onChange}
              className="ocs-yaml-editor"
            />
          </div>
        )}
      </Measure>
    </>
  );
});

export default CodeEditor;
