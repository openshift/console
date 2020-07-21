import * as React from 'react';
import {
  Drawer,
  DrawerPanelContent,
  DrawerContent,
  DrawerPanelBody,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DrawerContentBody,
  Title,
} from '@patternfly/react-core';
import { QuickStartItem, QuickStartState } from './utils/quick-start-typings';
import './QuickStartDrawer.scss';

type QuickStartDrawerComponentProps = {
  quickStart: QuickStartItem;
  quickStartState?: QuickStartState;
  expanded: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  additionalHeaderContent?: React.ReactElement;
};

const QuickStartDrawerComponent: React.FC<QuickStartDrawerComponentProps> = ({
  expanded,
  quickStart,
  onClose,
  children,
  additionalHeaderContent,
}) => {
  const { name, duration } = quickStart ?? {};
  const panelContent = (
    <DrawerPanelContent>
      <DrawerHead>
        <div>
          <Title headingLevel="h1" size="xl" className="co-quick-start-drawer__title">
            {name}
          </Title>
          <Title
            headingLevel="h6"
            size="md"
            className="text-secondary "
            style={{ display: 'inline-block' }}
          >
            {`${duration} minutes`}
          </Title>
        </div>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
        {additionalHeaderContent}
      </DrawerHead>
      <DrawerPanelBody>Test Sidebar</DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer isExpanded={expanded} isInline>
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody style={{ zIndex: 0 }}>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickStartDrawerComponent;
