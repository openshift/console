import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ModalErrorMessage, ModalSimpleMessage } from '../../modals/modal/modal-footer';

type VMEnvironmentFooterProps = {
  reload: () => void;
  save: (event: any) => Promise<void>;
  errorMsg: string;
  isSuccess: boolean;
  isSaveBtnDisabled: boolean;
  isReloadBtnDisabled?: boolean;
};

const VMEnvironmentFooter: React.FC<VMEnvironmentFooterProps> = ({
  reload,
  save,
  errorMsg,
  isSuccess,
  isSaveBtnDisabled,
  isReloadBtnDisabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <footer className="co-m-btn-bar">
      {errorMsg && <ModalErrorMessage message={errorMsg} />}
      {!errorMsg && isSuccess && <ModalSimpleMessage message="Success" variant="success" />}
      <ActionGroup className="pf-c-form">
        <Button isDisabled={isSaveBtnDisabled} type="submit" variant="primary" onClick={save}>
          {t('kubevirt-plugin~Save')}
        </Button>
        <Button isDisabled={isReloadBtnDisabled} type="button" variant="secondary" onClick={reload}>
          {t('kubevirt-plugin~Reload')}
        </Button>
      </ActionGroup>
    </footer>
  );
};

export default VMEnvironmentFooter;
