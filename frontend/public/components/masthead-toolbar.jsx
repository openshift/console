import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { ArrowCircleUpIcon, QuestionCircleIcon, ThIcon } from '@patternfly/react-icons';
import {
  Button,
  Dropdown,
  DropdownToggle,
  DropdownSeparator,
  DropdownItem,
  KebabToggle,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import * as UIActions from '../actions/ui';
import { connectToFlags, flagPending } from '../reducers/features';
import { FLAGS } from '../const';
import { authSvc } from '../module/auth';
import { history, Firehose } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { AboutModal } from './about-modal';
import {
  getAvailableClusterUpdates,
  clusterVersionReference,
} from '../module/k8s/cluster-settings';
import * as plugins from '../plugins';

const SystemStatusButton = ({ statuspageData, className }) =>
  !_.isEmpty(_.get(statuspageData, 'incidents')) ? (
    <ToolbarItem className={className}>
      <a
        className="pf-c-button pf-m-plain"
        aria-label="System Status"
        href={statuspageData.page.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span
          className="pficon pficon-warning-triangle-o co-system-status-icon"
          aria-hidden="true"
        />
      </a>
    </ToolbarItem>
  ) : null;

const UpdatesAvailableButton = ({ obj, onClick }) => {
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(obj.data));
  return updatesAvailable ? (
    <ToolbarItem>
      <Button
        className="co-update-icon"
        variant="plain"
        aria-label="Cluster Updates Available"
        onClick={onClick}
      >
        <ArrowCircleUpIcon />
      </Button>
    </ToolbarItem>
  ) : null;
};

class MastheadToolbar_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isApplicationLauncherDropdownOpen: false,
      isUserDropdownOpen: false,
      isKebabDropdownOpen: false,
      statuspageData: null,
      username: null,
      isKubeAdmin: false,
      showAboutModal: false,
    };

    this._getStatuspageData = this._getStatuspageData.bind(this);
    this._updateUser = this._updateUser.bind(this);
    this._onUserDropdownToggle = this._onUserDropdownToggle.bind(this);
    this._onUserDropdownSelect = this._onUserDropdownSelect.bind(this);
    this._onKebabDropdownToggle = this._onKebabDropdownToggle.bind(this);
    this._onKebabDropdownSelect = this._onKebabDropdownSelect.bind(this);
    this._renderMenuItems = this._renderMenuItems.bind(this);
    this._renderMenu = this._renderMenu.bind(this);
    this._onClusterUpdatesAvailable = this._onClusterUpdatesAvailable.bind(this);
    this._onApplicationLauncherDropdownSelect = this._onApplicationLauncherDropdownSelect.bind(
      this,
    );
    this._onApplicationLauncherDropdownToggle = this._onApplicationLauncherDropdownToggle.bind(
      this,
    );
    this._onHelpDropdownSelect = this._onHelpDropdownSelect.bind(this);
    this._onHelpDropdownToggle = this._onHelpDropdownToggle.bind(this);
    this._onAboutModal = this._onAboutModal.bind(this);
    this._closeAboutModal = this._closeAboutModal.bind(this);
  }

  componentDidMount() {
    if (window.SERVER_FLAGS.statuspageID) {
      this._getStatuspageData(window.SERVER_FLAGS.statuspageID);
    }
    this._updateUser();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.flags[FLAGS.OPENSHIFT] !== prevProps.flags[FLAGS.OPENSHIFT] ||
      !_.isEqual(this.props.user, prevProps.user)
    ) {
      this._updateUser();
    }
  }

  _getStatuspageData(statuspageID) {
    fetch(`https://${statuspageID}.statuspage.io/api/v2/summary.json`, {
      headers: { Accept: 'application/json' },
    })
      .then((response) => response.json())
      .then((statuspageData) => this.setState({ statuspageData }));
  }

  _updateUser() {
    const { flags, user } = this.props;
    if (!flags[FLAGS.OPENSHIFT]) {
      this.setState({ username: authSvc.name() });
    }
    this.setState({
      username: _.get(user, 'fullName') || _.get(user, 'metadata.name', ''),
      isKubeAdmin: _.get(user, 'metadata.name') === 'kube:admin',
    });
  }

  _onUserDropdownToggle(isUserDropdownOpen) {
    this.setState({
      isUserDropdownOpen,
    });
  }

  _onUserDropdownSelect() {
    this.setState({
      isUserDropdownOpen: !this.state.isUserDropdownOpen,
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

  _onClusterUpdatesAvailable() {
    history.push('/settings/cluster');
  }

  _onApplicationLauncherDropdownSelect() {
    this.setState({
      isApplicationLauncherDropdownOpen: !this.state.isApplicationLauncherDropdownOpen,
    });
  }

  _onApplicationLauncherDropdownToggle(isApplicationLauncherDropdownOpen) {
    this.setState({
      isApplicationLauncherDropdownOpen,
    });
  }

  _onHelpDropdownSelect() {
    this.setState({
      isHelpDropdownOpen: !this.state.isHelpDropdownOpen,
    });
  }

  _onHelpDropdownToggle(isHelpDropdownOpen) {
    this.setState({
      isHelpDropdownOpen,
    });
  }

  _onClusterManager(e) {
    e.preventDefault();
    window.open('https://cloud.redhat.com/openshift', '_blank').opener = null;
  }

  _onAboutModal(e) {
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

  _onCommandLineTools(e) {
    e.preventDefault();
    history.push('/command-line-tools');
  }

  _copyLoginCommand(e) {
    e.preventDefault();
    window.open(window.SERVER_FLAGS.requestTokenURL, '_blank').opener = null;
  }

  _getPerspectiveActions() {
    const perspectives = plugins.registry.getPerspectives();
    if (perspectives.length <= 1) {
      return [];
    }
    const { setActivePerspective, flags } = this.props;
    return [
      { separator: true },
      ...perspectives
        .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
        .map((p) => ({
          label: (
            <React.Fragment>
              {p.properties.icon} {p.properties.name}
            </React.Fragment>
          ),
          callback: (e) => {
            e.preventDefault();
            setActivePerspective(p.properties.id);
            history.push(
              flags[FLAGS.OPENSHIFT] ? p.properties.landingPageURL : p.properties.k8sLandingPageURL,
            );
          },
        })),
    ];
  }

  _getAdditionalLinks(links, type) {
    return _.sortBy(_.filter(links, (link) => link.spec.location === type), 'spec.text');
  }

  _launchActions() {
    return [
      {
        label: 'Multi-Cluster Manager',
        callback: this._onClusterManager,
        externalLink: true,
      },
      ...this._getPerspectiveActions(),
    ];
  }

  _helpActions(additionalHelpActions) {
    const helpActions = [];
    helpActions.push(
      {
        label: 'Documentation',
        callback: this._onDocumentation,
        externalLink: true,
      },
      {
        label: 'Command Line Tools',
        callback: this._onCommandLineTools,
      },
      {
        label: 'About',
        callback: this._onAboutModal,
      },
      ...additionalHelpActions,
    );
    return helpActions;
  }

  _getAdditionalActions(links) {
    return _.map(links, (link) => {
      return {
        callback: (e) => {
          e.preventDefault();
          window.open(link.spec.href, '_blank').opener = null;
        },
        label: link.spec.text,
        externalLink: true,
      };
    });
  }

  _renderMenuItems(actions) {
    return actions.map((action, i) =>
      action.separator ? (
        <DropdownSeparator key={i} />
      ) : (
        <DropdownItem key={i} onClick={action.callback}>
          {action.label}
          {action.externalLink && <span className="co-external-link" />}
        </DropdownItem>
      ),
    );
  }

  _renderMenu(mobile) {
    const { flags, consoleLinks } = this.props;
    const { isUserDropdownOpen, isKebabDropdownOpen, username } = this.state;
    const additionalUserActions = this._getAdditionalActions(
      this._getAdditionalLinks(consoleLinks, 'UserMenu'),
    );
    const helpActions = this._helpActions(
      this._getAdditionalActions(this._getAdditionalLinks(consoleLinks, 'HelpMenu')),
    );
    const launchActions = this._launchActions();

    if (
      flagPending(flags[FLAGS.OPENSHIFT]) ||
      flagPending(flags[FLAGS.AUTH_ENABLED]) ||
      !username
    ) {
      return null;
    }

    const actions = [];
    if (flags[FLAGS.AUTH_ENABLED]) {
      const logout = (e) => {
        e.preventDefault();
        if (flags[FLAGS.OPENSHIFT]) {
          authSvc.logoutOpenShift(this.state.isKubeAdmin);
        } else {
          authSvc.logout();
        }
      };

      if (mobile || !_.isEmpty(additionalUserActions)) {
        actions.push({
          separator: true,
        });
      }

      if (window.SERVER_FLAGS.requestTokenURL) {
        actions.push({
          label: 'Copy Login Command',
          callback: this._copyLoginCommand,
          externalLink: true,
        });
      }

      actions.push({
        label: 'Log out',
        callback: logout,
      });
    }

    if (!_.isEmpty(additionalUserActions)) {
      actions.unshift(...additionalUserActions);

      if (mobile) {
        actions.unshift({
          separator: true,
        });
      }
    }

    if (mobile) {
      actions.unshift(...helpActions);

      if (flags[FLAGS.OPENSHIFT]) {
        actions.unshift(...launchActions, { separator: true });
      }

      return (
        <Dropdown
          isPlain
          position="right"
          onSelect={this._onKebabDropdownSelect}
          toggle={<KebabToggle onToggle={this._onKebabDropdownToggle} />}
          isOpen={isKebabDropdownOpen}
          dropdownItems={this._renderMenuItems(actions)}
        />
      );
    }

    if (_.isEmpty(actions)) {
      return <div className="co-username">{username}</div>;
    }

    return (
      <Dropdown
        data-test="user-dropdown"
        isPlain
        position="right"
        onSelect={this._onUserDropdownSelect}
        isOpen={isUserDropdownOpen}
        toggle={
          <DropdownToggle className="co-username" onToggle={this._onUserDropdownToggle}>
            {username}
          </DropdownToggle>
        }
        dropdownItems={this._renderMenuItems(actions)}
      />
    );
  }

  render() {
    const {
      isApplicationLauncherDropdownOpen,
      isHelpDropdownOpen,
      showAboutModal,
      statuspageData,
    } = this.state;
    const { flags, consoleLinks } = this.props;
    const resources = [
      {
        kind: clusterVersionReference,
        name: 'version',
        isList: false,
        prop: 'obj',
      },
    ];
    return (
      <React.Fragment>
        <Toolbar>
          <ToolbarGroup className="hidden-xs">
            {/* desktop -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} />
            {/* desktop -- (updates button) */}
            {flags[FLAGS.CLUSTER_VERSION] && (
              <Firehose resources={resources}>
                <UpdatesAvailableButton onClick={this._onClusterUpdatesAvailable} />
              </Firehose>
            )}
            {/* desktop -- (application launcher dropdown), help dropdown [documentation, about] */}
            <ToolbarItem>
              <Dropdown
                isPlain
                position="right"
                data-test-id="application-launcher"
                onSelect={this._onApplicationLauncherDropdownSelect}
                toggle={
                  <DropdownToggle
                    aria-label="Application Launcher"
                    iconComponent={null}
                    onToggle={this._onApplicationLauncherDropdownToggle}
                  >
                    <ThIcon />
                  </DropdownToggle>
                }
                isOpen={isApplicationLauncherDropdownOpen}
                dropdownItems={this._renderMenuItems(this._launchActions())}
              />
            </ToolbarItem>
            <ToolbarItem>
              <Dropdown
                isPlain
                position="right"
                onSelect={this._onHelpDropdownSelect}
                toggle={
                  <DropdownToggle
                    aria-label="Help"
                    iconComponent={null}
                    onToggle={this._onHelpDropdownToggle}
                    data-test="help-dropdown-toggle"
                  >
                    <QuestionCircleIcon />
                  </DropdownToggle>
                }
                isOpen={isHelpDropdownOpen}
                dropdownItems={this._renderMenuItems(
                  this._helpActions(
                    this._getAdditionalActions(this._getAdditionalLinks(consoleLinks, 'HelpMenu')),
                  ),
                )}
              />
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup>
            {/* mobile -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} className="visible-xs-block" />
            {/* mobile -- kebab dropdown [(cluster manager |) documentation, about (| logout)] */}
            <ToolbarItem className="visible-xs-block">{this._renderMenu(true)}</ToolbarItem>
            {/* desktop -- (user dropdown [logout]) */}
            <ToolbarItem className="hidden-xs">{this._renderMenu(false)}</ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
        <AboutModal isOpen={showAboutModal} closeAboutModal={this._closeAboutModal} />
      </React.Fragment>
    );
  }
}

const mastheadToolbarStateToProps = (state) => ({
  user: state.UI.get('user'),
  consoleLinks: state.UI.get('consoleLinks'),
});

export const MastheadToolbar = connect(
  mastheadToolbarStateToProps,
  { setActivePerspective: UIActions.setActivePerspective },
)(connectToFlags(FLAGS.AUTH_ENABLED, FLAGS.OPENSHIFT, FLAGS.CLUSTER_VERSION)(MastheadToolbar_));
