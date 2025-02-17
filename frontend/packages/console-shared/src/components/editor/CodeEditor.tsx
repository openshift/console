import * as React from 'react';
import { EditorDidMount, Language } from '@patternfly/react-code-editor';
import { getResizeObserver } from '@patternfly/react-core';
import { CodeEditorRef, CodeEditorProps } from '@console/dynamic-plugin-sdk';
import { BasicCodeEditor } from './BasicCodeEditor';
import { CodeEditorToolbar } from './CodeEditorToolbar';
import { useShortcutLink } from './ShortcutsLink';
import { registerYAMLinMonaco, registerAutoFold, defaultEditorOptions } from './yaml-editor-utils';
import './CodeEditor.scss';

const CodeEditor = React.forwardRef<CodeEditorRef, CodeEditorProps>((props, ref) => {
  const {
    value,
    minHeight,
    showShortcuts,
    toolbarLinks,
    onSave,
    language,
    onEditorDidMount,
  } = props;
  const shortcutPopover = useShortcutLink();
  const [editorRef, setEditorRef] = React.useState<CodeEditorRef['editor'] | null>(null);
  const [monacoRef, setMonacoRef] = React.useState<CodeEditorRef['monaco'] | null>(null);
  const [usesValue] = React.useState<boolean>(value !== undefined);

  const editorDidMount: EditorDidMount = React.useCallback(
    (mountedEditor, mountedMonaco) => {
      setEditorRef(mountedEditor);
      setMonacoRef(mountedMonaco);
      mountedEditor.getModel()?.updateOptions({ tabSize: 2 });
      const currentLanguage = mountedEditor.getModel()?.getLanguageId();
      mountedEditor.layout();
      mountedEditor.focus();
      switch (currentLanguage) {
        case 'yaml':
          registerYAMLinMonaco(mountedMonaco);
          registerAutoFold(mountedEditor, usesValue);
          break;
        case 'json':
          mountedEditor.getAction('editor.action.formatDocument').run();
          break;
        default:
          break;
      }
      onSave &&
        mountedEditor.addCommand(mountedMonaco.KeyMod.CtrlCmd | mountedMonaco.KeyCode.KeyS, onSave); // eslint-disable-line no-bitwise
      onEditorDidMount && onEditorDidMount(mountedEditor, mountedMonaco);
    },
    [onSave, usesValue, onEditorDidMount],
  );

  // expose the editor instance to the parent component via ref
  React.useImperativeHandle(
    ref,
    () => ({
      editor: editorRef,
      monaco: monacoRef,
    }),
    [editorRef, monacoRef],
  );

  // do not render toolbar if the component is null
  const ToolbarLinks = React.useMemo(() => {
    if (!showShortcuts && !toolbarLinks?.length) return undefined;
    return <CodeEditorToolbar toolbarLinks={toolbarLinks} showShortcuts={showShortcuts} />;
  }, [toolbarLinks, showShortcuts]);

  // recalculate bounds when viewport is changed
  const handleResize = React.useCallback(() => {
    monacoRef?.editor?.getEditors()?.forEach((editor) => {
      editor.layout({ width: 0, height: 0 });
      editor.layout();
    });
  }, [monacoRef]);

  React.useEffect(() => {
    const observer = getResizeObserver(undefined, handleResize, true);
    return () => observer();
  }, [handleResize]);

  React.useEffect(() => {
    handleResize();
  }, [handleResize, minHeight, ToolbarLinks]);

  return (
    <div style={{ minHeight }} className="ocs-yaml-editor">
      <BasicCodeEditor
        {...props}
        language={language ?? Language.yaml}
        code={value}
        options={{ ...defaultEditorOptions, ...props?.options }}
        onEditorDidMount={editorDidMount}
        isFullHeight={props?.isFullHeight ?? true}
        style={{ ...props?.style, minHeight }}
        customControls={ToolbarLinks ?? undefined}
        shortcutsPopoverProps={showShortcuts ? shortcutPopover : undefined}
      />
    </div>
  );
});

export default CodeEditor;
