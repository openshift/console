import { FC, useContext } from 'react';
import { loader } from '@monaco-editor/react';
import { CodeEditor } from '@patternfly/react-code-editor';
import { css } from '@patternfly/react-styles';
import * as monaco from 'monaco-editor';
import { useTranslation } from 'react-i18next';
import { BasicCodeEditorProps } from '@console/dynamic-plugin-sdk';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import { ErrorBoundaryInline } from '@console/shared/src/components/error';
import { defineThemes } from './theme';
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
export const BasicCodeEditor: FC<BasicCodeEditorProps> = (props) => {
  const { t } = useTranslation('console-shared');
  const theme = useContext(ThemeContext);

  return (
    <ErrorBoundaryInline>
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
        className={css('co-code-editor', props.className)}
        editorProps={{
          theme: `console-${theme}`,
          ...props?.editorProps,
          beforeMount: (monacoInstance) => {
            defineThemes(monacoInstance?.editor);
            window.monaco = monacoInstance; // for e2e tests
            props?.editorProps?.beforeMount?.(monacoInstance);
          },
        }}
        options={{
          fontFamily: 'var(--pf-t--global--font--family--mono)',
          ...props?.options,
        }}
      />
    </ErrorBoundaryInline>
  );
};
