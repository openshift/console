import * as React from 'react';
import { CodeEditor as PfEditor, Language } from '@patternfly/react-code-editor';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useTranslation } from 'react-i18next';
import { CodeEditorRef, CodeEditorProps } from '@console/dynamic-plugin-sdk';
import CodeEditorToolbar from './CodeEditorToolbar';
import { useShortcutLink } from './ShortcutsLink';
import { useConsoleMonacoTheme } from './theme';
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
    isDownloadEnabled,
    isCopyEnabled,
    isLanguageLabelVisible,
  } = props;
  const { t } = useTranslation('console-shared');
  const shortcutPopover = useShortcutLink();
  const [editorRef, setEditorRef] = React.useState<Monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const [monacoRef, setMonacoRef] = React.useState<typeof Monaco | null>(null);
  useConsoleMonacoTheme(monacoRef?.editor);

  const [usesValue] = React.useState<boolean>(value !== undefined);
  const editorDidMount = React.useCallback(
    (editor, monaco) => {
      setEditorRef(editor);
      setMonacoRef(monaco);
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
      automaticLayout: true,
    };
  }, [options, showMiniMap]);

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
    <PfEditor
      className="ocs-yaml-editor"
      language={language ?? Language.yaml}
      code={value}
      options={editorOptions}
      onEditorDidMount={editorDidMount}
      onChange={onChange}
      isFullHeight
      style={{ minHeight }}
      customControls={ToolbarLinks ?? undefined}
      shortcutsPopoverProps={showShortcuts ? shortcutPopover : undefined}
      shortcutsPopoverButtonText={t('View shortcuts')}
      isCopyEnabled={isCopyEnabled}
      copyButtonAriaLabel={t('Copy code to clipboard')}
      copyButtonSuccessTooltipText={t('Content copied to clipboard')}
      copyButtonToolTipText={t('Copy code to clipboard')}
      isDownloadEnabled={isDownloadEnabled}
      downloadButtonAriaLabel={t('Download code')}
      downloadButtonToolTipText={t('Download code')}
      isLanguageLabelVisible={isLanguageLabelVisible}
    />
  );
});

export default CodeEditor;
