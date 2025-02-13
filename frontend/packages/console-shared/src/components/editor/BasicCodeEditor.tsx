import * as React from 'react';
import { loader, Monaco } from '@monaco-editor/react';
import { CodeEditor } from '@patternfly/react-code-editor';
import { getResizeObserver } from '@patternfly/react-core';
import classNames from 'classnames';
import * as monaco from 'monaco-editor';
import { useTranslation } from 'react-i18next';
import { BasicCodeEditorProps } from '@console/dynamic-plugin-sdk';
import { useConsoleMonacoTheme } from './theme';
import './BasicCodeEditor.scss';

// Avoid using monaco from CDN
loader.config({ monaco });

/**
 * PatternFly CodeEditor with i18n and theme applied. Does not include
 * YAML language integration or console-specific CSS.
 *
 * Note that it is important that this is the only component that imports
 * monaco-editor, to avoid fetching files from a 3rd-party CDN.
 */
export const BasicCodeEditor: React.FC<BasicCodeEditorProps> = (props) => {
  const { t } = useTranslation('console-shared');
  const [monacoRef, setMonacoRef] = React.useState<Monaco | null>(null);
  useConsoleMonacoTheme(monacoRef?.editor);

  // TODO(PF6): remove this when https://github.com/patternfly/patternfly-react/issues/11531 is fixed
  const handleResize = React.useCallback(() => {
    monacoRef?.editor?.getEditors()?.forEach((editor) => {
      editor.layout({ width: 0, height: 0 });
      editor.layout();
    });
  }, [monacoRef]);

  React.useEffect(() => {
    const observer = getResizeObserver(undefined, handleResize, true);

    return () => {
      observer();
    };
  }, [handleResize]);

  return (
    <CodeEditor
      copyButtonAriaLabel={t('Copy code to clipboard')}
      copyButtonSuccessTooltipText={t('Content copied to clipboard')}
      copyButtonToolTipText={t('Copy code to clipboard')}
      downloadButtonAriaLabel={t('Download code')}
      downloadButtonToolTipText={t('Download code')}
      shortcutsPopoverButtonText={t('Shortcuts')}
      uploadButtonAriaLabel={t('Upload code')}
      uploadButtonToolTipText={t('Upload code')}
      emptyStateBody={t('Drag and drop a file or upload one.')}
      emptyStateButton={t('Browse')}
      emptyStateLink={t('Start from scratch')}
      emptyStateTitle={t('Start editing')}
      {...props}
      className={classNames('co-code-editor', props.className)}
      editorProps={{
        ...props?.editorProps,
        beforeMount: (monacoInstance) => {
          setMonacoRef(monacoInstance);
          window.monaco = monacoInstance; // for e2e tests
          props?.editorProps?.beforeMount?.(monacoInstance);
        },
      }}
    />
  );
};
