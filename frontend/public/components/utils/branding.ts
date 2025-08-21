import { useState, useContext, useEffect } from 'react';
import {
  ThemeContext,
  THEME_DARK,
  THEME_LIGHT,
  applyThemeBehaviour,
  darkThemeMq,
} from '@console/internal/components/ThemeProvider';
import okdLogoImg from '../../imgs/okd-logo.svg';
import openshiftLogoImg from '../../imgs/openshift-logo.svg';
import onlineLogoImg from '../../imgs/openshift-online-logo.svg';
import dedicatedLogoImg from '../../imgs/openshift-dedicated-logo.svg';
import rosaLogoImg from '../../imgs/openshift-service-on-aws-logo.svg';
import { capitalize } from 'lodash';

type CUSTOM_LOGO = typeof FAVICON_TYPE | typeof MASTHEAD_TYPE;
export const FAVICON_TYPE = 'Favicon';
export const MASTHEAD_TYPE = 'Masthead';

export const getBrandingDetails = () => {
  let staticLogo: string, productName: string;
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

/** Fetches given custom logo and returns its blob URL.
 * Fetches the bridge's custom logo endpoint with query parameters that specify the type
 * and the theme of the requested custom logo.
 * The hook listens for theme changes to provide correct custom logo for given theme.
 * results into redux, adjusts the API polling frequency based on the poll success.
 * @param type - The type of the custom logo to query.
 * @returns Returns logoURL blob URL and the loading state of the API request.
 */
export const useCustomLogoURL = (type: CUSTOM_LOGO): { logoUrl: string; loading: Boolean } => {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    // return when requested custom logo type is not configured
    if (
      (type === MASTHEAD_TYPE && !window.SERVER_FLAGS.customLogosConfigured) ||
      (type === FAVICON_TYPE && !window.SERVER_FLAGS.customFaviconsConfigured)
    ) {
      return;
    }
    setLoading(true);
    let reqTheme;
    const fetchData = async () => {
      if (type === FAVICON_TYPE) {
        if (!darkThemeMq.matches) {
          // Fetch Light theme favicon if the Dark preference is not set via the system preference
          reqTheme = THEME_LIGHT;
        } else {
          reqTheme = THEME_DARK;
        }
      } else {
        reqTheme = applyThemeBehaviour(
          theme,
          () => {
            return THEME_DARK;
          },
          () => {
            return THEME_LIGHT;
          },
        );
      }
      const fetchURL = `${window.SERVER_FLAGS.basePath}custom-logo?type=${type}&theme=${capitalize(
        reqTheme,
      )}`;
      const response = await fetch(fetchURL);
      if (response.ok) {
        const blob = await response.blob();
        setLogoUrl(URL.createObjectURL(blob));
        setLoading(false);
      } else if (response.status === 404) {
        setLogoUrl('');
        setLoading(false);
        return;
      } else {
        throw new Error(`Failed to fetch ${fetchURL}: ${response.statusText}`);
      }
    };
    fetchData().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(`Error while fetching ${type} logo: ${err}`);
    });
  }, [theme, type]);

  return { logoUrl, loading };
};
