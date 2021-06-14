import * as React from 'react';
import { ModalVariant, Flex, FlexItem, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Modal } from '@console/shared/';

type QuickStartCloseModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const QuickStartCloseModal: React.FC<QuickStartCloseModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      className="co-quick-start-drawer__modal"
      isOpen={isOpen}
      variant={ModalVariant.small}
      showClose={false}
      title={t('quickstart~Leave quick start?')}
      footer={
        <Flex>
          <FlexItem align={{ default: 'alignRight' }}>
            <Button variant="secondary" onClick={onCancel}>
              {t('quickstart~Cancel')}
            </Button>
          </FlexItem>
          <FlexItem>
            <Button variant="primary" onClick={onConfirm}>
              {t('quickstart~Leave')}
            </Button>
          </FlexItem>
        </Flex>
      }
      isFullScreen
    >
      {t('quickstart~Your progress will be saved.')}
    </Modal>
  );
};

export default QuickStartCloseModal;
