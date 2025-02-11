import * as React from 'react';
import { loader, Monaco } from '@monaco-editor/react';
import { CodeEditor as PfEditor } from '@patternfly/react-code-editor';
import * as monaco from 'monaco-editor';
import { useTranslation } from 'react-i18next';
import { BaseCodeEditorProps } from '@console/dynamic-plugin-sdk';
import { useConsoleMonacoTheme } from './theme';

// Avoid using monaco from CDN
loader.config({ monaco });

/**
 * PatternFly CodeEditor with i18n and theme applied. Does not include
 * YAML language integration or console-specific CSS.
 *
 * Note that it is important that this is the only component that imports
 * monaco-editor, to avoid fetching files from a 3rd-party CDN.
 */
export const BasicCodeEditor: React.FC<BaseCodeEditorProps> = (props) => {
  const { t } = useTranslation('console-shared');
  const [monacoRef, setMonacoRef] = React.useState<Monaco | null>(null);
  useConsoleMonacoTheme(monacoRef?.editor);

  return (
    <PfEditor
      {...props}
      editorProps={{
        ...props?.editorProps,
        beforeMount: (monacoInstance) => {
          setMonacoRef(monacoInstance);
          props?.editorProps?.beforeMount?.(monacoInstance);
        },
      }}
      shortcutsPopoverButtonText={t('Shortcuts')}
      copyButtonAriaLabel={t('Copy code to clipboard')}
      copyButtonSuccessTooltipText={t('Content copied to clipboard')}
      copyButtonToolTipText={t('Copy code to clipboard')}
      downloadButtonAriaLabel={t('Download code')}
      downloadButtonToolTipText={t('Download code')}
    />
  );
};
