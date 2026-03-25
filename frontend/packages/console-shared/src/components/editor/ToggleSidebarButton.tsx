import type { FC } from 'react';
import type { CodeEditorControlProps } from '@patternfly/react-code-editor';
import { CodeEditorControl } from '@patternfly/react-code-editor';
import { createIcon } from '@patternfly/react-icons/dist/esm/createIcon';
import { useTranslation } from 'react-i18next';

export const SidebarOffIcon = createIcon({
  name: 'SidebarOffIcon',
  width: 512,
  height: 512,
  svgPath:
    'M463.98 31.958H48.02C21.5 31.958 0 53.458 0 79.98v352.042c0 26.52 21.5 48.02 48.02 48.02h415.96c26.52 0 48.02-21.5 48.02-48.02V79.979c0-26.52-21.5-48.02-48.02-48.02zm-239.938 384H64V96.042h159.958v320ZM448 315.398v100.56H288.042V96.042H448zm-29.867-78.473h-98.3a8.426 8.426 0 0 0-8.45 8.45v21.25a8.426 8.426 0 0 0 8.45 8.45h98.3a8.426 8.426 0 0 0 8.45-8.45v-21.25a8.426 8.426 0 0 0-8.45-8.45zm0-84.83h-98.3a8.426 8.426 0 0 0-8.45 8.449v21.25a8.426 8.426 0 0 0 8.45 8.45h98.3a8.426 8.426 0 0 0 8.45-8.45v-21.25a8.426 8.426 0 0 0-8.45-8.45zm0 169.662h-98.3a8.426 8.426 0 0 0-8.45 8.45v21.25a8.426 8.426 0 0 0 8.45 8.449h98.3a8.426 8.426 0 0 0 8.45-8.45v-21.25a8.426 8.426 0 0 0-8.45-8.45z',
});

export const SidebarOnIcon = createIcon({
  name: 'SidebarOnIcon',
  width: 512,
  height: 512,
  svgPath:
    'M463.98 31.958H48.02C21.5 31.958 0 53.458 0 79.98v352.042c0 26.52 21.5 48.02 48.02 48.02h415.96c26.52 0 48.02-21.5 48.02-48.02V79.979c0-26.52-21.5-48.02-48.02-48.02zm-239.938 384H64V96.042h159.958v320ZM448 315.398v100.56H288.042V96.042H448zM248.638 66.929v369.443h214.84V66.928Zm177.945 284.528a8.426 8.426 0 0 1-8.45 8.45h-98.3a8.426 8.426 0 0 1-8.45-8.45v-21.25a8.426 8.426 0 0 1 8.45-8.45h98.3a8.426 8.426 0 0 1 8.45 8.45zm0-84.831a8.426 8.426 0 0 1-8.45 8.45h-98.3a8.426 8.426 0 0 1-8.45-8.45v-21.25a8.426 8.426 0 0 1 8.45-8.45h98.3a8.426 8.426 0 0 1 8.45 8.45zm0-84.832a8.426 8.426 0 0 1-8.45 8.45h-98.3a8.426 8.426 0 0 1-8.45-8.45v-21.25a8.426 8.426 0 0 1 8.45-8.449h98.3a8.426 8.426 0 0 1 8.45 8.45z',
});

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
        icon={isSidebarOpen ? <SidebarOnIcon /> : <SidebarOffIcon />}
        tooltipProps={{ content: isSidebarOpen ? t('Hide sidebar') : t('Show sidebar') }}
        {...props}
      />
    </>
  );
};
