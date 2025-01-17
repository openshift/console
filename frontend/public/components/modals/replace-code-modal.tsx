import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';

export const ReplaceCodeModal = ({ handleCodeReplace }) => {
  const { t } = useTranslation();

  return (
    <Modal
      variant={ModalVariant.small}
      titleIconVariant="warning"
      title={t('Replace current content?')}
      isOpen={true}
      showClose={false}
      actions={[
        <Button
          key="yes"
          id="confirm-replace"
          data-test="confirm-replace"
          variant="primary"
          onClick={handleCodeReplace}
        >
          {t('Yes')}
        </Button>,
        <Button
          key="no"
          id="cancel-replace"
          data-test="cancel-replace"
          variant="secondary"
          onClick={handleCodeReplace}
        >
          {t('No')}
        </Button>,
        <Button
          key="both"
          id="keep-both"
          data-test="keep-both"
          variant="tertiary"
          onClick={handleCodeReplace}
        >
          {t('Keep both')}
        </Button>,
      ]}
    >
      {t('Existing content will be replaced. Do you want to continue?')}
    </Modal>
  );
};

export default ReplaceCodeModal;
