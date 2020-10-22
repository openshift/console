import * as React from 'react';

import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { Drawer, DrawerContent, DrawerContentBody } from '@patternfly/react-core';
import { RootState } from '@console/internal/redux';
import {
  getActiveQuickStartID,
  getActiveQuickStartStatus,
} from '../../redux/reducers/quick-start-reducer';
import { setActiveQuickStart } from '../../redux/actions/quick-start-actions';
import { QuickStartStatus } from './utils/quick-start-types';
import QuickStartPanelContent from './QuickStartPanelContent';
import QuickStartCloseModal from './QuickStartCloseModal';
import QuickStartsLoader from './loader/QuickStartsLoader';
import './QuickStartDrawer.scss';

type StateProps = {
  activeQuickStartID: string;
  activeQuickStartStatus: QuickStartStatus;
};

type DispatchProps = {
  onClose: () => void;
};

type QuickStartDrawerProps = StateProps & DispatchProps;

const QuickStartDrawer: React.FC<QuickStartDrawerProps> = ({
  children,
  activeQuickStartID,
  activeQuickStartStatus,
  onClose,
}) => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);

  const handleClose = () => {
    if (activeQuickStartStatus === QuickStartStatus.IN_PROGRESS) {
      setModalOpen(true);
    } else {
      onClose();
    }
  };

  const onModalConfirm = () => {
    setModalOpen(false);
    onClose();
  };

  const onModalCancel = () => setModalOpen(false);

  const panelContent = (
    <QuickStartsLoader>
      {(quickStarts) => (
        <QuickStartPanelContent
          quickStarts={quickStarts}
          handleClose={handleClose}
          activeQuickStartID={activeQuickStartID}
        />
      )}
    </QuickStartsLoader>
  );

  return (
    <>
      <Drawer isExpanded={!!activeQuickStartID} isInline>
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody className="co-quick-start-drawer__body">{children}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
      <QuickStartCloseModal
        isOpen={modalOpen}
        onConfirm={onModalConfirm}
        onCancel={onModalCancel}
      />
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartID: getActiveQuickStartID(state),
  activeQuickStartStatus: getActiveQuickStartStatus(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onClose: () => dispatch(setActiveQuickStart('')),
});

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartDrawer);
