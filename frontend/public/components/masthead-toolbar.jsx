import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { BellIcon, EllipsisVIcon, PlusCircleIcon, QuestionCircleIcon, ClockIcon, GlobeAmericasIcon, AngleDownIcon } from '@patternfly/react-icons';
import { ApplicationLauncher, ApplicationLauncherGroup, ApplicationLauncherItem, ApplicationLauncherSeparator, NotificationBadge, Toolbar, ToolbarGroup, ToolbarItem, TooltipPosition, Tooltip, Button, Badge } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { FLAGS, YellowExclamationTriangleIcon } from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import CloudShellMastheadButton from '@console/app/src/components/cloud-shell/CloudShellMastheadButton';
import * as UIActions from '../actions/ui';
import { connectToFlags, flagPending, featureReducerName } from '../reducers/features';
import { authSvc } from '../module/auth';
import { getOCMLink } from '../module/k8s';
import { Firehose } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { AboutModal } from './about-modal';
import { clusterVersionReference, getReportBugLink } from '../module/k8s/cluster-settings';
import * as redhatLogoImg from '../imgs/logos/redhat.svg';
import { ExpTimer } from './hypercloud/exp-timer';
import { setAccessToken } from '../hypercloud/auth';
import { withTranslation } from 'react-i18next';
import i18n from 'i18next';

const SystemStatusButton = ({ statuspageData, className }) =>
  !_.isEmpty(_.get(statuspageData, 'incidents')) ? (
    <ToolbarItem className={className}>
      <a className="pf-c-button pf-m-plain" aria-label="System Status" href={statuspageData.page.url} target="_blank" rel="noopener noreferrer">
        <YellowExclamationTriangleIcon className="co-masthead-icon" />
      </a>
    </ToolbarItem>
  ) : null;

class MastheadToolbarContents_ extends React.Component {
  constructor(props) {
    super(props);
    this.timerRef = null;
    this.state = {
      isApplicationLauncherDropdownOpen: false,
      isUserDropdownOpen: false,
      isLanguageDropdownOpen: false,
      isKebabDropdownOpen: false,
      statuspageData: null,
      isKubeAdmin: false,
      showAboutModal: false,
    };

    this._getStatuspageData = this._getStatuspageData.bind(this);
    this._getImportYAMLPath = this._getImportYAMLPath.bind(this);
    this._updateUser = this._updateUser.bind(this);
    this._onUserDropdownToggle = this._onUserDropdownToggle.bind(this);
    this._onUserDropdownSelect = this._onUserDropdownSelect.bind(this);
    this._onLanguageDropdownToggle = this._onLanguageDropdownToggle.bind(this);
    this._onLanguageDropdownSelect = this._onLanguageDropdownSelect.bind(this);
    this._onKebabDropdownToggle = this._onKebabDropdownToggle.bind(this);
    this._onKebabDropdownSelect = this._onKebabDropdownSelect.bind(this);
    this._renderMenu = this._renderMenu.bind(this);
    this._renderLanguageMenu = this._renderLanguageMenu.bind(this);
    this._onApplicationLauncherDropdownSelect = this._onApplicationLauncherDropdownSelect.bind(this);
    this._onApplicationLauncherDropdownToggle = this._onApplicationLauncherDropdownToggle.bind(this);
    this._onHelpDropdownSelect = this._onHelpDropdownSelect.bind(this);
    this._onHelpDropdownToggle = this._onHelpDropdownToggle.bind(this);
    this._onAboutModal = this._onAboutModal.bind(this);
    this._closeAboutModal = this._closeAboutModal.bind(this);
    this._tokenRefresh = this._tokenRefresh.bind(this);
  }

