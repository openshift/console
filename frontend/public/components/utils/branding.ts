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

export const useCustomLogoURL = (type: CUSTOM_LOGO = MASTHEAD_TYPE): string => {
  const [logoUrl, setLogoUrl] = React.useState('');
  const theme = React.useContext(ThemeContext);

  React.useEffect(() => {
    const fetchData = async () => {
      const reqTheme = applyThemeBehaviour(
        theme,
        () => {
          return THEME_DARK;
        },
        () => {
          return THEME_LIGHT;
        },
      );
      const fetchURL = `${window.SERVER_FLAGS.basePath}custom-logo?type=${type}&theme=${reqTheme}-theme`;
      const response = await fetch(fetchURL);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fetchURL}: ${response.statusText}`);
      }
      const data = await response.blob();
      setLogoUrl(URL.createObjectURL(data));
    };
    fetchData().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(`Error while fetching ${type} logo: ${err}`);
    });
  }, [theme, type]);

  return logoUrl;
};
