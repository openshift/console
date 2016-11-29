import React from 'react';
import moment from 'moment';

import {updateLicenseModal} from './modals/update-license-modal';
import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from './factory/modal';

const ExpiredModal = ({expiration, children}) => <div className="co-p-license-expired">
  <ModalTitle>Tectonic License Expired</ModalTitle>
  <ModalBody>
    <p>The Tectonic license expired on <span>{moment(expiration).format('LL')}</span>.</p>
    <p>Please login to <a href="https://account.tectonic.com" target="_blank">account.tectonic.com</a> to get your latest license. You may need to contact sales to renew.</p>
  </ModalBody>
  <ModalFooter>
    {children}
    <a href="https://account.tectonic.com" className="btn btn-link" target="_blank">View Tectonic Account</a>
  </ModalFooter>
</div>;

const updateLicense = (cancel, callback) => {
  cancel();
  updateLicenseModal().result.then(() => {
    window.location.reload();
  }).catch((error) => {
    if (error === 'cancel' || error === 'backdrop click') {
      callback();
      return;
    }
    throw error;
  });
};

export const licenseExpiredModal = createModalLauncher(
  (props) => <ExpiredModal {...props}>
    <button type="submit" onClick={props.close} className="btn btn-primary">Close</button>
  </ExpiredModal>
);

export const licenseExpiredGraceEndedModal = createModalLauncher(
  (props) => {
    const configureLicense = () => updateLicense(props.cancel, () => licenseExpiredGraceEndedModal(...props));

    return <ExpiredModal {...props}>
        <button type="submit" onClick={configureLicense} className="btn btn-primary">Update License</button>
    </ExpiredModal>;
  }, null, {backdrop: 'static', keyboard: false}
);
