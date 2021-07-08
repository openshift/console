import * as React from 'react';
import { Drawer, DrawerContent, DrawerContentBody } from '@patternfly/react-core';
import QuickStartsLoader from './loader/QuickStartsLoader';
import QuickStartCloseModal from './QuickStartCloseModal';
import QuickStartPanelContent from './QuickStartPanelContent';
import { QuickStartContext, QuickStartContextValues } from './utils/quick-start-context';
import { QuickStartStatus } from './utils/quick-start-types';
import './QuickStartDrawer.scss';

const QuickStartDrawer: React.FC = ({ children }) => {
  const { activeQuickStartID, activeQuickStartState, setActiveQuickStart } = React.useContext<
    QuickStartContextValues
  >(QuickStartContext);
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const activeQuickStartStatus = activeQuickStartState?.status;
  const onClose = () => setActiveQuickStart('');
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

export default QuickStartDrawer;
