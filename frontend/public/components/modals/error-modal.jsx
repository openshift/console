import * as React from 'react';

import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';

export const ModalErrorContent = ({ error, title = 'Error', cancel }) => (
  <div className="modal-content">
    <ModalTitle>{title}</ModalTitle>
    <ModalBody>{error}</ModalBody>
    <ModalFooter inProgress={false} errorMessage="">
      <button type="button" onClick={cancel} className="btn btn-default">OK</button>
    </ModalFooter>
  </div>);

export const errorModal = createModalLauncher(ModalErrorContent);
