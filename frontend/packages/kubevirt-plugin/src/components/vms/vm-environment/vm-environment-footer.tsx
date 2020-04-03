import * as React from 'react';
import { Button, ActionGroup } from '@patternfly/react-core';
import { ModalErrorMessage, ModalSimpleMessage } from '../../modals/modal/modal-footer';

export const VMEnvironmentFooter: React.FC<VMEnvironmentFooterProps> = ({
  reload,
  save,
  errorMsg,
  isSuccess,
}) => {
  return (
    <footer className="co-m-btn-bar">
      {errorMsg && <ModalErrorMessage message={errorMsg} />}
      {!errorMsg && isSuccess && <ModalSimpleMessage message="Success" variant="success" />}
      <ActionGroup className="pf-c-form">
        <Button isDisabled={false} type="submit" variant="primary" onClick={save}>
          Save
        </Button>
        <Button isDisabled={false} type="button" variant="secondary" onClick={reload}>
          Reload
        </Button>
      </ActionGroup>
    </footer>
  );
};

type VMEnvironmentFooterProps = {
  reload: () => void;
  save: (event: any) => Promise<void>;
  errorMsg: string;
  isSuccess: boolean;
};
