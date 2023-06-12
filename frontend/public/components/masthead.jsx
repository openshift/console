import * as React from 'react';
import * as PropTypes from 'prop-types';
import {
  Brand,
  Masthead as PfMasthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';

import { MastheadToolbar } from './masthead-toolbar';
import { history } from './utils';
import okdLogoImg from '../imgs/okd-logo.svg';
import openshiftLogoImg from '../imgs/openshift-logo.svg';
import onlineLogoImg from '../imgs/openshift-online-logo.svg';
import dedicatedLogoImg from '../imgs/openshift-dedicated-logo.svg';
import rosaLogoImg from '../imgs/openshift-service-on-aws-logo.svg';

export const getBrandingDetails = () => {
  let logoImg, productName;
  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch (window.SERVER_FLAGS.branding) {
    case 'openshift':
      logoImg = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
      break;
    case 'ocp':
      logoImg = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
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
    case 'rosa':
      logoImg = rosaLogoImg;
      productName = 'Red Hat OpenShift Service on AWS';
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

export const Masthead = React.memo(({ isMastheadStacked, isNavOpen, onNavToggle }) => {
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
    <PfMasthead id="page-main-header" display={{ default: isMastheadStacked ? 'stack' : 'inline' }}>
      <MastheadToggle>
        <PageToggleButton onNavToggle={onNavToggle} isNavOpen={isNavOpen}>
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand {...logoProps}>
          <Brand src={details.logoImg} alt={details.productName} />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <MastheadToolbar isMastheadStacked={isMastheadStacked} />
      </MastheadContent>
    </PfMasthead>
  );
});

Masthead.propTypes = {
  isMastheadStacked: PropTypes.bool,
  isNavOpen: PropTypes.bool,
  onNavToggle: PropTypes.func,
};
