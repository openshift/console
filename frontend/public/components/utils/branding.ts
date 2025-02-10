import * as React from 'react';
import {
  ThemeContext,
  THEME_DARK,
  THEME_LIGHT,
  applyThemeBehaviour,
} from '@console/internal/components/ThemeProvider';

export const getBrandingProductName = (): string => {
  let productName;
  switch (window.SERVER_FLAGS.branding) {
    case 'openshift':
      productName = 'Red Hat OpenShift';
      break;
    case 'ocp':
      productName = 'Red Hat OpenShift';
      break;
    case 'online':
      productName = 'Red Hat OpenShift Online';
      break;
    case 'dedicated':
      productName = 'Red Hat OpenShift Dedicated';
      break;
    case 'azure':
      productName = 'Azure Red Hat OpenShift';
      break;
    case 'rosa':
      productName = 'Red Hat OpenShift Service on AWS';
      break;
    default:
      productName = 'OKD';
  }
  if (window.SERVER_FLAGS.customProductName) {
    productName = window.SERVER_FLAGS.customProductName;
  }

  return productName;
};

export const useBrandingProductLogoURL = (favicon: boolean = false): string => {
  const [logoUrl, setLogoUrl] = React.useState('');
  const theme = React.useContext(ThemeContext);

  React.useEffect(() => {
    const reqType = favicon ? 'favicon' : 'masthead';
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
      const fetchURL = `${window.SERVER_FLAGS.basePath}custom-logo?type=${reqType}&theme=${reqTheme}-theme`;
      const response = await fetch(fetchURL);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fetchURL}: ${response.statusText}`);
      }
      const svg = await response.text();
      setLogoUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    };
    fetchData().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(`Error while fetching ${reqType} logo: ${err}`);
    });
  }, [theme, favicon]);

  return logoUrl;
};