  _getStatuspageData(statuspageID) {
    fetch(`https://${statuspageID}.statuspage.io/api/v2/summary.json`, {
      headers: { Accept: 'application/json' },
    })
      .then(response => response.json())
      .then(statuspageData => this.setState({ statuspageData }));
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

  _onLanguageDropdownToggle(isLanguageDropdownOpen) {
    this.setState({
      isLanguageDropdownOpen,
    });
  }

  _onLanguageDropdownSelect() {
    this.setState({
      isLanguageDropdownOpen: !this.state.isLanguageDropdownOpen,
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
      _.filter(links, link => link.spec.location === type),
      'spec.text',
    );
  }

  _getSectionLauncherItems(launcherItems, sectionName) {
    return _.sortBy(
      _.filter(launcherItems, link => _.get(link, 'spec.applicationMenu.section', '') === sectionName),
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
    const actions = _.map(links, link => {
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

  _externalProps = action => (action.externalLink ? { isExternal: true, target: '_blank', rel: 'noopener noreferrer' } : {});

  _renderApplicationItems(actions) {
    return _.map(actions, (action, groupIndex) => {
      if (action.isSection) {
        return (
          <ApplicationLauncherGroup key={groupIndex} label={action.name}>
            <>
              {_.map(action.actions, (sectionAction, itemIndex) => {
                return (
                  <ApplicationLauncherItem key={itemIndex} icon={sectionAction.image} href={sectionAction.href || '#'} onClick={sectionAction.callback} component={sectionAction.component} {...this._externalProps(sectionAction)}>
                    {sectionAction.label}
                  </ApplicationLauncherItem>
                );
              })}
              {groupIndex < actions.length - 1 && <ApplicationLauncherSeparator key={`separator-${groupIndex}`} />}
            </>
          </ApplicationLauncherGroup>
        );
      }

      return (
        <ApplicationLauncherGroup key={groupIndex}>
          <>
            <ApplicationLauncherItem key={action.label} icon={action.image} href={action.href || '#'} onClick={action.callback} component={action.component} {...this._externalProps(action)}>
              {action.label}
            </ApplicationLauncherItem>
            {groupIndex < actions.length - 1 && <ApplicationLauncherSeparator key={`separator-${groupIndex}`} />}
          </>
        </ApplicationLauncherGroup>
      );
    });
  }

  _renderMenu(mobile) {
    const { flags, consoleLinks, keycloak, t } = this.props;
    const username = !!keycloak.idTokenParsed.preferred_username ? keycloak.idTokenParsed.preferred_username : keycloak.idTokenParsed.email;
    const { isUserDropdownOpen, isKebabDropdownOpen } = this.state;
    const additionalUserActions = this._getAdditionalActions(this._getAdditionalLinks(consoleLinks, 'UserMenu'));
    const helpActions = this._helpActions(this._getAdditionalActions(this._getAdditionalLinks(consoleLinks, 'HelpMenu')));

    const actions = [];
    const userActions = [];

    const openAccountConsole = e => {
      e.preventDefault();
      window.open(keycloak.createAccountUrl());
    };

    const logout = e => {
      e.preventDefault();

      keycloak.logout();
    };

    userActions.push({
      label: t('COMMON:MSG_GNB_ACCOUNT_1'),
      callback: openAccountConsole,
      component: 'button',
    });

    userActions.push({
      label: t('COMMON:MSG_GNB_ACCOUNT_2'),
      callback: logout,
      component: 'button',
    });

    actions.push({
      name: '',
      isSection: true,
      actions: userActions,
    });

    if (!_.isEmpty(additionalUserActions.actions)) {
      actions.unshift(additionalUserActions);
    }

    if (mobile) {
      actions.unshift(...helpActions);

      // actions.unshift({
      //   name: '',
      //   isSection: true,
      //   actions: [
      //     {
      //       component: <Link to={this._getImportYAMLPath()}>Import YAML</Link>,
      //     },
      //   ],
      // });

      return <ApplicationLauncher aria-label="Utility menu" className="co-app-launcher" onSelect={this._onKebabDropdownSelect} onToggle={this._onKebabDropdownToggle} isOpen={isKebabDropdownOpen} items={this._renderApplicationItems(actions)} position="right" toggleIcon={<EllipsisVIcon />} isGrouped />;
    }

    if (_.isEmpty(actions)) {
      return <div className="co-username">{username}</div>;
    }

    const userToggle = (
      <span className="pf-c-dropdown__toggle">
        <span className="co-username">{username}</span>
        <AngleDownIcon className="pf-c-dropdown__toggle-icon" />
      </span>
    );

    return <ApplicationLauncher aria-label="User menu" data-test="user-dropdown" className="co-app-launcher co-user-menu" onSelect={this._onUserDropdownSelect} onToggle={this._onUserDropdownToggle} isOpen={isUserDropdownOpen} items={this._renderApplicationItems(actions)} position="right" toggleIcon={userToggle} isGrouped />;
  }
  _renderLanguageMenu(mobile) {
    const { flags, consoleLinks, keycloak, t } = this.props;
    const { isLanguageDropdownOpen } = this.state;

    const actions = [];
    const i18nActions = [];

    const enChange = e => {
      e.preventDefault();
      i18n.changeLanguage('en');
      window.localStorage.setItem('i18nextLng', 'en');
    };
    const koChange = e => {
      e.preventDefault();
      i18n.changeLanguage('ko');
      window.localStorage.setItem('i18nextLng', 'ko');
    };

    i18nActions.push({
      label: t('COMMON:MSG_GNB_LANGUAGE_2'),
      callback: enChange,
      component: 'button',
    });

    i18nActions.push({
      label: t('COMMON:MSG_GNB_LANGUAGE_1'),
      callback: koChange,
      component: 'button',
    });

    actions.push({
      name: '',
      isSection: true,
      actions: i18nActions,
    });

    if (mobile) {
      actions.unshift({
        name: '',
        isSection: true,
        actions: [],
      });

      return <ApplicationLauncher aria-label="Utility menu" className="co-app-launcher" onSelect={this._onKebabDropdownSelect} onToggle={this._onKebabDropdownToggle} isOpen={isKebabDropdownOpen} items={this._renderApplicationItems(actions)} position="right" toggleIcon={<EllipsisVIcon />} isGrouped />;
    }

    if (_.isEmpty(actions)) {
      return <div className="co-username"></div>;
    }

    const languageToggle = (
      <span className="pf-c-dropdown__toggle">
        {/* i18n 키값 요청 후 적용하기 - 현재 선택된 언어를 표현하는 키값 - 한국어, 영어 */}
        <GlobeAmericasIcon />
        <span className="co-username">Language</span>
        <AngleDownIcon className="pf-c-dropdown__toggle-icon" />
      </span>
    );

    return <ApplicationLauncher aria-label="Language menu" data-test="language-dropdown" className="co-app-launcher co-user-menu" onSelect={this._onLanguageDropdownSelect} onToggle={this._onLanguageDropdownToggle} isOpen={isLanguageDropdownOpen} items={this._renderApplicationItems(actions)} position="right" toggleIcon={languageToggle} isGrouped />;
  }

  _tokenRefresh = () => {
    const { keycloak } = this.props;
    const curTime = new Date();
    const tokenExpTime = new Date((keycloak.idTokenParsed.exp + keycloak.timeSkew) * 1000);
    const logoutTime = (tokenExpTime.getTime() - curTime.getTime()) / 1000;
    keycloak
      .updateToken(Math.ceil(logoutTime))
      .then(refreshed => {
        console.log('refreshed', refreshed);
        if (refreshed) {
          // TODO: 토큰 설정
          setAccessToken(keycloak.idToken);
          this.timerRef.tokRefresh();
        } else {
          // expired time > 60
          console.log('Token is still valid');
        }
      })
      .catch(() => {
        // refresh token 없음
        console.log('Failed to refresh the token, or the session has expired');
      });
  };

  render() {
    const { isApplicationLauncherDropdownOpen, isHelpDropdownOpen, showAboutModal, statuspageData } = this.state;
    const { consoleLinks, drawerToggle, notificationsRead, canAccessNS, keycloak, t } = this.props;
    // TODO: notificatoin 기능 완료 되면 추가하기.
    const alertAccess = false; //canAccessNS && !!window.SERVER_FLAGS.prometheusBaseURL;
    return (
      <>
        <Toolbar>
          <ToolbarGroup className="hidden-xs">
            <ToolbarItem>
              <ClockIcon />
            </ToolbarItem>
            <ToolbarItem>
              <ExpTimer
                ref={input => {
                  this.timerRef = input;
                }}
                logout={keycloak.logout}
                tokenRefresh={this._tokenRefresh}
                keycloak={keycloak}
              />
            </ToolbarItem>
            <ToolbarItem>
              <Badge
                key={1}
                onClick={() => {
                  this._tokenRefresh();
                }}
              >
                {t('COMMON:MSG_GNB_SESSION_1')}
              </Badge>
            </ToolbarItem>
            {/* desktop -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} />
            {/* desktop -- (application launcher dropdown), import yaml, help dropdown [documentation, about] */}
            <ToolbarItem>
              <div className="co-masthead__line"></div>
            </ToolbarItem>
            {/* desktop -- (user dropdown [logout]) */}
            <ToolbarItem className="hidden-xs">{this._renderLanguageMenu(false)}</ToolbarItem>
            <ToolbarItem>
              <div className="co-masthead__line"></div>
            </ToolbarItem>{' '}
            {/* desktop -- (notification drawer button) */
            alertAccess && (
              <ToolbarItem>
                <NotificationBadge aria-label="Notification Drawer" onClick={drawerToggle} isRead={notificationsRead}>
                  <BellIcon />
                </NotificationBadge>
              </ToolbarItem>
            )}
            {/* <ToolbarItem>
              <Tooltip content="Import YAML" position={TooltipPosition.bottom}>
                <Link to={this._getImportYAMLPath()} className="pf-c-button pf-m-plain" aria-label="Import YAML">
                  <PlusCircleIcon className="co-masthead-icon" />
                </Link>
              </Tooltip>
            </ToolbarItem> */}
            <CloudShellMastheadButton />
            {/* TODO: 매뉴얼 완료 후 매뉴얼로 이동하는 링크 추가하기 */}
            {/* <ToolbarItem className="co-masthead-icon__button">
              <QuestionCircleIcon />
            </ToolbarItem> */}
          </ToolbarGroup>
          <ToolbarGroup>
            {/* mobile -- (notification drawer button) */
            // 기능 추가되면 완성하기
            alertAccess && !notificationsRead && (
              <ToolbarItem className="visible-xs-block">
                <NotificationBadge aria-label="Notification Drawer" onClick={drawerToggle} isRead={notificationsRead}>
                  <BellIcon />
                </NotificationBadge>
              </ToolbarItem>
            )}
            {/* mobile -- (system status button) */}
            <SystemStatusButton statuspageData={statuspageData} className="visible-xs-block" />
            {/* mobile -- kebab dropdown [(application launcher |) import yaml | documentation, about (| logout)] */}
            <ToolbarItem className="visible-xs-block">{this._renderMenu(true)}</ToolbarItem>
            <ToolbarItem className="hidden-xs">{this._renderMenu(false)}</ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
        <AboutModal isOpen={showAboutModal} closeAboutModal={this._closeAboutModal} />
      </>
    );
  }
}

const mastheadToolbarStateToProps = state => ({
  activeNamespace: state.UI.get('activeNamespace'),
  clusterID: state.UI.get('clusterID'),
  user: state.UI.get('user'),
  consoleLinks: state.UI.get('consoleLinks'),
  notificationsRead: !!state.UI.getIn(['notifications', 'isRead']),
  canAccessNS: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
});

const MastheadToolbarContents = connect(mastheadToolbarStateToProps, {
  drawerToggle: UIActions.notificationDrawerToggleExpanded,
})(connectToFlags(FLAGS.AUTH_ENABLED, FLAGS.CONSOLE_CLI_DOWNLOAD, FLAGS.OPENSHIFT)(withTranslation()(MastheadToolbarContents_)));

export const MastheadToolbar = connectToFlags(FLAGS.CLUSTER_VERSION)(({ flags, keycloak }) => {
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
      <MastheadToolbarContents keycloak={keycloak} />
    </Firehose>
  );
});
