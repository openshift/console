import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

import { FLAGS, connectToFlags, flagPending } from '../features';
import { authSvc } from '../module/auth';
import { coFetchJSON } from '../co-fetch';
import { history } from './utils';
import { openshiftHelpBase } from './utils/documentation';

import { Dropdown, DropdownToggle, DropdownItem, KebabToggle, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import AboutModal from './about-modal';

class AppToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDropdownOpen: false,
      isKebabDropdownOpen: false,
      username: null,
      showAboutModal: false,
    };

    this._updateUser = this._updateUser.bind(this);
    this._onDropdownToggle = this._onDropdownToggle.bind(this);
    this._onDropdownSelect = this._onDropdownSelect.bind(this);
    this._onKebabDropdownToggle = this._onKebabDropdownToggle.bind(this);
    this._onKebabDropdownSelect = this._onKebabDropdownSelect.bind(this);
    this._renderMenu = this._renderMenu.bind(this);
    this._renderMenuDropdown = this._renderMenuDropdown.bind(this);
    this._onSettingsDropdownSelect = this._onSettingsDropdownSelect.bind(this);
    this._onSettingsDropdownToggle = this._onSettingsDropdownToggle.bind(this);
    this._onAboutModal = this._onAboutModal.bind(this);
    this._closeAboutModal = this._closeAboutModal.bind(this);
    this._onDocumentation = this._onDocumentation.bind(this);
  }

  componentDidMount() {
    this._updateUser();
  }

  componentDidUpdate(prevProps) {
    if (this.props.flags !== prevProps.flags) {
      this._updateUser();
    }
  }

  _updateUser() {
    const { flags } = this.props;

    if (flags[FLAGS.OPENSHIFT]) {
      coFetchJSON('api/kubernetes/apis/user.openshift.io/v1/users/~')
        .then(user => {
          this.setState({ username: _.get(user, 'fullName') || user.metadata.name });
        })
        .catch(() => {
          this.setState({ username: null });
        });
    } else {
      this.setState({ username: authSvc.userID() ? authSvc.name() : null });
    }
  }

  _onDropdownToggle(isDropdownOpen) {
    this.setState({
      isDropdownOpen,
    });
  }

  _onDropdownSelect() {
    this.setState({
      isDropdownOpen: !this.state.isDropdownOpen,
    });
  }

  _onKebabDropdownToggle(isKebabDropdownOpen) {
    this.setState({
      isKebabDropdownOpen,
    });
  }

  _onKebabDropdownSelect() {
    this.setState({
      isKebabDropdownOpen: !this.state.isKebabDropdownOpen,
    });
  }

  _onSettingsDropdownSelect() {
    this.setState({
      isSettingsDropdownOpen: !this.state.isSettingsDropdownOpen,
    });
  }

  _onSettingsDropdownToggle(isSettingsDropdownOpen) {
    this.setState({
      isSettingsDropdownOpen,
    });
  }

  _onAboutModal(e) {
    //todo: wire up
    e.preventDefault();
    this.setState({ showAboutModal: true });
  }

  _closeAboutModal() {
    this.setState({ showAboutModal: false });
  }

  _onDocumentation(e) {
    e.preventDefault();
    window.open(openshiftHelpBase, '_blank').opener = null;
  }

  _renderMenuDropdown(actions, mobile) {
    const { isDropdownOpen, isKebabDropdownOpen, username } = this.state;

    if (!username) {
      return null;
    }

    if (mobile) {
      if (_.isEmpty(actions)) {
        return null; //do not render kebab if we have no actions
      }
      return (
        <Dropdown
          isPlain
          position="right"
          onSelect={this._onKebabDropdownSelect}
          toggle={<KebabToggle onToggle={this._onKebabDropdownToggle} />}
          isOpen={isKebabDropdownOpen}
          dropdownItems={actions.map((action, i) => {
            return (
              <DropdownItem key={i} onClick={action.callback}>
                {action.label}
              </DropdownItem>
            );
          })}
        />
      );
    }
    if (_.isEmpty(actions)) {
      return <div className="co-username">{username}</div>;
    }
    return (
      <Dropdown
        isPlain
        position="right"
        onSelect={this._onDropdownSelect}
        isOpen={isDropdownOpen}
        toggle={<DropdownToggle onToggle={this._onDropdownToggle}>{username}</DropdownToggle>}
        dropdownItems={actions.map((action, i) => {
          return (
            <DropdownItem key={i} onClick={action.callback}>
              {action.label}
            </DropdownItem>
          );
        })}
      />
    );
  }

  _renderMenu(mobile) {
    const { flags } = this.props;

    if (flagPending(flags[FLAGS.OPENSHIFT]) || flagPending(flags[FLAGS.AUTH_ENABLED])) {
      return null;
    }

    const actions = [];
    if (flags[FLAGS.AUTH_ENABLED]) {
      const logout = e => {
        e.preventDefault();
        if (flags[FLAGS.OPENSHIFT]) {
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

    if (mobile) {
      actions.push({
        label: 'Documentation',
        callback: this._onDocumentation,
      });
      actions.push({
        label: 'About',
        callback: this._onAboutModal,
      });
    }

    if (flags[FLAGS.OPENSHIFT]) {
      return this._renderMenuDropdown(actions, mobile);
    }

    const profile = e => {
      e.preventDefault();
      history.push('/settings/profile');
    };
    actions.unshift({
      label: 'My Account',
      callback: profile,
    });
    return this._renderMenuDropdown(actions, mobile);
  }

  render() {
    const { isSettingsDropdownOpen, showAboutModal } = this.state;
    return (
      <React.Fragment>
        <Toolbar>
          <ToolbarGroup>
            {/* desktop settings /cog dropdown */}
            <ToolbarItem className={classNames('pf-u-sr-only', 'pf-u-visible-on-md')}>
              <Dropdown
                isPlain
                onSelect={this._onSettingsDropdownSelect}
                toggle={
                  <DropdownToggle aria-label="Help" iconComponent={null} onToggle={this._onSettingsDropdownToggle}>
                    <QuestionCircleIcon />
                  </DropdownToggle>
                }
                isOpen={isSettingsDropdownOpen}
                dropdownItems={[
                  <DropdownItem key="documentation" onClick={this._onDocumentation}>
                    Documentation
                  </DropdownItem>,
                  <DropdownItem key="about" onClick={this._onAboutModal}>
                    About
                  </DropdownItem>,
                ]}
              />
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup >
            {/* mobile menu */}
            <ToolbarItem className="pf-u-hidden-on-md pf-u-mr-0">{this._renderMenu(true)}</ToolbarItem>
            {/* desktop menu */}
            <ToolbarItem className="pf-u-sr-only pf-u-visible-on-md">{this._renderMenu(false)}</ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
        <AboutModal isOpen={showAboutModal} closeAboutModal={this._closeAboutModal} />
      </React.Fragment>
    );
  }
}
const AppToolbarConnected = connectToFlags(FLAGS.AUTH_ENABLED, FLAGS.OPENSHIFT)(AppToolbar);
export default AppToolbarConnected;
