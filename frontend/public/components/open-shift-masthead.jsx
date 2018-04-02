import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as openShiftLogoImg from '../imgs/header-logo.svg';
import { FLAGS, stateToProps as featuresStateToProps } from '../features';
import { authSvc } from '../module/auth';
import { ActionsMenu } from './utils';

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

const UserMenu = connect(actionsStateToProps)(({actions}) => {
  const title = <span>
    <i className="fa fa-user os-header__user-icon"></i>{authSvc.name()}
  </span>;
  return authSvc.userID() ? <ActionsMenu actions={actions}
    title={title}
    menuClassName="os-header__user-menu"
    noButton={true} /> : null;
});

export const OpenShiftMasthead = () => {
  return <div className="os-masthead">
    <header role="banner">
      <div className="os-header">
        <div className="os-header__logo">
          <Link to="/">
            <img src={openShiftLogoImg} className="os-header__logo-img"/>
          </Link>
        </div>
        <div className="os-header__console-picker">
          <span>Cluster Console</span>
        </div>
        <div className="os-header__user">
          <UserMenu />
        </div>
      </div>
    </header>
  </div>;
};
