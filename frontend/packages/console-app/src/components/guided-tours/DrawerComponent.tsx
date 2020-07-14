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
import { GuidedTourItem, GuidedTourState } from './utils/guided-tour-typings';
import './GuidedTourDrawer.scss';

type DrawerComponentProps = {
  guidedTour: GuidedTourItem;
  guidedTourState?: GuidedTourState;
  expanded: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  additionalHeaderContent?: React.ReactElement;
};

const DrawerComponent: React.FC<DrawerComponentProps> = ({
  expanded,
  guidedTour,
  onClose,
  children,
  additionalHeaderContent,
}) => {
  const { name, duration } = guidedTour ?? {};
  const panelContent = (
    <DrawerPanelContent>
      <DrawerHead>
        <div>
          <Title headingLevel="h1" size="xl" className="co-guided-tour-drawer__title">
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

export default DrawerComponent;
