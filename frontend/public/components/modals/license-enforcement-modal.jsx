import * as _ from 'lodash';
import * as React from 'react';
import * as moment from 'moment';

import {pluralize} from '../utils';
import {entitlementTitles} from '../license-notifier';
import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';
import {updateLicenseModal} from './update-license-modal';

const updateLicense = ({cancel}) => {
  cancel();
  updateLicenseModal().result.then(() => {
    // multiple components rely on license data, and don't listen for updates.
    // refreshing the entire page is easier than notifying all of these components to update.
    window.location.reload();
  }).catch((error) => {
    if (error === 'cancel' || error === 'backdrop click') {
      // TODO (stuart): this should re-trigger the original modal instead of a page reload,
      // however I had a lot of trouble due to React -> Angular -> React function wrapping.
      // When we move to pure-React modals, this should be much easier.
      window.location.reload();
      return;
    }
    throw error;
  });
};

/* eslint-disable react/jsx-no-target-blank */
const LicenseModal = (props) => {
  const {cancel, close, blocking, title, body} = props;
  return <div>
    <ModalTitle>{title}</ModalTitle>
    <ModalBody>
      {body}
    </ModalBody>
    <ModalFooter inProgress={false} errorMessage="">
      {!blocking && <button type="submit" onClick={close} className="btn btn-primary">Close</button>}
      {blocking && <button type="submit" onClick={() => updateLicense({cancel})} className="btn btn-primary">Update License</button>}
      <a href="https://account.coreos.com" className="btn btn-link" target="_blank" rel="noopener">View Tectonic Account</a>
    </ModalFooter>
  </div>;
};

const invalidModalProps = (props) => {
  return {
    title: 'Invalid Tectonic License',
    body: <div>
      <p>{_.capitalize(props.message) || 'Your Tectonic license is invalid.'}</p>
      <p>Please login to <a href="https://account.coreos.com" target="_blank" rel="noopener">account.coreos.com</a> to get your latest license. You may need to contact sales to renew.</p>
    </div>
  };
};

const expiredModalProps = (props) => {
  return {
    title: 'Tectonic License Expired',
    body: <div>
      <p>The Tectonic license expired on <span>{moment(props.expiration).format('LL')}</span>.</p>
      <p>Please login to <a href="https://account.coreos.com" target="_blank" rel="noopener">account.coreos.com</a> to get your latest license. You may need to contact sales to renew.</p>
    </div>
  };
};
/* eslint-enable react/jsx-no-target-blank */

const exceededModalProps = (props) => {
  const {entitlement, current, entitled} = props;
  const titleLowercase = entitlementTitles[entitlement].lowercase;
  const titleUppercase = entitlementTitles[entitlement].uppercase;
  return {
    title: `Licensed Number of ${titleUppercase}s Exceeded`,
    body: <div>
      <p>You have exceeded the number of {titleLowercase}s allowed in the terms of your license. You have {pluralize(current, titleLowercase)} in your cluster and the limit is {pluralize(entitled, titleLowercase)}.</p>
      <p>Please disconnect {pluralize(current - entitled, titleLowercase)} from your cluster, or contact <a href="mailto:sales@tectonic.com">sales@tectonic.com</a> to upgrade.</p>
    </div>
  };
};

export const licenseEnforcementModal = (options) => {
  const props = _.omit(options, ['type']);

  let additionalProps;
  if (options.type === 'invalid') {
    props.blocking = true;
    additionalProps = invalidModalProps(props);
  } else if (options.type === 'expired') {
    additionalProps = expiredModalProps(props);
  } else if (options.type === 'entitlement') {
    additionalProps = exceededModalProps(props);
  } else {
    // invalid modal type - don't block the user in any way
    return;
  }
  _.defaults(props, additionalProps);

  return createModalLauncher(LicenseModal)(props);
};
