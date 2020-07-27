import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
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
import { RootState } from '@console/internal/redux';
import { getActiveQuickStartID } from '../../redux/reducers/quick-start-reducer';
import { setActiveQuickStart } from '../../redux/actions/quick-start-actions';
import { getQuickStart } from './utils/quick-start-utils';

import './QuickStartDrawer.scss';
import QuickStartController from './QuickStartController';

type StateProps = {
  activeQuickStartID: string;
};

type DispatchProps = {
  onClose: () => void;
};

type QuickStartDrawerProps = StateProps & DispatchProps;

const QuickStartDrawer: React.FC<QuickStartDrawerProps> = ({
  children,
  activeQuickStartID,
  onClose,
}) => {
  const quickStart = getQuickStart(activeQuickStartID);

  const panelContent = (
    <DrawerPanelContent>
      <DrawerHead>
        <div className="co-quick-start-drawer__title">
          <Title headingLevel="h1" size="xl">
            {quickStart?.name}
          </Title>
          <Title
            headingLevel="h6"
            size="md"
            className="text-secondary"
            style={{ marginLeft: 'var(--pf-global--spacer--md)' }}
          >
            {`${quickStart?.duration} minutes`}
          </Title>
        </div>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <QuickStartController quickStart={quickStart} />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer isExpanded={!!activeQuickStartID} isInline>
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody style={{ zIndex: 0 }}>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartID: getActiveQuickStartID(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClose: () => dispatch(setActiveQuickStart('')),
});

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartDrawer);
