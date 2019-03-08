import * as React from 'react';

import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import * as okdLogoImg from '../imgs/okd-logo.svg';
import * as ocpLogoImg from '../imgs/openshift-platform-logo.svg';
import * as onlineLogoImg from '../imgs/openshift-online-logo.svg';
import * as dedicatedLogoImg from '../imgs/openshift-dedicated-logo.svg';
import * as azureLogoImg from '../imgs/azure-red-hat-openshift-logo.svg';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { authSvc } from '../module/auth';
import { Dropdown, ActionsMenu } from './utils';

import { coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';

const developerConsoleURL = (window as any).SERVER_FLAGS.developerConsoleURL;

const UserMenu: React.StatelessComponent<UserMenuProps> = ({username, actions}) => {
  const title = <React.Fragment>
    <i className="pficon pficon-user co-masthead__user-icon" aria-hidden="true"></i>
    <span className="co-masthead__username">{username}</span>
  </React.Fragment>;
  if (_.isEmpty(actions)) {
    return title;
  }

  return <ActionsMenu actions={actions}
    title={title}
    noButton={true} />;
};

const UserMenuWrapper = connectToFlags(FLAGS.AUTH_ENABLED, FLAGS.OPENSHIFT)((props: FlagsProps) => {
  if (flagPending(props.flags[FLAGS.OPENSHIFT]) || flagPending(props.flags[FLAGS.AUTH_ENABLED])) {
    return null;
  }

  const actions: Actions = [];
  if (props.flags[FLAGS.AUTH_ENABLED]) {
    const logout = e => {
      e.preventDefault();
      if (props.flags[FLAGS.OPENSHIFT]) {
        authSvc.deleteOpenShiftToken().then(() => authSvc.logout());
      } else {
        authSvc.logout();
      }
    };
    actions.push({
      label: 'Logout',
      callback: logout
    });
  }

  if (props.flags[FLAGS.OPENSHIFT]) {
    return <OSUserMenu actions={actions} />;
  }

  actions.unshift({
    label: 'My Account',
    href: '/settings/profile'
  });

  return authSvc.userID() ? <UserMenu actions={actions} username={authSvc.name()} /> : null;
});

export class OSUserMenu extends SafetyFirst<OSUserMenuProps, OSUserMenuState> {
  constructor(props) {
    super(props);
    this.state = {
      username: undefined
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this._getUserInfo();
  }

  _getUserInfo() {
    coFetchJSON('api/kubernetes/apis/user.openshift.io/v1/users/~')
      .then((user) => {
        this.setState({ username: _.get(user, 'fullName') || user.metadata.name });
      }).catch(() => this.setState({ username: null }));
  }

  render () {
    const username = this.state.username;
    return username ? <UserMenu actions={this.props.actions} username={username} /> : null;
  }
}

const ContextSwitcher = () => {
  const items = {
    [`${developerConsoleURL}catalog`]: 'Service Catalog',
    [`${developerConsoleURL}projects`]: 'Application Console',
    [(window as any).SERVER_FLAGS.basePath]: 'Cluster Console'
  };

  return <div className="contextselector-pf">
    <Dropdown title="Cluster Console" items={items} selectedKey={(window as any).SERVER_FLAGS.basePath}
      dropDownClassName="bootstrap-select btn-group" onChange={url => window.location.href = url} />
  </div>;
};

export const LogoImage = () => {
  let logoImg, logoAlt;

  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch ((window as any).SERVER_FLAGS.branding) {
    case 'ocp':
      logoImg = ocpLogoImg;
      logoAlt = 'OpenShift Container Platform';
      break;
    case 'online':
      logoImg = onlineLogoImg;
      logoAlt = 'OpenShift Online';
      break;
    case 'dedicated':
      logoImg = dedicatedLogoImg;
      logoAlt = 'OpenShift Dedicated';
      break;
    case 'azure':
      logoImg = azureLogoImg;
      logoAlt = 'Azure Red Hat OpenShift';
      break;
    default:
      logoImg = okdLogoImg;
      logoAlt = 'OKD';
  }

  return <div className="co-masthead__logo">
    <Link to="/" className="co-masthead__logo-link"><img src={logoImg} alt={logoAlt} /></Link>
  </div>;
};

export const Masthead = () => <header role="banner" className="co-masthead">
  <LogoImage />
  {developerConsoleURL && <div className="co-masthead__console-picker">
    <ContextSwitcher />
  </div>}
  <div className="co-masthead__user">
    <UserMenuWrapper />
  </div>
</header>;

/* eslint-disable no-undef */
export type FlagsProps = {
  flags: {[name: string]: boolean},
};

export type Actions = { label: string, href?: string, callback?: any }[];

export type UserMenuProps = {
  actions: Actions,
  username: any,
};

export type OSUserMenuProps = {
  actions: Actions,
};

export type OSUserMenuState = {
  username: string,
};
