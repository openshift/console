import * as React from 'react';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Tooltip,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { c_drawer_m_inline_m_panel_bottom__splitter_Height as pfSplitterHeight } from '@patternfly/react-tokens/dist/esm/c_drawer_m_inline_m_panel_bottom__splitter_Height';
import { useTranslation } from 'react-i18next';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { MinimizeRestoreButton } from '@console/webterminal-plugin/src/components/cloud-shell/MinimizeRestoreButton';
import { MultiTabbedTerminal } from '@console/webterminal-plugin/src/components/cloud-shell/MultiTabbedTerminal';

import './CloudShellDrawer.scss';

interface CloudShellDrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

const getMastheadHeight = (): number => {
  const masthead = document.getElementById('page-main-header');
  if (!masthead) return 0;
  const { height } = masthead.getBoundingClientRect();
  return height;
};

const HEADER_HEIGHT = `calc(${pfSplitterHeight.var} + var(--co-cloud-shell-header-height))`;

export const CloudShellDrawer: React.FCC<CloudShellDrawerProps> = ({
  open = true,
  onClose = () => undefined,
  children,
}) => {
  const [expanded, setExpanded] = React.useState<boolean>(true);
  const [height, setHeight] = React.useState<number>(385);
  const { t } = useTranslation('webterminal-plugin');
  const fireTelemetryEvent = useTelemetry();

  const onMRButtonClick = (expandedState: boolean) => {
    setExpanded(!expandedState);
    fireTelemetryEvent('Web Terminal Minimized', {
      minimized: expandedState,
    });
  };

  const panelContent = (
    <DrawerPanelContent
      className={css('co-cloud-shell-drawer__body', 'pf-v6-u-p-0', {
        'co-cloud-shell-drawer__body-collapsed': !expanded,
      })}
      isResizable
      onResize={(_, h) => {
        setExpanded(h > 47); // 47px is an arbitrary computed value of HEADER_HEIGHT.
        setHeight(h);
      }}
      defaultSize={expanded ? `${height}px` : '0px'}
      minSize={HEADER_HEIGHT}
      maxSize={`calc(100vh - ${getMastheadHeight()}px)`}
    >
      <DrawerHead className="co-cloud-shell-drawer__header pf-v6-u-p-0">
        <Flex grow={{ default: 'grow' }} data-test="cloudshell-drawer-header">
          <FlexItem className="pf-v6-u-px-sm">{t('OpenShift command line terminal')}</FlexItem>
          <FlexItem align={{ default: 'alignRight' }}>
            <DrawerActions className="pf-v6-u-m-0">
              <Tooltip content={t('Open terminal in new tab')}>
                <ExternalLinkButton
                  variant="plain"
                  href="/terminal"
                  aria-label={t('Open terminal in new tab')}
                  iconProps={{ title: undefined }} // aria-label is sufficient
                />
              </Tooltip>
              <MinimizeRestoreButton
                minimize={expanded}
                minimizeText={t('Minimize terminal')}
                restoreText={t('Restore terminal')}
                onClick={onMRButtonClick}
                // By design, PatternFly's drawers are full-height and non-resizable on < md viewports.
                // When the viewport shrinks to below md, the drawer's height is set to 100vh by PF.
                // We can't override this. The best we can do is hide the button.
                className="pf-v6-u-display-none pf-v6-u-display-block-on-md"
              />
              <Tooltip content={t('Close terminal')}>
                <DrawerCloseButton
                  aria-label={t('Close terminal')}
                  onClose={onClose}
                  data-test="cloudshell-drawer-close-button"
                />
              </Tooltip>
            </DrawerActions>
          </FlexItem>
        </Flex>
      </DrawerHead>
      <MultiTabbedTerminal onClose={onClose} />
    </DrawerPanelContent>
  );

  return (
    <Drawer isInline isExpanded={open} position="bottom" id="co-cloud-shell-drawer">
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
