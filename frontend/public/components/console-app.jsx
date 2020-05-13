import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Page } from '@patternfly/react-core';
import CloudShell from '@console/app/src/components/cloud-shell/CloudShell';
import QuickStartDrawer from '@console/app/src/components/quick-starts/QuickStartDrawer';
import DetectPerspective from '@console/app/src/components/detect-perspective/DetectPerspective';
import { usePrevious } from '@console/shared/src/hooks/previous';
import store from '../redux';
import * as UIActions from '../actions/ui';
import AppContents from './app-contents';
import { ConsoleNotifier } from './console-notifier';
import { ConnectedNotificationDrawer } from './notification-drawer';
import { getBrandingDetails, Masthead } from './masthead';
import { Navigation } from './nav';

const breakpointMD = 768;
const NOTIFICATION_DRAWER_BREAKPOINT = 1800;
const isDesktop = () => window.innerWidth >= breakpointMD;
const isLargeLayout = () => window.innerWidth >= NOTIFICATION_DRAWER_BREAKPOINT;

export const ConsoleApp = ({ location, match }) => {
  const [previousNavOpen, setPreviousNavOpen] = React.useState(isDesktop());
  const [isNavOpen, setIsNavOpen] = React.useState(isDesktop());
  const [previousDrawerInline, setPreviousDrawerInline] = React.useState(isLargeLayout());
  const [isDrawerInline, setIsDrawerInline] = React.useState(isLargeLayout());

  const prevLocation = usePrevious({ location });
  const prevMatch = usePrevious({ match });
  const { productName } = getBrandingDetails();

  React.useEffect(() => {
    const oldLocation = _.omit(prevLocation, ['key']);
    const newLocation = _.omit(location, ['key']);
    if (_.isEqual(newLocation, oldLocation) && _.isEqual(match, prevMatch)) {
      return;
    }
    // two way data binding :-/
    const { pathname } = location;
    store.dispatch(UIActions.setCurrentLocation(pathname));
  }, [location, match, prevLocation, prevMatch]);

  const onNavToggle = () => {
    // Some components, like svg charts, need to reflow when nav is toggled.
    // Fire event after a short delay to allow nav animation to complete.
    setTimeout(() => {
      window.dispatchEvent(new Event('sidebar_toggle'));
    }, 100);
    setIsNavOpen(!isNavOpen);
  };

  const onNotificationDrawerToggle = () => {
    if (isLargeLayout()) {
      // Fire event after the drawer animation speed delay.
      setTimeout(() => {
        window.dispatchEvent(new Event('sidebar_toggle'));
      }, 250);
    }
  };

  const onNavSelect = () => {
    //close nav on mobile nav selects
    if (!isDesktop()) {
      setIsNavOpen(false);
    }
  };

  const onResize = React.useCallback(() => {
    const isCurrentDesktop = isDesktop();
    const isCurrentDrawerInline = isLargeLayout();
    if (previousNavOpen !== isCurrentDesktop) {
      setIsNavOpen(isCurrentDesktop);
      setPreviousNavOpen(isCurrentDesktop);
    }
    if (previousDrawerInline !== isCurrentDrawerInline) {
      setIsDrawerInline(isCurrentDrawerInline);
      setPreviousDrawerInline(isCurrentDrawerInline);
    }
  }, [previousDrawerInline, previousNavOpen]);

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);

  return (
    <DetectPerspective>
      <Helmet titleTemplate={`%s · ${productName}`} defaultTitle={productName} />
      <QuickStartDrawer>
        <ConsoleNotifier location="BannerTop" />
        <Page
          header={<Masthead onNavToggle={onNavToggle} />}
          sidebar={
            <Navigation
              isNavOpen={isNavOpen}
              onNavSelect={onNavSelect}
              onPerspectiveSelected={onNavSelect}
            />
          }
        >
          <ConnectedNotificationDrawer
            isDesktop={isDrawerInline}
            onDrawerChange={onNotificationDrawerToggle}
          >
            <AppContents />
          </ConnectedNotificationDrawer>
        </Page>
        <CloudShell />
        <ConsoleNotifier location="BannerBottom" />
      </QuickStartDrawer>
    </DetectPerspective>
  );
};
