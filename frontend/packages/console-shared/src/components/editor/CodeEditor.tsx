import { forwardRef, useState, useCallback, useImperativeHandle, useMemo, useEffect } from 'react';
import type { EditorDidMount } from '@patternfly/react-code-editor';
import { Language } from '@patternfly/react-code-editor';
import { getResizeObserver } from '@patternfly/react-core';
import type { CodeEditorRef, CodeEditorProps } from '@console/dynamic-plugin-sdk';
import { BasicCodeEditor } from './BasicCodeEditor';
import { CodeEditorToolbar } from './CodeEditorToolbar';
import { useShortcutPopover } from './ShortcutsPopover';
import {
  registerYAMLinMonaco,
  registerAutoFold,
  defaultEditorOptions,
  getConsoleYamlSchemas,
} from './yaml-editor-utils';
import './CodeEditor.scss';

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>((props, ref) => {
  const { value, minHeight, showShortcuts, toolbarLinks, onSave, onEditorDidMount } = props;

  const [editorRef, setEditorRef] = useState<CodeEditorRef['editor'] | null>(null);
  const [monacoRef, setMonacoRef] = useState<CodeEditorRef['monaco'] | null>(null);
  const [monacoYAML, setMonacoYAML] = useState<ReturnType<typeof registerYAMLinMonaco> | null>(
    null,
  );
  const [usesValue] = useState<boolean>(value !== undefined);

  const shortcutPopover = useShortcutPopover(props.shortcutsPopoverProps);

  const editorDidMount: EditorDidMount = useCallback(
    (editor, monaco) => {
      setEditorRef(editor);
      setMonacoRef(monaco);
      editor.getModel()?.updateOptions({ tabSize: 2 });
      const currentLanguage = editor.getModel()?.getLanguageId();
      editor.layout();
      editor.focus();
      switch (currentLanguage) {
        case 'yaml':
          setMonacoYAML(registerYAMLinMonaco(monaco));
          registerAutoFold(editor, usesValue);
          break;
        case 'json':
          editor.getAction('editor.action.formatDocument').run();
          break;
        default:
          break;
      }
      onSave && editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, onSave); // eslint-disable-line no-bitwise
      onEditorDidMount && onEditorDidMount(editor, monaco);
    },
    [onSave, usesValue, onEditorDidMount],
  );

  // keep swagger definitions up to date with what we currently have
  const updateSwaggerDefinitions = useCallback(() => {
    if (monacoYAML) {
      const schemas = getConsoleYamlSchemas();
      monacoYAML.update({ schemas });
    }
  }, [monacoYAML]);

  useEffect(() => {
    updateSwaggerDefinitions(); // ensure our swag stays fresh on mount

    window.addEventListener('console_swagger_refresh', updateSwaggerDefinitions);
    return () => {
      window.removeEventListener('console_swagger_refresh', updateSwaggerDefinitions);
    };
  }, [updateSwaggerDefinitions]);

  // expose the editor instance to the parent component via ref
  useImperativeHandle(
    ref,
    () => ({
      editor: editorRef,
      monaco: monacoRef,
    }),
    [editorRef, monacoRef],
  );

  // do not render toolbar if the component is null
  const ToolbarLinks = useMemo(() => {
    return showShortcuts || toolbarLinks?.length ? (
      <CodeEditorToolbar toolbarLinks={toolbarLinks} />
    ) : undefined;
  }, [toolbarLinks, showShortcuts]);

  // recalculate bounds when viewport is changed
  const handleResize = useCallback(() => {
    monacoRef?.editor?.getEditors()?.forEach((editor) => {
      editor.layout({ width: 0, height: 0 });
      editor.layout();
    });
  }, [monacoRef]);

  useEffect(() => {
    const observer = getResizeObserver(undefined, handleResize, true);
    return () => observer();
  }, [handleResize]);

  useEffect(() => {
    handleResize();
  }, [handleResize, minHeight, ToolbarLinks]);

  return (
    <div style={{ minHeight }} className="ocs-yaml-editor">
      <BasicCodeEditor
        {...props}
        language={props.language ?? Language.yaml}
        code={value}
        options={{ ...defaultEditorOptions, ...props.options }}
        onEditorDidMount={editorDidMount}
        isFullHeight={props.isFullHeight ?? true}
        customControls={ToolbarLinks ?? undefined}
        shortcutsPopoverProps={showShortcuts ? shortcutPopover : undefined}
      />
    </div>
  );
});
