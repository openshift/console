import * as React from 'react';

import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';

export const errorModal = createModalLauncher(
  ({error, cancel}) => {
    return (
      <div>
        <ModalTitle>Error</ModalTitle>
        <ModalBody>{error}</ModalBody>
        <ModalFooter inProgress={false} errorMessage=""><button type="button" onClick={(e) => cancel(e)} className="btn btn-default">OK</button></ModalFooter>
      </div>
    );
  }
);
