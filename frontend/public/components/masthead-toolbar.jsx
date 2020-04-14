import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import {
  ArrowCircleUpIcon,
  BellIcon,
  CaretDownIcon,
  EllipsisVIcon,
  PlusCircleIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';
import {
  ApplicationLauncher,
  ApplicationLauncherGroup,
  ApplicationLauncherItem,
  ApplicationLauncherSeparator,
  Button,
  NotificationBadge,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import classNames from 'classnames';
import { FLAGS, YellowExclamationTriangleIcon } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import * as UIActions from '../actions/ui';
import { connectToFlags, flagPending, featureReducerName } from '../reducers/features';
import { authSvc } from '../module/auth';
import { getOCMLink } from '../module/k8s';
import { history, Firehose } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { AboutModal } from './about-modal';
import {
  clusterVersionReference,
  getAvailableClusterUpdates,
  getReportBugLink,
} from '../module/k8s/cluster-settings';
import * as openshiftLogoImg from '../imgs/logos/openshift.svg';

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
        <YellowExclamationTriangleIcon className="co-masthead-icon" />
      </a>
    </ToolbarItem>
  ) : null;

const UpdatesAvailableButton = ({ cv, onClick, systemStatusButtonPresent }) => {
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(cv));
  return updatesAvailable ? (
    <ToolbarItem className={classNames({ 'hidden-sm': systemStatusButtonPresent })}>
      <Button variant="plain" aria-label="Cluster Updates Available" onClick={onClick}>
        <ArrowCircleUpIcon color="#08c" className="co-masthead-icon" />
      </Button>
    </ToolbarItem>
  ) : null;
};

class MastheadToolbarContents_ extends React.Component {
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
    this._renderMenu = this._renderMenu.bind(this);
    this._onClusterUpdatesAvailable = this._onClusterUpdatesAvailable.bind(this);
    this._onApplicationLauncherDropdownSelect = this._onApplicationLauncherDropdownSelect.bind(
      this,
    );
    this._onApplicationLauncherDropdownToggle = this._onApplicationLauncherDropdownToggle.bind(
      this,
    );
    this._onImportYAML = this._onImportYAML.bind(this);
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

