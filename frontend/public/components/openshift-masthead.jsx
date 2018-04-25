import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as openshiftOriginLogoImg from '../imgs/openshift-origin-logo.svg';
import * as tectonicLogoImg from '../imgs/tectonic-logo.svg';
import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { authSvc } from '../module/auth';
import { Dropdown, ActionsMenu } from './utils';

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const actionsStateToProps = (state) => {
  const actions = [
    {
      label: 'My Account',
      href: '/settings/profile'
    },
  ];

  const authFlag = featuresStateToProps([FLAGS.AUTH_ENABLED], state).flags;

  if (authFlag[FLAGS.AUTH_ENABLED]) {
    actions.push({
      label: 'Logout',
      callback: logout
    });
  }

  return { actions };
};

const osStateToProps = (state) => {
  //This should make logo images configurable for other logos
  const openshiftOriginFlag = featuresStateToProps([FLAGS.OPENSHIFT], state).flags;
  const isOpenShiftCluster = openshiftOriginFlag[FLAGS.OPENSHIFT];
  const logoImg = isOpenShiftCluster ? openshiftOriginLogoImg : tectonicLogoImg;

  return { logoImg, isOpenShiftCluster };
};

const UserMenu = connect(actionsStateToProps)(({actions}) => {
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

export const OpenShiftMasthead = connect(osStateToProps)(({ logoImg, isOpenShiftCluster }) => {
  return <div className="os-masthead">
    <header role="banner">
      <div className="os-header">
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
