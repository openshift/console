import * as React from 'react';
import {
  ThemeContext,
  THEME_DARK,
  THEME_LIGHT,
  applyThemeBehaviour,
} from '@console/internal/components/ThemeProvider';
import okdLogoImg from '../../imgs/okd-logo.svg';
import openshiftLogoImg from '../../imgs/openshift-logo.svg';
import onlineLogoImg from '../../imgs/openshift-online-logo.svg';
import dedicatedLogoImg from '../../imgs/openshift-dedicated-logo.svg';
import rosaLogoImg from '../../imgs/openshift-service-on-aws-logo.svg';

type CUSTOM_LOGO = typeof FAVICON_TYPE | typeof MASTHEAD_TYPE;
export const FAVICON_TYPE = 'favicon';
export const MASTHEAD_TYPE = 'masthead';

export const getBrandingDetails = () => {
  let staticLogo, productName;
  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch (window.SERVER_FLAGS.branding) {
    case 'openshift':
      staticLogo = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
      break;
    case 'ocp':
      staticLogo = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
      break;
    case 'online':
      staticLogo = onlineLogoImg;
      productName = 'Red Hat OpenShift Online';
      break;
    case 'dedicated':
      staticLogo = dedicatedLogoImg;
      productName = 'Red Hat OpenShift Dedicated';
      break;
    case 'azure':
      staticLogo = openshiftLogoImg;
      productName = 'Azure Red Hat OpenShift';
      break;
    case 'rosa':
      staticLogo = rosaLogoImg;
      productName = 'Red Hat OpenShift Service on AWS';
      break;
    default:
      staticLogo = okdLogoImg;
      productName = 'OKD';
  }
  if (window.SERVER_FLAGS.customProductName) {
    productName = window.SERVER_FLAGS.customProductName;
  }
  return { staticLogo, productName };
};

// when user specifies logo with customLogoFile instead of customLogoFiles the URL
// query parameters will be ignored and the single specified logo will always be provided
export const useCustomLogoURL = (type: CUSTOM_LOGO): string => {
  const [logoUrl, setLogoUrl] = React.useState('');
  const theme = React.useContext(ThemeContext);

  React.useEffect(() => {
    if (!window.SERVER_FLAGS.customLogoURL) {
      return;
    }
    const reqTheme = applyThemeBehaviour(
      theme,
      () => {
        return THEME_DARK;
      },
      () => {
        return THEME_LIGHT;
      },
    );
    const fetchURL = `${window.SERVER_FLAGS.customLogoURL}?type=${type}&theme=${reqTheme}-theme`;
    setLogoUrl(fetchURL);
  }, [theme, type]);

  return logoUrl;
};
