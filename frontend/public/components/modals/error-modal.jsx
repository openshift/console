import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';

import { createModalLauncher, ModalTitle, ModalBody, ModalFooter } from '../factory/modal';

export const ModalErrorContent = ({ error, title = 'Error', cancel = undefined }) => (
  <div className="modal-content">
    <ModalTitle>{title}</ModalTitle>
    <ModalBody>{error}</ModalBody>
    <ModalFooter inProgress={false} errorMessage="">
      <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
        <Button type="button" variant="secondary" onClick={cancel}>
          OK
        </Button>
      </ActionGroup>
    </ModalFooter>
  </div>
);

export const errorModal = createModalLauncher(ModalErrorContent);
