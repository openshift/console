import * as React from 'react';
import * as PropTypes from 'prop-types';
import {
  Brand,
  Masthead as PfMasthead,
  MastheadLogo,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  PageToggleButton,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { useNavigate } from 'react-router-dom-v5-compat';
import { ReactSVG } from 'react-svg';
import { MastheadToolbar } from './masthead-toolbar';
import {
  FAVICON_TYPE,
  getBrandingDetails,
  MASTHEAD_TYPE,
  useCustomLogoURL,
} from './utils/branding';

export const Masthead = React.memo(({ isMastheadStacked, isNavOpen, onNavToggle }) => {
  const { productName, staticLogo } = getBrandingDetails();
  const navigate = useNavigate();

  const customLogoUrl = useCustomLogoURL(MASTHEAD_TYPE);
  const customFaviconUrl = useCustomLogoURL(FAVICON_TYPE);

  React.useEffect(() => {
    if (customFaviconUrl) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = customFaviconUrl;
    }
  }, [customFaviconUrl]);

  const defaultRoute = '/';
  const logoProps = {
    href: defaultRoute,
    // use onClick to prevent browser reload
    onClick: (e) => {
      e.preventDefault();
      navigate(defaultRoute);
    },
  };

  return (
    <PfMasthead id="page-main-header" display={{ default: isMastheadStacked ? 'stack' : 'inline' }}>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton onSidebarToggle={onNavToggle} isSidebarOpen={isNavOpen}>
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo
            component="a"
            aria-label={productName}
            data-test="masthead-logo"
            {...logoProps}
          >
            {customLogoUrl ? (
              <Brand src={customLogoUrl} alt={productName} />
            ) : (
              <ReactSVG src={staticLogo} aria-hidden className="pf-v6-c-brand" />
            )}
          </MastheadLogo>
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
