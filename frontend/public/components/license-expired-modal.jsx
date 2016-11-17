import React from 'react';
import moment from 'moment';

import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from './factory/modal';

export const licenseExpiredModal = createModalLauncher(
  ({expiration, close}) => <div className="co-p-license-expired">
    <ModalTitle>Tectonic License Expired</ModalTitle>
    <ModalBody>
      <p>The Tectonic license expired on <span>{moment(expiration).format('LL')}</span>.</p>
      <p>Update your license to continue using your cluster.</p>
    </ModalBody>
    <ModalFooter>
      <button type="submit" onClick={close} className="btn btn-primary">Close</button>
      <a href="https://account.tectonic.com" className="btn btn-link">View Tectonic Account</a>
    </ModalFooter>
  </div>
);
