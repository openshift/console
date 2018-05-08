import * as React from 'react';

import { Link } from 'react-router-dom';
import * as openshiftOriginLogoImg from '../imgs/openshift-origin-logo.svg';
import * as openshiftPlatformLogoImg from '../imgs/openshift-platform-logo.svg';
import * as openshiftOnlineLogoImg from '../imgs/openshift-online-logo.svg';
import * as tectonicLogoImg from '../imgs/tectonic-logo.svg';
import { FLAGS, connectToFlags } from '../features';
import { authSvc } from '../module/auth';
import { Dropdown, ActionsMenu } from './utils';

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const UserMenu = connectToFlags(FLAGS.AUTH_ENABLED)((props: FlagsProps) => {
  const actions: { label: string, href?: string, callback?: any }[] = [
    {
      label: 'My Account',
      href: '/settings/profile'
    },
  ];

  if (props.flags[FLAGS.AUTH_ENABLED]) {
    actions.push({
      label: 'Logout',
      callback: logout
    });
  }

  const title = <span>
    <i className="fa fa-user os-header__user-icon"></i>{authSvc.name()}
  </span>;
  return authSvc.userID() ? <ActionsMenu actions={actions}
    title={title}
    noButton={true} /> : null;
});

const ContextSwitcher = () => {
  const openshiftConsoleURL = (window as any).SERVER_FLAGS.openshiftConsoleURL;

  const items = {
    [`${openshiftConsoleURL}catalog`]: 'Service Catalog',
    [`${openshiftConsoleURL}projects`]: 'Application Console',
    [(window as any).SERVER_FLAGS.basePath]: 'Cluster Console'
  };

  return <div className="contextselector-pf">
    <Dropdown title="Cluster Console" items={items} selectedKey={(window as any).SERVER_FLAGS.basePath}
      dropDownClassName="bootstrap-select btn-group" onChange={url => window.location.href = url} />
  </div>;
};

export const LogoImage = connectToFlags(FLAGS.OPENSHIFT)((props: FlagsProps) => {
  const isOpenShiftCluster = props.flags[FLAGS.OPENSHIFT];
  let logoImg;

  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch((window as any).SERVER_FLAGS.logoImageName) {
    case 'os-origin':
      logoImg = openshiftOriginLogoImg;
      break;
    case 'os-online':
      logoImg = openshiftOnlineLogoImg;
      break;
    case 'os-platform':
      logoImg = openshiftPlatformLogoImg;
      break;
    default:
      logoImg = isOpenShiftCluster ? openshiftOriginLogoImg : tectonicLogoImg;
  }

  return <div className="sidebar__logo">
    <Link to="/"><img src={logoImg} /></Link>
  </div>;
});

export const Masthead = () => <div className="co-masthead">
  <header role="banner">
    <div className="co-header">
      <div className="co-header__console-picker">
        { (window as any).SERVER_FLAGS.openshiftConsoleURL && <ContextSwitcher /> }
      </div>
      <div className="co-header__user navbar-right">
        <UserMenu />
      </div>
    </div>
  </header>
</div>;

/* eslint-disable no-undef */
export type FlagsProps = {
  flags: {[name: string]: boolean};
};
