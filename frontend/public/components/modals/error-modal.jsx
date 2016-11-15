import React from 'react';

import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';

export const errorModal = createModalLauncher(
  ({error, cancel}) => {
    return (
      <div role="document">
        <ModalTitle>Error</ModalTitle>
        <ModalBody>{error}</ModalBody>
        <ModalFooter><button type="button" onClick={cancel} className="btn btn-default">OK</button></ModalFooter>
      </div>
    );
  }
);
