import * as React from 'react';
import * as _ from 'lodash-es';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { ThIcon } from '@patternfly/react-icons/dist/esm/icons/th-icon';
import { QuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import {
  Dropdown,
  Divider,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  NotificationBadge,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import {
  ACM_LINK_ID,
  FLAGS,
  useActiveNamespace,
  useCopyCodeModal,
  useCopyLoginCommands,
  useFlag,
  usePerspectiveExtension,
  useTelemetry,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import CloudShellMastheadButton from '@console/webterminal-plugin/src/components/cloud-shell/CloudShellMastheadButton';
import CloudShellMastheadAction from '@console/webterminal-plugin/src/components/cloud-shell/CloudShellMastheadAction';
import { getUser } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import * as UIActions from '../actions/ui';
import { flagPending, featureReducerName } from '../reducers/features';
import { authSvc } from '../module/auth';
import { getOCMLink, referenceForModel } from '../module/k8s';
import { Firehose } from './utils';
import { openshiftHelpBase } from './utils/documentation';
import { AboutModal } from './about-modal';
import { clusterVersionReference, getReportBugLink } from '../module/k8s/cluster-settings';
import redhatLogoImg from '../imgs/logos/redhat.svg';
import { GuidedTourMastheadTrigger } from '@console/app/src/components/tour';
import { ConsoleLinkModel } from '../models';
import ClusterMenu from '@console/app/src/components/nav/ClusterMenu';
import { ACM_PERSPECTIVE_ID } from '@console/app/src/consts';
import { FeedbackModal } from '@patternfly/react-user-feedback';
import { useFeedbackLocal } from './feedback-local';
import { action as reduxAction } from 'typesafe-actions';
import feedbackImage from '@patternfly/react-user-feedback/dist/esm/images/rh_feedback.svg';
import QuickCreate, { QuickCreateImportFromGit, QuickCreateContainerImages } from './QuickCreate';

const LAST_CONSOLE_ACTIVITY_TIMESTAMP_LOCAL_STORAGE_KEY = 'last-console-activity-timestamp';

const defaultHelpLinks = [
  {
    // t('public~Learning Portal')
    label: 'Learning Portal',
    externalLink: true,
    href: 'https://learn.openshift.com/?ref=webconsole',
  },
  {
    // t('public~OpenShift Blog')
    label: 'OpenShift Blog',
    externalLink: true,
    href: 'https://blog.openshift.com',
  },
];

const MultiClusterToolbarGroup = () => {
  const acmPerspectiveExtension = usePerspectiveExtension(ACM_PERSPECTIVE_ID);
  return (
    !!acmPerspectiveExtension && (
      <ToolbarGroup spacer={{ default: 'spacerNone' }}>
        <ClusterMenu />
      </ToolbarGroup>
    )
  );
};

const FeedbackModalLocalized = ({ isOpen, onClose, reportBugLink }) => {
  const feedbackLocales = useFeedbackLocal(reportBugLink);
  return (
    <FeedbackModal
      onShareFeedback="https://console.redhat.com/self-managed-feedback-form?source=openshift"
      onOpenSupportCase={reportBugLink.href}
      feedbackLocale={feedbackLocales}
      onJoinMailingList="https://console.redhat.com/self-managed-research-form?source=openshift"
      feedbackImg={feedbackImage}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

const SystemStatusButton = ({ statuspageData }) => {
  const { t } = useTranslation();
  return !_.isEmpty(_.get(statuspageData, 'incidents')) ? (
    <a
      className="pf-v5-c-button pf-m-plain"
      aria-label={t('public~System status')}
      href={statuspageData.page.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <YellowExclamationTriangleIcon className="co-masthead-icon" />
    </a>
  ) : null;
};

// TODO migrate to TS, break this down into smaller components and hooks
const MastheadToolbarContents = ({ consoleLinks, cv, isMastheadStacked }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const authEnabledFlag = useFlag(FLAGS.AUTH_ENABLED);
  const consoleCLIDownloadFlag = useFlag(FLAGS.CONSOLE_CLI_DOWNLOAD);
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const quickstartFlag = useFlag(FLAGS.CONSOLE_QUICKSTART);
  const dispatch = useDispatch();
  const [activeNamespace] = useActiveNamespace();
  const [requestTokenURL, externalLoginCommand] = useCopyLoginCommands();
  const launchCopyLoginCommandModal = useCopyCodeModal(
    t('public~Login with this command'),
    externalLoginCommand,
  );
  const { clusterID, user, alertCount, canAccessNS } = useSelector((state) => ({
    clusterID: state.UI.get('clusterID'),
    user: getUser(state),
    alertCount: state.observe.getIn(['alertCount']),
    canAccessNS: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
  }));
  const [isAppLauncherDropdownOpen, setIsAppLauncherDropdownOpen] = React.useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isKebabDropdownOpen, setIsKebabDropdownOpen] = React.useState(false);
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = React.useState(false);
  const [statusPageData, setStatusPageData] = React.useState(null);
  const [showAboutModal, setshowAboutModal] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  const applicationLauncherMenuRef = React.useRef(null);
  const helpMenuRef = React.useRef(null);
  const userMenuRef = React.useRef(null);
  const kebabMenuRef = React.useRef(null);
  const reportBugLink = cv?.data ? getReportBugLink(cv.data, t) : null;
  const userInactivityTimeout = React.useRef(null);
  const username = user?.username ?? '';
  const isKubeAdmin = username === 'kube:admin';

  const drawerToggle = React.useCallback(
    () => dispatch(UIActions.notificationDrawerToggleExpanded()),
    [dispatch],
  );

  const getImportYAMLPath = () => formatNamespacedRouteForResource('import', activeNamespace);
  const onFeedbackModal = () => setIsFeedbackModalOpen(true);
  const onAboutModal = (e) => {
    e.preventDefault();
    setshowAboutModal(true);
  };

  const closeAboutModal = () => setshowAboutModal(false);

  const getAdditionalLinks = (links, type) =>
    _.sortBy(
      // ACM link is being moved to the perspective switcher, so do not show in application launcher
      _.filter(links, (link) => link.spec.location === type && link.metadata.name !== ACM_LINK_ID),
      'spec.text',
    );

  const getSectionLauncherItems = (launcherItems, sectionName) =>
    _.sortBy(
      _.filter(
        launcherItems,
        (link) => _.get(link, 'spec.applicationMenu.section', '') === sectionName,
      ),
      'spec.text',
    );

  const sectionSort = (section) => {
    switch (section.name) {
      case 'Red Hat Applications':
        return 0;
      case 'Third Party Applications':
        return 1;
      case 'Customer Applications':
        return 2;
      case 'Troubleshooting':
        return 3;
      case '':
        return 9; // Items w/o sections go last
      default:
        return 3; // Custom groups come after well-known groups
    }
  };

  const getLaunchActions = () => {
    const isTroubleshootingPanelEnabled = Array.isArray(window.SERVER_FLAGS.consolePlugins)
      ? window.SERVER_FLAGS.consolePlugins.includes('troubleshooting-panel-console-plugin')
      : false;
    const launcherItems = getAdditionalLinks(consoleLinks?.data, 'ApplicationMenu');

    const sections = [];
    if (
      clusterID &&
      window.SERVER_FLAGS.branding !== 'okd' &&
      window.SERVER_FLAGS.branding !== 'azure'
    ) {
      sections.push({
        name: t('public~Red Hat Applications'),
        isSection: true,
        actions: [
          {
            label: t('public~OpenShift Cluster Manager'),
            externalLink: true,
            href: getOCMLink(clusterID),
            image: <img src={redhatLogoImg} alt="" />,
            callback: () => {
              fireTelemetryEvent('Launcher Menu Accessed', {
                id: 'OpenShift Cluster Manager',
                name: 'OpenShift Cluster Manager',
              });
            },
          },
          {
            label: t('public~Red Hat Hybrid Cloud Console'),
            externalLink: true,
            href: 'https://console.redhat.com',
            image: <img src={redhatLogoImg} alt="" />,
            callback: () => {
              fireTelemetryEvent('Launcher Menu Accessed', {
                id: 'Red Hat Hybrid Cloud Console',
                name: 'Red Hat Hybrid Cloud Console',
              });
            },
          },
        ],
      });
    }

    // This should be removed when the extension to add items to the masthead is implemented: https://issues.redhat.com/browse/OU-488
    if (isTroubleshootingPanelEnabled) {
      sections.push({
        name: t('public~Troubleshooting'),
        isSection: true,
        actions: [
          {
            label: t('public~Signal Correlation'),
            callback: (e) => {
              e.preventDefault();
              dispatch(reduxAction('openTroubleshootingPanel'));
              fireTelemetryEvent('Launcher Menu Accessed', {
                id: 'Signal Correlation',
                name: 'Signal Correlation',
              });
            },
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

    const sortedSections = _.sortBy(sections, [sectionSort, 'name']);

    _.each(sortedSections, (section) => {
      const sectionItems = getSectionLauncherItems(launcherItems, section.name);
      _.each(sectionItems, (item) => {
        section.actions.push({
          label: _.get(item, 'spec.text'),
          externalLink: true,
          href: _.get(item, 'spec.href'),
          image: <img src={_.get(item, 'spec.applicationMenu.imageURL')} alt="" />,
          callback: () => {
            fireTelemetryEvent('Launcher Menu Accessed', {
              id: item.metadata.name,
              name: _.get(item, 'spec.text'),
            });
          },
        });
      });
    });

    return sections;
  };

  const getHelpActions = (additionalHelpActions) => {
    const helpActions = [];
    const tourRef = React.createRef();

    helpActions.push({
      isSection: true,
      actions: [
        ...(quickstartFlag
          ? [
              {
                label: t('public~Quick Starts'),
                callback: (e) => {
                  e.preventDefault();
                  history.push('/quickstart');
                },
              },
            ]
          : []),
        {
          label: t('public~Documentation'),
          externalLink: true,
          href: openshiftHelpBase,
          callback: () => {
            fireTelemetryEvent('Documentation Clicked');
          },
        },
        ...(consoleCLIDownloadFlag
          ? [
              {
                label: t('public~Command Line Tools'),
                callback: (e) => {
                  e.preventDefault();
                  history.push('/command-line-tools');
                  fireTelemetryEvent('CLI Clicked');
                },
              },
            ]
          : []),
        {
          component: () => (
            <GuidedTourMastheadTrigger ref={tourRef} className="pf-v5-c-menu__item" />
          ),
        },
        ...(reportBugLink
          ? [
              {
                label: t('public~Share Feedback'),
                callback: (e) => {
                  e.preventDefault();
                  onFeedbackModal(reportBugLink);
                },
              },
            ]
          : []),
        {
          label: t('public~About'),
          callback: onAboutModal,
        },
      ],
    });

    // Add default help links to start of additional links from operator
    additionalHelpActions.actions = defaultHelpLinks
      .map((helpLink) => ({
        ...helpLink,
        label: t(`public~${helpLink.label}`),
      }))
      .concat(additionalHelpActions.actions);

    if (!_.isEmpty(additionalHelpActions.actions)) {
      helpActions.push(additionalHelpActions);
    }

    return helpActions;
  };

  const getAdditionalActions = (links) => {
    const actions = _.map(links, (link) => {
      return {
        label: link.spec.text,
        externalLink: true,
        href: link.spec.href,
      };
    });

    return {
      isSection: true,
      actions,
    };
  };

  const externalProps = (externalLink) => (externalLink ? { rel: 'noopener noreferrer' } : {});

  const renderApplicationItems = (actions) =>
    _.map(actions, (action, groupIndex) => {
      if (action.isSection) {
        const list = (
          <DropdownList>
            {_.map(action.actions, (sectionAction, itemIndex) => {
              return (
                <DropdownItem
                  key={itemIndex}
                  icon={sectionAction.image}
                  to={sectionAction.href}
                  isExternalLink={sectionAction.externalLink}
                  {...externalProps(sectionAction.externalLink)}
                  onClick={sectionAction.callback}
                  component={sectionAction.component}
                  data-test={
                    sectionAction.dataTest ? sectionAction.dataTest : 'application-launcher-item'
                  }
                  value={sectionAction.label}
                >
                  {sectionAction.label}
                </DropdownItem>
              );
            })}
          </DropdownList>
        );
        return (
          <>
            {action.name ? (
              <DropdownGroup key={groupIndex} label={action.name}>
                {list}
              </DropdownGroup>
            ) : (
              <>{list}</>
            )}
            <>{groupIndex < actions.length - 1 && <Divider key={`separator-${groupIndex}`} />}</>
          </>
        );
      }

      return (
        <>
          <DropdownList>
            <DropdownItem
              key={action.label}
              icon={action.image}
              to={action.href}
              isExternalLink={action.externalLink}
              {...externalProps(action.externalLink)}
              onClick={action.callback}
              component={action.component}
              value={action.label}
            >
              {action.label}
            </DropdownItem>
          </DropdownList>
          {groupIndex < actions.length - 1 && <Divider key={`separator-${groupIndex}`} />}
        </>
      );
    });

  const renderMenu = (mobile) => {
    const additionalUserActions = getAdditionalActions(
      getAdditionalLinks(consoleLinks?.data, 'UserMenu'),
    );
    const helpActions = getHelpActions(
      getAdditionalActions(getAdditionalLinks(consoleLinks?.data, 'HelpMenu')),
    );
    const launchActions = getLaunchActions();

    if (flagPending(openshiftFlag) || flagPending(authEnabledFlag)) {
      return null;
    }

    const actions = [];
    const userActions = [
      {
        label: t('public~User Preferences'),
        callback: (e) => {
          e.preventDefault();
          history.push('/user-preferences');
        },
      },
    ];

    if (authEnabledFlag) {
      const logout = (e) => {
        e.preventDefault();
        authSvc.logout('', isKubeAdmin);
      };
      if (requestTokenURL) {
        userActions.unshift({
          label: t('public~Copy login command'),
          href: requestTokenURL,
          externalLink: true,
          dataTest: 'copy-login-command',
        });
      } else if (externalLoginCommand) {
        userActions.unshift({
          callback: launchCopyLoginCommandModal,
          dataTest: 'copy-login-command',
          label: t('public~Copy login command'),
        });
      }

      userActions.push({
        label: t('public~Log out'),
        callback: logout,
        dataTest: 'log-out',
      });
    }

    actions.push({
      isSection: true,
      actions: userActions,
    });

    if (!_.isEmpty(additionalUserActions.actions)) {
      actions.unshift(additionalUserActions);
    }

    if (mobile) {
      actions.unshift(...helpActions);

      actions.unshift({
        isSection: true,
        actions: [
          {
            label: t('public~Import YAML'),
            callback: (e) => {
              e.preventDefault();
              history.push(getImportYAMLPath());
            },
          },
          {
            component: () => (
              <QuickCreateImportFromGit
                namespace={activeNamespace}
                className="pf-v5-c-menu__item"
              />
            ),
          },
          {
            component: () => (
              <QuickCreateContainerImages
                namespace={activeNamespace}
                className="pf-v5-c-menu__item"
              />
            ),
          },
          {
            component: () => <CloudShellMastheadAction className="pf-v5-c-menu__item" />,
          },
        ],
      });

      if (!_.isEmpty(launchActions)) {
        actions.unshift(...launchActions);
      }

      return (
        <Dropdown
          className="co-app-launcher"
          isOpen={isKebabDropdownOpen}
          onOpenChange={(open) => setIsKebabDropdownOpen(open)}
          onSelect={() => setIsKebabDropdownOpen(false)}
          toggle={(toggleRef) => (
            <MenuToggle
              aria-label={t('public~Utility menu')}
              ref={toggleRef}
              variant="plain"
              onClick={(open) => setIsKebabDropdownOpen(open)}
              isExpanded={isKebabDropdownOpen}
              data-quickstart-id="qs-masthead-utilitymenu"
            >
              <EllipsisVIcon />
            </MenuToggle>
          )}
          ref={kebabMenuRef}
          popperProps={{ position: 'right' }}
        >
          {renderApplicationItems(actions)}
        </Dropdown>
      );
    }

    const userToggle = (
      <span className="pf-v5-c-dropdown__toggle">
        <span className="co-username" data-test="username">
          {authEnabledFlag ? username : t('public~Auth disabled')}
        </span>
        <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
      </span>
    );

    return (
      <Dropdown
        className="co-app-launcher co-user-menu"
        isOpen={isUserDropdownOpen}
        onOpenChange={(open) => setIsUserDropdownOpen(open)}
        onSelect={() => setIsUserDropdownOpen(false)}
        toggle={(toggleRef) => (
          <MenuToggle
            aria-label={t('public~User menu')}
            ref={toggleRef}
            variant="plain"
            onClick={(open) => setIsUserDropdownOpen(open)}
            isExpanded={isUserDropdownOpen}
            data-test="user-dropdown"
            data-tour-id="tour-user-button"
            data-quickstart-id="qs-masthead-usermenu"
          >
            {userToggle}
          </MenuToggle>
        )}
        ref={userMenuRef}
        popperProps={{ position: 'right' }}
      >
        {renderApplicationItems(actions)}
      </Dropdown>
    );
  };

  React.useEffect(() => {
    if (window.SERVER_FLAGS.statuspageID) {
      fetch(`https://${window.SERVER_FLAGS.statuspageID}.statuspage.io/api/v2/summary.json`, {
        headers: { Accept: 'application/json' },
      })
        .then((response) => response.json())
        .then((newStatusPageData) => setStatusPageData(newStatusPageData));
    }
  }, [setStatusPageData]);

  const setLastConsoleActivityTimestamp = () =>
    localStorage.setItem(LAST_CONSOLE_ACTIVITY_TIMESTAMP_LOCAL_STORAGE_KEY, Date.now().toString());

  const resetInactivityTimeout = React.useCallback(() => {
    setLastConsoleActivityTimestamp();
    clearTimeout(userInactivityTimeout.current);
    userInactivityTimeout.current = setTimeout(() => {
      if (openshiftFlag) {
        authSvc.logoutOpenShift(isKubeAdmin);
      } else {
        authSvc.logout();
      }
    }, window.SERVER_FLAGS.inactivityTimeout * 1000);
  }, [openshiftFlag, isKubeAdmin]);

  React.useEffect(() => {
    const onStorageChange = (e) => {
      const { key, oldValue, newValue } = e;
      if (key === LAST_CONSOLE_ACTIVITY_TIMESTAMP_LOCAL_STORAGE_KEY && oldValue < newValue) {
        resetInactivityTimeout();
      }
    };
    // Ignore inactivity-timeout if set to less then 300 seconds
    const inactivityTimeoutEnabled = window.SERVER_FLAGS.inactivityTimeout >= 300;
    if (inactivityTimeoutEnabled) {
      setLastConsoleActivityTimestamp();
      window.addEventListener('storage', onStorageChange);
      window.addEventListener('click', _.throttle(resetInactivityTimeout, 500));
      window.addEventListener('keydown', _.throttle(resetInactivityTimeout, 500));
      resetInactivityTimeout();
    }
    return () => {
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('click', resetInactivityTimeout);
      window.removeEventListener('keydown', resetInactivityTimeout);
      clearTimeout(userInactivityTimeout.current);
    };
  }, [resetInactivityTimeout]);

  const launchActions = getLaunchActions();
  const alertAccess = canAccessNS && !!window.SERVER_FLAGS.prometheusBaseURL;
  return (
    <>
      <Toolbar isFullHeight isStatic>
        <ToolbarContent>
          <MultiClusterToolbarGroup />
          <ToolbarGroup
            align={{ default: 'alignRight' }}
            spacer={{ default: 'spacerNone' }}
            visibility={{ default: isMastheadStacked ? 'hidden' : 'visible' }}
          >
            <ToolbarItem spacer={{ default: 'spacerNone', lg: 'spacerLg' }}>
              <SystemStatusButton statuspageData={statusPageData} />
              {!_.isEmpty(launchActions) && (
                <Dropdown
                  className="co-app-launcher"
                  isOpen={isAppLauncherDropdownOpen}
                  onOpenChange={(open) => setIsAppLauncherDropdownOpen(open)}
                  onSelect={() => setIsAppLauncherDropdownOpen(false)}
                  onOpenChangeKeys={['Escape']}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      aria-label={t('public~Application launcher')}
                      ref={toggleRef}
                      variant="plain"
                      onClick={(open) => setIsAppLauncherDropdownOpen(open)}
                      isExpanded={isKebabDropdownOpen}
                      data-test-id="application-launcher"
                    >
                      <ThIcon />
                    </MenuToggle>
                  )}
                  ref={applicationLauncherMenuRef}
                  popperProps={{ position: 'right' }}
                >
                  {renderApplicationItems(launchActions)}
                </Dropdown>
              )}
              {alertAccess && (
                <NotificationBadge
                  aria-label={t('public~Notification drawer')}
                  onClick={drawerToggle}
                  variant="read"
                  count={alertCount || 0}
                  data-quickstart-id="qs-masthead-notifications"
                >
                  <BellIcon alt="" />
                </NotificationBadge>
              )}
              <QuickCreate namespace={activeNamespace} />
              <CloudShellMastheadButton />
              <Dropdown
                className="co-app-launcher"
                isOpen={isHelpDropdownOpen}
                onOpenChange={(open) => setIsHelpDropdownOpen(open)}
                onSelect={() => setIsHelpDropdownOpen(false)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    aria-label={t('public~Help menu')}
                    ref={toggleRef}
                    variant="plain"
                    onClick={(open) => setIsHelpDropdownOpen(open)}
                    isExpanded={isHelpDropdownOpen}
                    data-test="help-dropdown-toggle"
                    data-tour-id="tour-help-button"
                    data-quickstart-id="qs-masthead-help"
                  >
                    <QuestionCircleIcon className="co-masthead-icon" alt="" />
                  </MenuToggle>
                )}
                ref={helpMenuRef}
                popperProps={{ position: 'right' }}
                data-test="help-dropdown"
              >
                {renderApplicationItems(
                  getHelpActions(
                    getAdditionalActions(getAdditionalLinks(consoleLinks?.data, 'HelpMenu')),
                  ),
                )}
              </Dropdown>
            </ToolbarItem>
            <ToolbarItem>{renderMenu(false)}</ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup
            align={{ default: 'alignRight' }}
            spacer={{ default: 'spacerNone' }}
            visibility={{ default: isMastheadStacked ? 'visible' : 'hidden' }}
          >
            <SystemStatusButton statuspageData={statusPageData} />
            {alertAccess && alertCount > 0 && (
              <NotificationBadge
                aria-label={t('public~Notification drawer')}
                onClick={drawerToggle}
                variant="read"
                count={alertCount}
                data-quickstart-id="qs-masthead-notifications"
              >
                <BellIcon />
              </NotificationBadge>
            )}
            <ToolbarItem>{renderMenu(true)}</ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
      <AboutModal isOpen={showAboutModal} closeAboutModal={closeAboutModal} />
      {reportBugLink ? (
        <FeedbackModalLocalized
          reportBugLink={reportBugLink}
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      ) : null}
    </>
  );
};

export const MastheadToolbar = ({ isMastheadStacked }) => {
  const clusterVersionFlag = useFlag(FLAGS.CLUSTER_VERSION);
  const consoleLinkFlag = useFlag(FLAGS.CONSOLE_LINK);
  const resources = [];
  if (clusterVersionFlag) {
    resources.push({
      kind: clusterVersionReference,
      name: 'version',
      isList: false,
      prop: 'cv',
    });
  }
  if (consoleLinkFlag) {
    resources.push({
      kind: referenceForModel(ConsoleLinkModel),
      isList: true,
      prop: 'consoleLinks',
    });
  }

  return (
    <Firehose resources={resources}>
      <MastheadToolbarContents isMastheadStacked={isMastheadStacked} />
    </Firehose>
  );
};
