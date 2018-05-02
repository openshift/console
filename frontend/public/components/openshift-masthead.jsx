import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as openshiftOriginLogoImg from '../imgs/openshift-origin-logo.svg';
import * as openshiftPlatformLogoImg from '../imgs/openshift-platform-logo.svg';
import * as openshiftOnlineLogoImg from '../imgs/openshift-online-logo.svg';
import * as tectonicLogoImg from '../imgs/tectonic-logo.svg';
import { FLAGS, connectToFlags } from '../features';
import { authSvc } from '../module/auth';
import { Dropdown, ActionsMenu } from './utils';
import { UIActions } from '../ui/ui-actions';

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

const navbarToggleStateToProps = state => {
  const sidebarOpen = state.UI.get('sidebarOpen');

  return { sidebarOpen };
};

const navbarToggleDispatchToProps = dispatch => ({
  setSidebarOpen: open => dispatch(UIActions.setSidebarOpen(open)),
});

const NavbarToggle = connect(navbarToggleStateToProps, navbarToggleDispatchToProps)(({sidebarOpen, setSidebarOpen}) => {
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  return (
    <button type="button" className="os-header__navbar-toggle" aria-controls="sidebar" aria-expanded={sidebarOpen} onClick={toggleSidebar}>
      <span className="sr-only">Toggle navigation</span>
      <span className="icon-bar" aria-hidden="true"></span>
      <span className="icon-bar" aria-hidden="true"></span>
      <span className="icon-bar" aria-hidden="true"></span>
    </button>
  );
});

export const OpenShiftMasthead = connectToFlags(FLAGS.OPENSHIFT)((props) => {
  const isOpenShiftCluster = props.flags[FLAGS.OPENSHIFT];
  let logoImg;

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

  return <div className="os-masthead">
    <header role="banner">
      <div className="os-header">
        <NavbarToggle />
        <div className="os-header__logo">
          <Link to="/">
            <img src={logoImg} className="os-header__logo-img"/>
          </Link>
        </div>
        <div className="os-header__console-picker">
          { isOpenShiftCluster && !!window.SERVER_FLAGS.openshiftConsoleURL && <ContextSwitcher /> }
        </div>
        <div className="os-header__user navbar-right">
          <UserMenu />
        </div>
      </div>
    </header>
  </div>;
});
