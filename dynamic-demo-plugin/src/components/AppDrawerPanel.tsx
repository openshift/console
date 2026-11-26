import type { FC } from 'react';
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  Title,
} from '@patternfly/react-core';
import type { AppDrawerPanelProps } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';

export const DEMO_APP_DRAWER_ID = 'console-demo-plugin-drawer';

export const DemoAppDrawerPanel: FC<AppDrawerPanelProps> = ({ onClose }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return (
    <div data-test="demo-app-drawer-panel">
      <DrawerHead>
        <Title headingLevel="h2">{t('Demo app drawer')}</Title>
        <DrawerActions>
          <DrawerCloseButton aria-label={t('Close demo app drawer')} onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>{t('This side panel is contributed by the demo plugin.')}</DrawerPanelBody>
    </div>
  );
};
