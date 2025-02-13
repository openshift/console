import * as React from 'react';
import { EditorDidMount, Language } from '@patternfly/react-code-editor';
import classNames from 'classnames';
import type * as monaco from 'monaco-editor';
import { CodeEditorRef, CodeEditorProps } from '@console/dynamic-plugin-sdk';
import { ErrorBoundaryInline } from '@console/shared/src/components/error';
import { BasicCodeEditor } from './BasicCodeEditor';
import { CodeEditorToolbar } from './CodeEditorToolbar';
import { useShortcutLink } from './ShortcutsLink';
import { useConsoleMonacoTheme } from './theme';
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
  const [editorRef, setEditorRef] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const [monacoRef, setMonacoRef] = React.useState<typeof monaco | null>(null);
  const [usesValue] = React.useState<boolean>(value !== undefined);
  useConsoleMonacoTheme(monacoRef?.editor);

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

  const ToolbarLinks = React.useMemo(() => {
    // fixes PF bug where empty toolbar renders if a component is null
    if (!showShortcuts && !toolbarLinks?.length) return undefined;

    return <CodeEditorToolbar toolbarLinks={toolbarLinks} showShortcuts={showShortcuts} />;
  }, [toolbarLinks, showShortcuts]);

  return (
    <ErrorBoundaryInline>
      <BasicCodeEditor
        {...props}
        className={classNames('ocs-yaml-editor', props?.className)}
        language={language ?? Language.yaml}
        code={value}
        options={{ ...defaultEditorOptions, ...props?.options }}
        onEditorDidMount={editorDidMount}
        isFullHeight={props?.isFullHeight ?? true}
        style={{ ...props?.style, minHeight }}
        customControls={ToolbarLinks ?? undefined}
        shortcutsPopoverProps={showShortcuts ? shortcutPopover : undefined}
      />
    </ErrorBoundaryInline>
  );
});

export default CodeEditor;
