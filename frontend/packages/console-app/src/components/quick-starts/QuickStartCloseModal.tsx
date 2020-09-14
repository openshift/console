import * as React from 'react';
import { Modal } from '@console/shared/';
import { ModalVariant, Flex, FlexItem, Button } from '@patternfly/react-core';

type QuickStartCloseModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const QuickStartCloseModal: React.FC<QuickStartCloseModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => (
  <Modal
    className="co-quick-start-drawer__modal"
    isOpen={isOpen}
    variant={ModalVariant.small}
    showClose={false}
    title="Are you sure you want to leave the tour?"
    footer={
      <Flex>
        <FlexItem align={{ default: 'alignRight' }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </FlexItem>
        <FlexItem>
          <Button variant="primary" onClick={onConfirm}>
            Leave
          </Button>
        </FlexItem>
      </Flex>
    }
    isFullScreen
  >
    {"Any progress you've made will be saved."}
  </Modal>
);

export default QuickStartCloseModal;
