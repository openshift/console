import type { FC } from 'react';
import type { CodeEditorControlProps } from '@patternfly/react-code-editor';
import { CodeEditorControl } from '@patternfly/react-code-editor';
import { RhUiOpenDrawerRightIcon, RhUiOpenDrawerRightFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

interface ToggleSidebarButtonProps extends Partial<CodeEditorControlProps> {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  /** Adds a div with `flex-grow: 1` so that the button is aligned to the end of the toolbar */
  alignToEnd?: boolean;
}

export const ToggleSidebarButton: FC<ToggleSidebarButtonProps> = ({
  isSidebarOpen,
  toggleSidebar,
  alignToEnd = false,
  ...props
}) => {
  const { t } = useTranslation('console-shared');

  return (
    <>
      {alignToEnd && <div style={{ flexGrow: 1 }} />}
      <CodeEditorControl
        aria-label={isSidebarOpen ? t('Hide sidebar') : t('Show sidebar')}
        onClick={toggleSidebar}
        icon={isSidebarOpen ? <RhUiOpenDrawerRightFillIcon /> : <RhUiOpenDrawerRightIcon />}
        tooltipProps={{ content: isSidebarOpen ? t('Hide sidebar') : t('Show sidebar') }}
        {...props}
      />
    </>
  );
};