  _onImportYAML(e) {
    e.preventDefault();
    const importYAMLPath = formatNamespacedRouteForResource('import', this.props.activeNamespace);
    history.push(importYAMLPath);
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

  _onAboutModal(e) {
    e.preventDefault();
    this.setState({ showAboutModal: true });
  }

  _closeAboutModal() {
    this.setState({ showAboutModal: false });
  }

  _onCommandLineTools(e) {
    e.preventDefault();
    history.push('/command-line-tools');
  }

  _openLink(e, url) {
    e.preventDefault();
    window.open(url, '_blank').opener = null;
  }

  _getAdditionalLinks(links, type) {
    return _.sortBy(
      _.filter(links, (link) => link.spec.location === type),
      'spec.text',
    );
  }

  _getSectionLauncherItems(launcherItems, sectionName) {
    return _.sortBy(
      _.filter(
        launcherItems,
        (link) => _.get(link, 'spec.applicationMenu.section', '') === sectionName,
      ),
      'spec.text',
    );
  }

  _sectionSort(section) {
    switch (section.name) {
      case 'Red Hat Applications':
        return 0;
      case 'Third Party Applications':
        return 1;
      case 'Customer Applications':
        return 2;
      case '':
        return 9; // Items w/o sections go last
      default:
        return 3; // Custom groups come after well-known groups
    }
  }

  _launchActions = () => {
    const { clusterID, consoleLinks } = this.props;
    const launcherItems = this._getAdditionalLinks(consoleLinks, 'ApplicationMenu');

    const sections = [];
    if (
      clusterID &&
      window.SERVER_FLAGS.branding !== 'okd' &&
      window.SERVER_FLAGS.branding !== 'azure'
    ) {
      sections.push({
        name: 'Red Hat Applications',
        isSection: true,
        actions: [
          {
            label: 'OpenShift Cluster Manager',
            externalLink: true,
            href: getOCMLink(clusterID),
            image: <img src={openshiftLogoImg} alt="" />,
          },
        ],
      });
    }

    _.each(launcherItems, (item) => {
      const sectionName = _.get(item, 'spec.applicationMenu.section', '');
      if (!_.find(sections, { name: sectionName })) {
        sections.push({ name: sectionName, isSection: true, actions: [] });
      }
    });

    const sortedSections = _.sortBy(sections, [this._sectionSort, 'name']);

    _.each(sortedSections, (section) => {
      const sectionItems = this._getSectionLauncherItems(launcherItems, section.name);
      _.each(sectionItems, (item) => {
        section.actions.push({
          label: _.get(item, 'spec.text'),
          externalLink: true,
          href: _.get(item, 'spec.href'),
          image: <img src={_.get(item, 'spec.applicationMenu.imageURL')} alt="" />,
        });
      });
    });

    return sections;
  };

  _helpActions(additionalHelpActions) {
    const { flags, cv } = this.props;
    const helpActions = [];
    const reportBugLink = cv && cv.data ? getReportBugLink(cv.data) : null;

    helpActions.push({
      name: '',
      isSection: true,
      actions: [
        {
          label: 'Documentation',
          externalLink: true,
          href: openshiftHelpBase,
        },
        ...(flags[FLAGS.CONSOLE_CLI_DOWNLOAD]
          ? [
              {
                label: 'Command Line Tools',
                callback: this._onCommandLineTools,
              },
            ]
          : []),
        ...(reportBugLink
          ? [
              {
                label: reportBugLink.label,
                externalLink: true,
                callback: (e) => this._openLink(e, reportBugLink.href),
              },
            ]
          : []),
        {
          label: 'About',
          callback: this._onAboutModal,
        },
      ],
    });

    if (!_.isEmpty(additionalHelpActions.actions)) {
      helpActions.push(additionalHelpActions);
    }

    return helpActions;
  }

  _getAdditionalActions(links) {
    const actions = _.map(links, (link) => {
      return {
        callback: (e) => {
          e.preventDefault();
          window.open(link.spec.href, '_blank').opener = null;
        },
        label: link.spec.text,
        externalLink: true,
      };
    });

    return {
      name: '',
      isSection: true,
      actions,
    };
  }

  _externalProps = (action) =>
    action.externalLink ? { isExternal: true, target: '_blank', rel: 'noopener noreferrer' } : {};

  _renderApplicationItems(actions) {
    return _.map(actions, (action, index) => {
      if (action.isSection) {
        return (
          <ApplicationLauncherGroup key={`group_${index}`} label={action.name}>
            <>
              {_.map(action.actions, (sectionAction) => {
                return (
                  <ApplicationLauncherItem
                    key={sectionAction.label}
                    icon={sectionAction.image}
                    href={sectionAction.href || '#'}
                    onClick={sectionAction.callback}
                    {...this._externalProps(sectionAction)}
                  >
                    {sectionAction.label}
                  </ApplicationLauncherItem>
                );
              })}
              {index < actions.length - 1 && (
                <ApplicationLauncherSeparator key={`separator-${index}`} />
              )}
            </>
          </ApplicationLauncherGroup>
        );
      }

      return (
        <ApplicationLauncherGroup key={`group_${index}`}>
          <>
            <ApplicationLauncherItem
              key={action.label}
              icon={action.image}
              href={action.href || '#'}
              onClick={action.callback}
              {...this._externalProps(action)}
            >
              {action.label}
            </ApplicationLauncherItem>
            {index < actions.length - 1 && (
              <ApplicationLauncherSeparator key={`separator-${index}`} />
            )}
          </>
        </ApplicationLauncherGroup>
      );
    });
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
      const userActions = [];

      const logout = (e) => {
        e.preventDefault();
        if (flags[FLAGS.OPENSHIFT]) {
          authSvc.logoutOpenShift(this.state.isKubeAdmin);
        } else {
          authSvc.logout();
        }
      };

      if (window.SERVER_FLAGS.requestTokenURL) {
        userActions.push({
          label: 'Copy Login Command',
          callback: (e) => this._openLink(e, window.SERVER_FLAGS.requestTokenURL),
          externalLink: true,
        });
      }

      userActions.push({
        label: 'Log out',
        callback: logout,
      });

      actions.push({
        name: '',
        isSection: true,
        actions: userActions,
      });
    }

    if (!_.isEmpty(additionalUserActions.actions)) {
      actions.unshift(additionalUserActions);
    }

    if (mobile) {
      actions.unshift(...helpActions);

      actions.unshift({
        name: '',
        isSection: true,
        actions: [
          {
            label: 'Import YAML',
            callback: this._onImportYAML,
          },
        ],
      });

      if (!_.isEmpty(launchActions)) {
        actions.unshift(...launchActions);
      }

      return (
        <ApplicationLauncher
          aria-label="Utility menu"
          className="co-app-launcher"
          onSelect={this._onKebabDropdownSelect}
          onToggle={this._onKebabDropdownToggle}
          isOpen={isKebabDropdownOpen}
          items={this._renderApplicationItems(actions)}
          position="right"
          toggleIcon={<EllipsisVIcon />}
          isGrouped
        />
      );
    }

    if (_.isEmpty(actions)) {
      return <div className="co-username">{username}</div>;
    }

    const userToggle = (
      <span className="pf-c-dropdown__toggle">
        <span className="co-username">{username}</span>
        <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
      </span>
    );

    return (
      <ApplicationLauncher
        aria-label="User menu"
        data-test="user-dropdown"
        className="co-app-launcher co-user-menu"
        onSelect={this._onUserDropdownSelect}
        onToggle={this._onUserDropdownToggle}
        isOpen={isUserDropdownOpen}
        items={this._renderApplicationItems(actions)}
        position="right"
        toggleIcon={userToggle}
        isGrouped
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
    const { consoleLinks, cv, drawerToggle, notificationsRead, canAccessNS } = this.props;
    const launchActions = this._launchActions();
    const alertAccess = canAccessNS && !!window.SERVER_FLAGS.prometheusBaseURL;
    return (
      <>
        <Toolbar>
          <ToolbarGroup className="hidden-xs">
            {/* desktop -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} />
            {/* desktop -- (updates button) */}
            {cv && cv.data && (
              <UpdatesAvailableButton
                cv={cv.data}
                onClick={this._onClusterUpdatesAvailable}
                systemStatusButtonPresent={!_.isEmpty(_.get(statuspageData, 'incidents'))}
              />
            )}
            {/* desktop -- (application launcher dropdown), import yaml, help dropdown [documentation, about] */}
            {!_.isEmpty(launchActions) && (
              <ToolbarItem>
                <ApplicationLauncher
                  className="co-app-launcher"
                  data-test-id="application-launcher"
                  onSelect={this._onApplicationLauncherDropdownSelect}
                  onToggle={this._onApplicationLauncherDropdownToggle}
                  isOpen={isApplicationLauncherDropdownOpen}
                  items={this._renderApplicationItems(this._launchActions())}
                  position="right"
                  isGrouped
                />
              </ToolbarItem>
            )}
            {/* desktop -- (notification drawer button) */
            alertAccess && (
              <ToolbarItem>
                <NotificationBadge
                  aria-label="Notification Drawer"
                  onClick={drawerToggle}
                  isRead={notificationsRead}
                >
                  <BellIcon />
                </NotificationBadge>
              </ToolbarItem>
            )}
            <ToolbarItem>
              <Button variant="plain" aria-label="Import YAML" onClick={this._onImportYAML}>
                <PlusCircleIcon className="co-masthead-icon" />
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <ApplicationLauncher
                aria-label="Help menu"
                className="co-app-launcher"
                data-test="help-dropdown-toggle"
                onSelect={this._onHelpDropdownSelect}
                onToggle={this._onHelpDropdownToggle}
                isOpen={isHelpDropdownOpen}
                items={this._renderApplicationItems(
                  this._helpActions(
                    this._getAdditionalActions(this._getAdditionalLinks(consoleLinks, 'HelpMenu')),
                  ),
                )}
                position="right"
                toggleIcon={<QuestionCircleIcon />}
                isGrouped
              />
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup>
            {/* mobile -- (notification drawer button) */
            alertAccess && !notificationsRead && (
              <ToolbarItem className="visible-xs-block">
                <NotificationBadge
                  aria-label="Notification Drawer"
                  onClick={drawerToggle}
                  isRead={notificationsRead}
                >
                  <BellIcon />
                </NotificationBadge>
              </ToolbarItem>
            )}
            {/* mobile -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} className="visible-xs-block" />
            {/* mobile -- kebab dropdown [(application launcher |) import yaml | documentation, about (| logout)] */}
            <ToolbarItem className="visible-xs-block">{this._renderMenu(true)}</ToolbarItem>
            {/* desktop -- (user dropdown [logout]) */}
            <ToolbarItem className="hidden-xs">{this._renderMenu(false)}</ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
        <AboutModal isOpen={showAboutModal} closeAboutModal={this._closeAboutModal} />
      </>
    );
  }
}

const mastheadToolbarStateToProps = (state) => ({
  activeNamespace: state.UI.get('activeNamespace'),
  clusterID: state.UI.get('clusterID'),
  user: state.UI.get('user'),
  consoleLinks: state.UI.get('consoleLinks'),
  notificationsRead: !!state.UI.getIn(['notifications', 'isRead']),
  canAccessNS: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
});

const MastheadToolbarContents = connect(mastheadToolbarStateToProps, {
  drawerToggle: UIActions.notificationDrawerToggleExpanded,
})(
  connectToFlags(
    FLAGS.AUTH_ENABLED,
    FLAGS.CONSOLE_CLI_DOWNLOAD,
    FLAGS.OPENSHIFT,
  )(MastheadToolbarContents_),
);

export const MastheadToolbar = connectToFlags(FLAGS.CLUSTER_VERSION)(({ flags }) => {
  const resources = flags[FLAGS.CLUSTER_VERSION]
    ? [
        {
          kind: clusterVersionReference,
          name: 'version',
          isList: false,
          prop: 'cv',
        },
      ]
    : [];
  return (
    <Firehose resources={resources}>
      <MastheadToolbarContents />
    </Firehose>
  );
});
