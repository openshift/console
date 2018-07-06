import * as React from 'react';

import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import * as openshiftOriginLogoImg from '../imgs/openshift-origin-logo.svg';
import * as openshiftPlatformLogoImg from '../imgs/openshift-platform-logo.svg';
import * as openshiftOnlineLogoImg from '../imgs/openshift-online-logo.svg';
import * as tectonicLogoImg from '../imgs/tectonic-logo.svg';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { authSvc } from '../module/auth';
import { Dropdown, ActionsMenu } from './utils';

import { coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const UserMenu: React.StatelessComponent<UserMenuProps> = ({username, actions}) => {
  const title = <React.Fragment>
    <i className="fa fa-user co-masthead__user-icon" aria-hidden="true"></i>
    <span className="co-masthead__username">{username}</span>
  </React.Fragment>;
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
  const openshiftFlag = props.flags[FLAGS.OPENSHIFT];
  let logoImg, logoAlt;

  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch ((window as any).SERVER_FLAGS.logoImageName) {
    case 'origin':
      logoImg = openshiftOriginLogoImg;
      logoAlt = 'OpenShift Origin';
      break;
    case 'ocp':
      logoImg = openshiftPlatformLogoImg;
      logoAlt = 'OpenShift Container Platform';
      break;
    case 'online':
      logoImg = openshiftOnlineLogoImg;
      logoAlt = 'OpenShift Online';
      break;
    case 'tectonic':
      logoImg = tectonicLogoImg;
      logoAlt = 'Tectonic';
      break;
    default:
      if (flagPending(openshiftFlag)) {
        // Don't flash the Tectonic logo if we're still detecting if this is OpenShift.
        return null;
      }
      logoImg = openshiftFlag ? openshiftOriginLogoImg : tectonicLogoImg;
      logoAlt = openshiftFlag ? 'OpenShift Origin' : 'Tectonic';
  }

  return <div className="co-masthead__logo">
    <Link to="/" className="co-masthead__logo-link"><img src={logoImg} alt={logoAlt} /></Link>
  </div>;
});

export const Masthead = () => <header role="banner" className="co-masthead">
  <LogoImage />
  <div className="co-masthead__console-picker">
    { (window as any).SERVER_FLAGS.openshiftConsoleURL && <ContextSwitcher /> }
  </div>
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
