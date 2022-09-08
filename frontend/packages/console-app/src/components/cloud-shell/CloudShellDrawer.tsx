import * as React from 'react';
import { Tooltip, Flex, FlexItem, Button } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import CloseButton from '@console/shared/src/components/close-button';
import Drawer from '@console/shared/src/components/drawer/Drawer';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import MinimizeRestoreButton from './MinimizeRestoreButton';

import './CloudShellDrawer.scss';

type CloudShellDrawerProps = {
  onClose: () => void;
};

const getMastheadHeight = (): number => {
  const masthead = document.getElementById('page-main-header');
  if (!masthead) return 0;
  const { height } = masthead.getBoundingClientRect();
  return height;
};

const CloudShellDrawer: React.FC<CloudShellDrawerProps> = ({ children, onClose }) => {
  const [expanded, setExpanded] = React.useState<boolean>(true);
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  const onMRButtonClick = (expandedState: boolean) => {
    setExpanded(!expandedState);
    fireTelemetryEvent('Web Terminal Minimized', {
      minimized: expandedState,
    });
  };
  const handleChange = (openState: boolean) => {
    setExpanded(openState);
  };
  const header = (
    <Flex style={{ flexGrow: 1 }} data-test="cloudshell-drawer-header">
      <FlexItem className="co-cloud-shell-drawer__heading">
        {t('console-app~OpenShift command line terminal')}
      </FlexItem>
      <FlexItem align={{ default: 'alignRight' }}>
        <Tooltip content={t('console-app~Open terminal in new tab')}>
          <Button
            variant="plain"
            component="a"
            href="/terminal"
            target="_blank"
            aria-label={t('console-app~Open terminal in new tab')}
          >
            <ExternalLinkAltIcon />
          </Button>
        </Tooltip>
        <MinimizeRestoreButton
          minimize={expanded}
          minimizeText={t('console-app~Minimize terminal')}
          restoreText={t('console-app~Restore terminal')}
          onClick={onMRButtonClick}
        />
        <Tooltip content={t('console-app~Close terminal')}>
          <CloseButton
            ariaLabel={t('console-app~Close terminal')}
            onClick={onClose}
            data-test="cloudshell-drawer-close-button"
          />
        </Tooltip>
      </FlexItem>
    </Flex>
  );
  return (
    <Drawer
      open={expanded}
      defaultHeight={365}
      header={header}
      maxHeight={`calc(100vh - ${getMastheadHeight()}px)`}
      onChange={handleChange}
      resizable
    >
      <div className="co-cloud-shell-drawer__body">{children}</div>
    </Drawer>
  );
};

export default CloudShellDrawer;
