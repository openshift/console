import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Brand, PageHeader } from '@patternfly/react-core';

import { MastheadToolbar } from './masthead-toolbar';
import { history } from './utils';
import okdLogoImg from '../imgs/okd-logo.svg';
import openshiftLogoImg from '../imgs/openshift-logo.svg';
import ocpLogoImg from '../imgs/openshift-platform-logo.svg';
import onlineLogoImg from '../imgs/openshift-online-logo.svg';
import dedicatedLogoImg from '../imgs/openshift-dedicated-logo.svg';

export const getBrandingDetails = () => {
  let logoImg, productName;
  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch (window.SERVER_FLAGS.branding) {
    case 'openshift':
      logoImg = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
      break;
    case 'ocp':
      logoImg = ocpLogoImg;
      productName = 'Red Hat OpenShift Container Platform';
      break;
    case 'online':
      logoImg = onlineLogoImg;
      productName = 'Red Hat OpenShift Online';
      break;
    case 'dedicated':
      logoImg = dedicatedLogoImg;
      productName = 'Red Hat OpenShift Dedicated';
      break;
    case 'azure':
      logoImg = openshiftLogoImg;
      productName = 'Azure Red Hat OpenShift';
      break;
    default:
      logoImg = okdLogoImg;
      productName = 'OKD';
  }
  if (window.SERVER_FLAGS.customLogoURL) {
    logoImg = window.SERVER_FLAGS.customLogoURL;
  }
  if (window.SERVER_FLAGS.customProductName) {
    productName = window.SERVER_FLAGS.customProductName;
  }
  return { logoImg, productName };
};

export const Masthead = React.memo(({ onNavToggle }) => {
  const details = getBrandingDetails();
  const defaultRoute = '/';
  const logoProps = {
    href: defaultRoute,
    // use onClick to prevent browser reload
    onClick: (e) => {
      e.preventDefault();
      history.push(defaultRoute);
    },
  };

  return (
    <PageHeader
      logo={<Brand src={details.logoImg} alt={details.productName} />}
      logoProps={logoProps}
      toolbar={<MastheadToolbar />}
      showNavToggle
      onNavToggle={onNavToggle}
    />
  );
});

Masthead.propTypes = {
  onNavToggle: PropTypes.func,
};
