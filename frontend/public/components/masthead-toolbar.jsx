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
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
  TooltipPosition,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { FLAGS, YellowExclamationTriangleIcon } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import CloudShellMastheadButton from '@console/app/src/components/cloud-shell/CloudShellMastheadButton';
import * as UIActions from '../actions/ui';
import { connectToFlags, flagPending, featureReducerName } from '../reducers/features';
import { authSvc } from '../module/auth';
import { getOCMLink, referenceForModel } from '../module/k8s';
import { Firehose } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { AboutModal } from './about-modal';
import { clusterVersionReference, getReportBugLink } from '../module/k8s/cluster-settings';
import * as redhatLogoImg from '../imgs/logos/redhat.svg';
import { GuidedTourMastheadTrigger } from '@console/app/src/components/tour';
import { ConsoleLinkModel } from '../models';

const SystemStatusButton = ({ statuspageData, className }) =>
  !_.isEmpty(_.get(statuspageData, 'incidents')) ? (
    <PageHeaderToolsItem className={className}>
      <a
        className="pf-c-button pf-m-plain"
        aria-label="System Status"
        href={statuspageData.page.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <YellowExclamationTriangleIcon className="co-masthead-icon" />
      </a>
    </PageHeaderToolsItem>
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
    this._resetInactivityTimeout = this._resetInactivityTimeout.bind(this);
    this.userInactivityTimeout = null;
  }

  componentDidMount() {
    if (window.SERVER_FLAGS.statuspageID) {
      this._getStatuspageData(window.SERVER_FLAGS.statuspageID);
    }
    // Ignore inactivity-timeout if set to less then 300 seconds
    const inactivityTimeoutEnabled = window.SERVER_FLAGS.inactivityTimeout >= 300;
    if (inactivityTimeoutEnabled) {
      window.addEventListener('click', _.throttle(this._resetInactivityTimeout, 500));
      window.addEventListener('keydown', _.throttle(this._resetInactivityTimeout, 500));
      this._resetInactivityTimeout();
    }
    this._updateUser();
  }

  componentDidUpdate(prevProps) {
    const { flags, user } = this.props;
    if (
      flags[FLAGS.OPENSHIFT] !== prevProps.flags[FLAGS.OPENSHIFT] ||
      !_.isEqual(user, prevProps.user)
    ) {
      this._updateUser();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this._resetInactivityTimeout);
    window.removeEventListener('keydown', this._resetInactivityTimeout);
    clearTimeout(this.userInactivityTimeout);
  }

  _resetInactivityTimeout() {
    const { flags, user } = this.props;
    clearTimeout(this.userInactivityTimeout);
    this.userInactivityTimeout = setTimeout(() => {
      if (flags[FLAGS.OPENSHIFT]) {
        authSvc.logoutOpenShift(user?.metadata?.name === 'kube:admin');
      } else {
        authSvc.logout();
      }
    }, window.SERVER_FLAGS.inactivityTimeout * 1000);
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
    const launcherItems = this._getAdditionalLinks(consoleLinks?.data, 'ApplicationMenu');

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
          component: <Link to="/quickstart">Quick Starts</Link>,
        },
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
        {
          component: <GuidedTourMastheadTrigger />,
        },
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
      this._getAdditionalLinks(consoleLinks?.data, 'UserMenu'),
    );
    const helpActions = this._helpActions(
      this._getAdditionalActions(this._getAdditionalLinks(consoleLinks?.data, 'HelpMenu')),
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
      return (
        <div data-test="username" className="co-username">
          {username}
        </div>
      );
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
    const { consoleLinks, drawerToggle, canAccessNS, notificationAlerts } = this.props;
    const launchActions = this._launchActions();
    const alertAccess = canAccessNS && !!window.SERVER_FLAGS.prometheusBaseURL;
    return (
      <>
        <PageHeaderTools>
          <PageHeaderToolsGroup className="hidden-xs">
            {/* desktop -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} />
            {/* desktop -- (application launcher dropdown), import yaml, help dropdown [documentation, about] */}
            {!_.isEmpty(launchActions) && (
              <PageHeaderToolsItem>
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
              </PageHeaderToolsItem>
            )}
            {/* desktop -- (notification drawer button) */
            alertAccess && (
              <PageHeaderToolsItem>
                <NotificationBadge
                  aria-label="Notification Drawer"
                  onClick={drawerToggle}
                  isRead
                  count={notificationAlerts?.data?.length || 0}
                >
                  <BellIcon alt="" />
                </NotificationBadge>
              </PageHeaderToolsItem>
            )}
            <PageHeaderToolsItem>
              <Tooltip content="Import YAML" position={TooltipPosition.bottom}>
                <Link
                  to={this._getImportYAMLPath()}
                  className="pf-c-button pf-m-plain"
                  aria-label="Import YAML"
                >
                  <PlusCircleIcon className="co-masthead-icon" alt="" />
                </Link>
              </Tooltip>
            </PageHeaderToolsItem>
            <CloudShellMastheadButton />
            <PageHeaderToolsItem>
              <ApplicationLauncher
                aria-label="Help menu"
                className="co-app-launcher"
                data-test="help-dropdown-toggle"
                data-tour-id="tour-help-button"
                onSelect={this._onHelpDropdownSelect}
                onToggle={this._onHelpDropdownToggle}
                isOpen={isHelpDropdownOpen}
                items={this._renderApplicationItems(
                  this._helpActions(
                    this._getAdditionalActions(
                      this._getAdditionalLinks(consoleLinks?.data, 'HelpMenu'),
                    ),
                  ),
                )}
                position="right"
                toggleIcon={<QuestionCircleIcon alt="" />}
                isGrouped
              />
            </PageHeaderToolsItem>
          </PageHeaderToolsGroup>
          <PageHeaderToolsGroup>
            {/* mobile -- (notification drawer button) */
            alertAccess && notificationAlerts?.data?.length > 0 && (
              <PageHeaderToolsItem className="visible-xs-block">
                <NotificationBadge
                  aria-label="Notification Drawer"
                  onClick={drawerToggle}
                  isRead
                  count={notificationAlerts?.data?.length}
                >
                  <BellIcon />
                </NotificationBadge>
              </PageHeaderToolsItem>
            )}
            {/* mobile -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} className="visible-xs-block" />
            {/* mobile -- kebab dropdown [(application launcher |) import yaml | documentation, about (| logout)] */}
            <PageHeaderToolsItem className="visible-xs-block">
              {this._renderMenu(true)}
            </PageHeaderToolsItem>
            {/* desktop -- (user dropdown [logout]) */}
            <PageHeaderToolsItem className="hidden-xs">
              {this._renderMenu(false)}
            </PageHeaderToolsItem>
          </PageHeaderToolsGroup>
        </PageHeaderTools>
        <AboutModal isOpen={showAboutModal} closeAboutModal={this._closeAboutModal} />
      </>
    );
  }
}

const mastheadToolbarStateToProps = (state) => ({
  activeNamespace: state.UI.get('activeNamespace'),
  clusterID: state.UI.get('clusterID'),
  user: state.UI.get('user'),
  notificationAlerts: state.UI.getIn(['monitoring', 'notificationAlerts']),
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

export const MastheadToolbar = connectToFlags(
  FLAGS.CLUSTER_VERSION,
  FLAGS.CONSOLE_LINK,
)(({ flags }) => {
  const resources = [];
  if (flags[FLAGS.CLUSTER_VERSION]) {
    resources.push({
      kind: clusterVersionReference,
      name: 'version',
      isList: false,
      prop: 'cv',
    });
  }
  if (flags[FLAGS.CONSOLE_LINK]) {
    resources.push({
      kind: referenceForModel(ConsoleLinkModel),
      isList: true,
      prop: 'consoleLinks',
    });
  }

  return (
    <Firehose resources={resources}>
      <MastheadToolbarContents />
    </Firehose>
  );
});
