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

const UserMenu = connectToFlags(FLAGS.AUTH_ENABLED)((props) => {
  const actions = [
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
  const openshiftConsoleURL = window.SERVER_FLAGS.openshiftConsoleURL;

  const items = {
    [`${openshiftConsoleURL}catalog`]: 'Service Catalog',
    [`${openshiftConsoleURL}projects`]: 'Application Console',
    [window.SERVER_FLAGS.basePath]: 'Cluster Console'
  };

  return <div className="contextselector-pf">
    <Dropdown title="Cluster Console" items={items} selectedKey={window.SERVER_FLAGS.basePath}
      dropDownClassName="bootstrap-select btn-group" onChange={url => window.location = url} />
  </div>;
};

export const OpenShiftLogo = connectToFlags(FLAGS.OPENSHIFT)(props => {
  const isOpenShiftCluster = props.flags[FLAGS.OPENSHIFT];
  let logoImg;

  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch(window.SERVER_FLAGS.logoImageName) {
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

export const OpenShiftMasthead = () => <div className="os-masthead">
  <header role="banner">
    <div className="os-header">
      <div className="os-header__console-picker">
        { window.SERVER_FLAGS.openshiftConsoleURL && <ContextSwitcher /> }
      </div>
      <div className="os-header__user navbar-right">
        <UserMenu />
      </div>
    </div>
  </header>
</div>;
