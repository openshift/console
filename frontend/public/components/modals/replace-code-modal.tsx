import { useTranslation } from 'react-i18next';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

export const ReplaceCodeModal = ({ handleCodeReplace }) => {
  const { t } = useTranslation();

  return (
    <Modal variant={ModalVariant.small} isOpen onClose={handleCodeReplace}>
      <ModalHeader title={t('Replace current content?')} titleIconVariant="warning" />
      <ModalBody>{t('Existing content will be replaced. Do you want to continue?')}</ModalBody>
      <ModalFooter>
        <Button
          key="yes"
          id="confirm-replace"
          data-test="confirm-replace"
          variant="primary"
          type="button"
          onClick={handleCodeReplace}
        >
          {t('Yes')}
        </Button>
        <Button
          key="no"
          id="cancel-replace"
          data-test="cancel-replace"
          variant="secondary"
          type="button"
          onClick={handleCodeReplace}
        >
          {t('No')}
        </Button>
        <Button
          key="both"
          id="keep-both"
          data-test="keep-both"
          variant="tertiary"
          type="button"
          onClick={handleCodeReplace}
        >
          {t('Keep both')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ReplaceCodeModal;
