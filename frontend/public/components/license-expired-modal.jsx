import React from 'react';
import moment from 'moment';

import {createModalLauncher} from './factory/modal';

export const licenseExpiredModal = createModalLauncher(
  ({expiration, close}) => <div className="co-p-license-expired">
    <div className="modal-header">
      <h4 className="modal-title">Tectonic License Expired</h4>
    </div>
    <div className="modal-body">
      <p>The Tectonic license expired on <span>{moment(expiration).format('LL')}</span>.</p>
      <p>Update your license to continue using your cluster.</p>
    </div>
    <div className="modal-footer">
      <button type="submit" onClick={close} className="btn btn-primary">Close</button>
      <a href="https://account.tectonic.com" className="btn btn-link">View Tectonic Account</a>
    </div>
  </div>
);
