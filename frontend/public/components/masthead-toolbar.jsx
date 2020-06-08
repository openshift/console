import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import {
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
  NotificationBadge,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  TooltipPosition,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { FLAGS, YellowExclamationTriangleIcon } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import CloudShellMastheadButton from '@console/app/src/components/cloud-shell/CloudShellMastheadButton';
import { connectToFlags, flagPending } from '@console/shared/src/hocs/connect-flags';
import * as UIActions from '../actions/ui';
import { authSvc } from '../module/auth';
import { getOCMLink } from '../module/k8s';
import { Firehose } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { AboutModal } from './about-modal';
import { clusterVersionReference, getReportBugLink } from '../module/k8s/cluster-settings';
import * as redhatLogoImg from '../imgs/logos/redhat.svg';

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
    this._getImportYAMLPath = this._getImportYAMLPath.bind(this);
    this._updateUser = this._updateUser.bind(this);
    this._onUserDropdownToggle = this._onUserDropdownToggle.bind(this);
    this._onUserDropdownSelect = this._onUserDropdownSelect.bind(this);
    this._onKebabDropdownToggle = this._onKebabDropdownToggle.bind(this);
    this._onKebabDropdownSelect = this._onKebabDropdownSelect.bind(this);
    this._renderMenu = this._renderMenu.bind(this);
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

  _getImportYAMLPath() {
    return formatNamespacedRouteForResource('import', this.props.activeNamespace);
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

  _onAboutModal(e) {
    e.preventDefault();
    this.setState({ showAboutModal: true });
  }

  _closeAboutModal() {
    this.setState({ showAboutModal: false });
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
            image: <img src={redhatLogoImg} alt="" />,
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
                component: <Link to="/command-line-tools">Command Line Tools</Link>,
              },
            ]
          : []),
        ...(reportBugLink
          ? [
              {
                label: reportBugLink.label,
                externalLink: true,
                href: reportBugLink.href,
              },
            ]
          : []),
        {
          label: 'About',
          callback: this._onAboutModal,
          component: 'button',
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
        label: link.spec.text,
        externalLink: true,
        href: link.spec.href,
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
    return _.map(actions, (action, groupIndex) => {
      if (action.isSection) {
        return (
          <ApplicationLauncherGroup key={groupIndex} label={action.name}>
            <>
              {_.map(action.actions, (sectionAction, itemIndex) => {
                return (
                  <ApplicationLauncherItem
                    key={itemIndex}
                    icon={sectionAction.image}
                    href={sectionAction.href || '#'}
                    onClick={sectionAction.callback}
                    component={sectionAction.component}
                    {...this._externalProps(sectionAction)}
                  >
                    {sectionAction.label}
                  </ApplicationLauncherItem>
                );
              })}
              {groupIndex < actions.length - 1 && (
                <ApplicationLauncherSeparator key={`separator-${groupIndex}`} />
              )}
            </>
          </ApplicationLauncherGroup>
        );
      }

      return (
        <ApplicationLauncherGroup key={groupIndex}>
          <>
            <ApplicationLauncherItem
              key={action.label}
              icon={action.image}
              href={action.href || '#'}
              onClick={action.callback}
              component={action.component}
              {...this._externalProps(action)}
            >
              {action.label}
            </ApplicationLauncherItem>
            {groupIndex < actions.length - 1 && (
              <ApplicationLauncherSeparator key={`separator-${groupIndex}`} />
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
          href: window.SERVER_FLAGS.requestTokenURL,
          externalLink: true,
        });
      }

      userActions.push({
        label: 'Log out',
        callback: logout,
        component: 'button',
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
            component: <Link to={this._getImportYAMLPath()}>Import YAML</Link>,
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
    const { consoleLinks, drawerToggle, notificationsRead, canAccessNS } = this.props;
    const launchActions = this._launchActions();
    const alertAccess = canAccessNS && !!window.SERVER_FLAGS.prometheusBaseURL;
    return (
      <>
        <Toolbar>
          <ToolbarGroup className="hidden-xs">
            {/* desktop -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} />
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
              <Tooltip content="Import YAML" position={TooltipPosition.bottom}>
                <Link
                  to={this._getImportYAMLPath()}
                  className="pf-c-button pf-m-plain"
                  aria-label="Import YAML"
                >
                  <PlusCircleIcon className="co-masthead-icon" />
                </Link>
              </Tooltip>
            </ToolbarItem>
            <CloudShellMastheadButton />
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
  canAccessNS: !!state.FLAGS.get(FLAGS.CAN_GET_NS),
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
