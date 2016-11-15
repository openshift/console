import React from 'react';

import {createModalLauncher} from '../factory/modal';

export const errorModal = createModalLauncher(
  ({error, cancel}) => {
    return (
      <div role="document">
        <div className="modal-header">
          <h1 className="modal-title">Error</h1>
        </div>
        <div className="modal-body">
          {error}
        </div>
        <div className="modal-footer">
          <button type="button" onClick={cancel} className="btn btn-default">OK</button>
        </div>
      </div>
    );
  }
);
