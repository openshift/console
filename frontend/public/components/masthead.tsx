import * as React from 'react';

import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import * as okdLogoImg from '../imgs/okd-logo.svg';
import * as okdvirtLogoImg from '../imgs/okdvirt-logo.svg';
import * as ocpLogoImg from '../imgs/openshift-platform-logo.svg';
import * as onlineLogoImg from '../imgs/openshift-online-logo.svg';
import * as dedicatedLogoImg from '../imgs/openshift-dedicated-logo.svg';
import * as rhLogoImg from '../imgs/redhat-logo-modal.svg';
import * as okdModalImg from '../imgs/okd-logo-modal.svg';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { authSvc } from '../module/auth';
import { ActionsMenu, AsyncComponent } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { createModalLauncher } from './factory/modal';

import { coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';

const AboutModal = (props) => <AsyncComponent loader={() => import('./utils/about-modal').then(c => c.AboutModal)} {...props} />;

export const getBrandingDetails = () => {
  let backgroundImg, logoImg, logoAlt, modalLogoImg, modalLogoAlt, productTitle;

  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch ((window as any).SERVER_FLAGS.branding) {
    case 'ocp':
      backgroundImg = true;
      logoImg = ocpLogoImg;
      logoAlt = 'OpenShift Container Platform';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = <React.Fragment>Red Hat<sup>&reg;</sup> OpenShift Container Platform</React.Fragment>;
      break;
    case 'online':
      backgroundImg = true;
      logoImg = onlineLogoImg;
      logoAlt = 'OpenShift Online';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = <React.Fragment>Red Hat<sup>&reg;</sup> OpenShift Online</React.Fragment>;
      break;
    case 'dedicated':
      backgroundImg = true;
      logoImg = dedicatedLogoImg;
      logoAlt = 'OpenShift Dedicated';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = <React.Fragment>Red Hat<sup>&reg;</sup> OpenShift Dedicated</React.Fragment>;
      break;
    case 'okdvirt':
      backgroundImg = true;
      logoImg = okdvirtLogoImg;
      logoAlt = 'OKD Virtualization';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = <React.Fragment>Red Hat<sup>&reg;</sup> OpenShift Dedicated</React.Fragment>;
      break;
    default:
      backgroundImg = false;
      logoImg = okdLogoImg;
      logoAlt = 'OKD';
      modalLogoImg = okdModalImg;
      modalLogoAlt = 'OKD';
      productTitle = 'OKD';
  }

  return {backgroundImg, logoImg, logoAlt, modalLogoImg, modalLogoAlt, productTitle};
};

const launchAboutModal = createModalLauncher(AboutModal);

class HelpMenu extends React.Component<{}, {}> {
  constructor(props) {
    super(props);
    this.openDocumentation = this.openDocumentation.bind(this);
  }

  openDocumentation() {
    window.open(openshiftHelpBase, '_blank').opener = null;
  }

  render() {
    return <React.Fragment>
      <ActionsMenu
        actions={[
          {label: 'Documentation', callback: this.openDocumentation},
          {label: 'About', callback: launchAboutModal}]}
        buttonClassName="btn-link nav-item-iconic"
        noCaret
        title={<i className="fa fa-question-circle-o co-masthead__help-icon" />} />
    </React.Fragment>;
  }
}

const UserMenu: React.StatelessComponent<UserMenuProps> = ({username, actions}) => {
  const title = <React.Fragment>
    <i className="pficon pficon-user co-masthead__user-icon" aria-hidden="true"></i>
    <span className="co-masthead__username">{username}</span>
  </React.Fragment>;
  if (_.isEmpty(actions)) {
    return <div className="nav-item-iconic no-dropdown">{title}</div>;
  }

  return <ActionsMenu actions={actions}
    title={title}
    buttonClassName="btn-link nav-item-iconic" />;
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
      callback: logout,
    });
  }

  if (props.flags[FLAGS.OPENSHIFT]) {
    return <OSUserMenu actions={actions} />;
  }

  return authSvc.userID() ? <UserMenu actions={actions} username={authSvc.name()} /> : null;
});

export class OSUserMenu extends SafetyFirst<OSUserMenuProps, OSUserMenuState> {
  constructor(props) {
    super(props);
    this.state = {
      username: undefined,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this.getUserInfo();
  }

  private getUserInfo() {
    coFetchJSON('api/kubernetes/apis/user.openshift.io/v1/users/~')
      .then((user) => {
        this.setState({ username: _.get(user, 'fullName') || user.metadata.name });
      }).catch(() => this.setState({ username: null }));
  }

  render() {
    const username = this.state.username;
    return username ? <UserMenu actions={this.props.actions} username={username} /> : null;
  }
}

export const LogoImage = () => {
  const details = getBrandingDetails();
  return <div className="co-masthead__logo">
    <Link to="/" className="co-masthead__logo-link"><img src={details.logoImg} alt={details.logoAlt} /></Link>
  </div>;
};

export const Masthead = () => <header role="banner" className="navbar navbar-pf-vertical co-masthead">
  <div className="navbar-header">
    <LogoImage />
  </div>
  <div className="nav navbar-nav navbar-right navbar-iconic navbar-utility">
    <div className="co-masthead__dropdowns">
      <div className="co-masthead__help">
        <HelpMenu />
      </div>
      <div className="co-masthead__user">
        <UserMenuWrapper />
      </div>
    </div>
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
