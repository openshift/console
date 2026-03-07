import type { FC } from 'react';
import { Fragment, useContext, useState, useRef, useCallback, useEffect } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useNavigate } from 'react-router-dom-v5-compat';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
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
import { ACM_LINK_ID, FLAGS } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useCopyCodeModal } from '@console/shared/src/hooks/useCopyCodeModal';
import { useCopyLoginCommands } from '@console/shared/src/hooks/useCopyLoginCommands';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useUser } from '@console/shared/src/hooks/useUser';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { CloudShellMastheadButton } from '@console/webterminal-plugin/src/components/cloud-shell/CloudShellMastheadButton';
import { CloudShellMastheadAction } from '@console/webterminal-plugin/src/components/cloud-shell/CloudShellMastheadAction';
import { getImpersonate, useActivePerspective } from '@console/dynamic-plugin-sdk';
import * as UIActions from '../../actions/ui';
import { flagPending, featureReducerName } from '../../reducers/features';
import { authSvc } from '../../module/auth';
import { ClusterVersionKind, ConsoleLinkKind, getOCMLink } from '../../module/k8s';
import { openshiftHelpBase } from '../utils/documentation';
import { AboutModal } from '../about-modal';
import { getReportBugLink } from '../../module/k8s/cluster-settings';
import redhatLogoImg from '../../imgs/logos/redhat.svg';
import { TourContext, TourActions } from '@console/app/src/components/tour';
import { ClusterVersionModel, ConsoleLinkModel } from '../../models';
import { FeedbackModal } from '@patternfly/react-user-feedback';
import '@patternfly/react-user-feedback/dist/esm/Feedback/Feedback.css';
import { useFeedbackLocal } from './feedback-local';
import { action as reduxAction } from 'typesafe-actions';
import feedbackImage from '@patternfly/react-user-feedback/dist/esm/images/rh_feedback.svg';
import darkFeedbackImage from '@patternfly/react-user-feedback/dist/esm/images/rh_feedback-dark.svg';
import QuickCreate, { QuickCreateImportFromGit, QuickCreateContainerImages } from '../QuickCreate';
import { ThemeContext, THEME_DARK } from '../ThemeProvider';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { ImpersonateUserModal } from '../modals/impersonate-user-modal';

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

interface FeedbackModalLocalizedProps {
  isOpen: boolean;
  onClose: () => void;
  reportBugLink: ReturnType<typeof getReportBugLink>;
}

const FeedbackModalLocalized: FC<FeedbackModalLocalizedProps> = ({
  isOpen,
  onClose,
  reportBugLink,
}) => {
  const feedbackLocales = useFeedbackLocal(reportBugLink);
  const theme = useContext(ThemeContext);
  return (
    <FeedbackModal
      onShareFeedback="https://console.redhat.com/self-managed-feedback-form?source=openshift"
      onOpenSupportCase={reportBugLink.href}
      feedbackLocale={feedbackLocales}
      onJoinMailingList="https://console.redhat.com/self-managed-research-form?source=openshift"
      feedbackImg={theme === THEME_DARK ? darkFeedbackImage : feedbackImage}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

interface StatusButtonProps {
  statusPageData: {
    incidents: any[];
    page: { url: string };
  };
}

const SystemStatusButton: FC<StatusButtonProps> = ({ statusPageData }) => {
  const { t } = useTranslation();
  return !_.isEmpty(_.get(statusPageData, 'incidents')) ? (
    <ExternalLinkButton
      variant="plain"
      className="co-masthead-button"
      aria-label={t('public~System status')}
      icon={<YellowExclamationTriangleIcon />}
      href={statusPageData.page.url}
    />
  ) : null;
};

interface MastheadAction {
  label: string;
  href?: string;
  callback?: (e) => void;
  externalLink?: boolean;
  image?: React.ReactNode;
  component?: FC;
  dataTest?: string;
}

interface MastheadSection {
  name?: string;
  isSection: boolean;
  actions: MastheadAction[];
}

interface MastheadToolbarContentsProps {
  consoleLinks: ConsoleLinkKind[];
  cv: ClusterVersionKind;
  isMastheadStacked: boolean;
}

// TODO remove this code, the plugin should use an appropriate extension
const isTroubleshootingPanelPluginActive =
  Array.isArray(window.SERVER_FLAGS.consolePlugins) &&
  window.SERVER_FLAGS.consolePlugins.includes('troubleshooting-panel-console-plugin');

// TODO break this down into smaller components and hooks
const MastheadToolbarContents: FC<MastheadToolbarContentsProps> = ({
  consoleLinks,
  cv,
  isMastheadStacked,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fireTelemetryEvent = useTelemetry();
  const { tourDispatch, tour } = useContext(TourContext);
  const authEnabledFlag = useFlag(FLAGS.AUTH_ENABLED);
  const consoleCLIDownloadFlag = useFlag(FLAGS.CONSOLE_CLI_DOWNLOAD);
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const quickstartFlag = useFlag(FLAGS.CONSOLE_QUICKSTART);
  const dispatch = useConsoleDispatch();
  const [activeNamespace] = useActiveNamespace();
  const [activePerspective] = useActivePerspective();
  const [requestTokenURL, externalLoginCommand] = useCopyLoginCommands();
  const launchCopyLoginCommandModal = useCopyCodeModal(
    t('public~Login with this command'),
    externalLoginCommand,
  );
  const { clusterID, alertCount, canAccessNS, impersonate } = useConsoleSelector((state) => ({
    clusterID: state.UI.get('clusterID'),
    alertCount: state.observe.getIn(['alertCount']),
    canAccessNS: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
    impersonate: getImpersonate(state),
  }));

  // Use centralized user hook for user data
  const { displayName, username } = useUser();
  const [isAppLauncherDropdownOpen, setIsAppLauncherDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isKebabDropdownOpen, setIsKebabDropdownOpen] = useState(false);
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const [statusPageData, setstatusPageData] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const applicationLauncherMenuRef = useRef(null);
  const helpMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const kebabMenuRef = useRef(null);
  const reportBugLink = cv ? getReportBugLink(cv) : null;
  const userInactivityTimeout = useRef(null);
  const isKubeAdmin = username === 'kube:admin';

  const drawerToggle = useCallback(() => dispatch(UIActions.notificationDrawerToggleExpanded()), [
    dispatch,
  ]);

  const getImportYAMLPath = () => formatNamespacedRouteForResource('import', activeNamespace);
  const onFeedbackModal = () => setIsFeedbackModalOpen(true);
  const onAboutModal = (e) => {
    e.preventDefault();
    setShowAboutModal(true);
  };

  const handleGuidedTourClick = (e) => {
    e.preventDefault();
    // Move focus away from the dropdown menu item to prevent aria-hidden warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    fireTelemetryEvent('launch-guided-tour-form-help', {
      id: 'guided-tour-help',
      perspective: activePerspective,
    });
    tourDispatch({ type: TourActions.start });
  };

  const closeAboutModal = () => setShowAboutModal(false);

  const getAdditionalLinks = (
    links: ConsoleLinkKind[],
    type: ConsoleLinkKind['spec']['location'],
  ) =>
    _.sortBy(
      // ACM link is being moved to the perspective switcher, so do not show in application launcher
      _.filter(links, (link) => link.spec.location === type && link.metadata.name !== ACM_LINK_ID),
      'spec.text',
    );

  const getSectionLauncherItems = (launcherItems: ConsoleLinkKind[], sectionName: string) =>
    _.sortBy(
      _.filter(
        launcherItems,
        (link) => _.get(link, 'spec.applicationMenu.section', '') === sectionName,
      ),
      'spec.text',
    );

  const sectionSort = (section: MastheadSection) => {
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
    const launcherItems = getAdditionalLinks(consoleLinks, 'ApplicationMenu');

    const sections: MastheadSection[] = [];
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
    if (isTroubleshootingPanelPluginActive && activePerspective === 'admin') {
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

  const getHelpActions = (additionalHelpActions: MastheadSection) => {
    const helpActions = [];

    helpActions.push({
      isSection: true,
      actions: [
        ...(tour
          ? [
              {
                label: t('public~Guided Tour'),
                callback: handleGuidedTourClick,
              },
            ]
          : []),
        ...(quickstartFlag
          ? [
              {
                label: t('public~Quick Starts'),
                component: LinkTo('/quickstart'),
                dataTest: 'masthead-quick-starts',
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
                callback: () => {
                  fireTelemetryEvent('CLI Clicked');
                },
                component: LinkTo('/command-line-tools'),
              },
            ]
          : []),
        ...(reportBugLink
          ? [
              {
                label: t('public~Share Feedback'),
                callback: (e) => {
                  e.preventDefault();
                  onFeedbackModal();
                },
              },
            ]
          : []),
      ],
    });

    // Add default help links to start of additional links from operator
    additionalHelpActions.actions = [
      ...defaultHelpLinks.map((helpLink) => ({
        ...helpLink,
        label: t(`public~${helpLink.label}`),
      })),
      {
        label: t('public~About'),
        callback: onAboutModal,
      },
      ...additionalHelpActions.actions,
    ];

    if (!_.isEmpty(additionalHelpActions.actions)) {
      helpActions.push(additionalHelpActions);
    }

    return helpActions;
  };

  const getAdditionalActions = (links: ConsoleLinkKind[]): MastheadSection => {
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

  const externalProps = (externalLink: boolean) =>
    externalLink ? { rel: 'noopener noreferrer' } : {};

  const renderApplicationItems = (actions: (MastheadAction | MastheadSection)[]) =>
    _.map(actions, (action, groupIndex) => {
      if ('isSection' in action && action.isSection) {
        const list = (
          <DropdownList key={`dropdown-list-${groupIndex}`}>
            {_.map(action.actions, (sectionAction, itemIndex) => {
              // Use label + index for key, fallback to index if label missing
              const itemKey = sectionAction.label
                ? `dropdown-item-${groupIndex}-${sectionAction.label}-${itemIndex}`
                : `dropdown-item-${groupIndex}-${itemIndex}`;
              return (
                <DropdownItem
                  key={itemKey}
                  icon={sectionAction.image}
                  to={sectionAction.href}
                  isExternalLink={sectionAction.externalLink}
                  {...externalProps(sectionAction.externalLink)}
                  onClick={sectionAction.callback}
                  component={sectionAction.component}
                  data-test={sectionAction.dataTest ?? 'application-launcher-item'}
                  value={sectionAction.label}
                >
                  {sectionAction.label}
                </DropdownItem>
              );
            })}
          </DropdownList>
        );
        return (
          <Fragment key={`dropdown-group-fragment-${groupIndex}`}>
            {action.name ? (
              <DropdownGroup key={`dropdown-group-${groupIndex}`} label={action.name}>
                {list}
              </DropdownGroup>
            ) : (
              list
            )}
            {Number(groupIndex) < actions.length - 1 && <Divider key={`separator-${groupIndex}`} />}
          </Fragment>
        );
      }

      if ('label' in action && action.label) {
        return (
          <Fragment key={`dropdown-list-fragment-${groupIndex}`}>
            <DropdownList key={`dropdown-list-${groupIndex}`}>
              <DropdownItem
                key={`dropdown-item-${groupIndex}-${action.label}`}
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
            {Number(groupIndex) < actions.length - 1 && <Divider key={`separator-${groupIndex}`} />}
          </Fragment>
        );
      }
      return null;
    });

  const renderMenu = (mobile: boolean) => {
    const additionalUserActions = getAdditionalActions(
      getAdditionalLinks(consoleLinks, 'UserMenu'),
    );
    const helpActions = getHelpActions(
      getAdditionalActions(getAdditionalLinks(consoleLinks, 'HelpMenu')),
    );
    const launchActions = getLaunchActions();

    if (flagPending(openshiftFlag) || flagPending(authEnabledFlag)) {
      return null;
    }

    const actions = [];
    const userActions: MastheadAction[] = [
      {
        label: t('public~User Preferences'),
        component: LinkTo('/user-preferences'),
      },
    ];

    // Add impersonate option if user is currently impersonating
    if (impersonate) {
      userActions.unshift({
        label: t('public~Stop impersonating'),
        callback: () => {
          dispatch(UIActions.stopImpersonate());
          // Use full page reload when stopping to ensure clean state
          setTimeout(() => {
            window.location.href = window.SERVER_FLAGS.basePath || '/';
          }, 0);
        },
        dataTest: 'stop-impersonate',
      });
    }

    // Add impersonate option if not currently impersonating
    if (!impersonate) {
      userActions.unshift({
        label: t('public~Impersonate User'),
        callback: () => setIsImpersonateModalOpen(true),
        dataTest: 'impersonate-user',
      });
    }

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
            component: LinkTo(getImportYAMLPath()),
          },
          {
            component: () => (
              <QuickCreateImportFromGit
                namespace={activeNamespace}
                className="pf-v6-c-menu__item"
              />
            ),
          },
          {
            component: () => (
              <QuickCreateContainerImages
                namespace={activeNamespace}
                className="pf-v6-c-menu__item"
              />
            ),
          },
          {
            component: () => <CloudShellMastheadAction className="pf-v6-c-menu__item" />,
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
              onClick={() => setIsKebabDropdownOpen(!isKebabDropdownOpen)}
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
      <span className="co-username" data-test="username">
        {authEnabledFlag ? displayName : t('public~Auth disabled')}
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
            variant="plainText"
            ref={toggleRef}
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            isExpanded={isUserDropdownOpen}
            data-test="user-dropdown-toggle"
            data-tour-id="tour-user-button"
            data-quickstart-id="qs-masthead-usermenu"
            className="co-user-menu"
          >
            {userToggle}
          </MenuToggle>
        )}
        ref={userMenuRef}
        popperProps={{ position: 'right' }}
        data-test="user-dropdown"
      >
        {renderApplicationItems(actions)}
      </Dropdown>
    );
  };

  useEffect(() => {
    if (window.SERVER_FLAGS.statuspageID) {
      fetch(`https://${window.SERVER_FLAGS.statuspageID}.statuspage.io/api/v2/summary.json`, {
        headers: { Accept: 'application/json' },
      })
        .then((response) => response.json())
        .then((newstatusPageData) => setstatusPageData(newstatusPageData));
    }
  }, [setstatusPageData]);

  const setLastConsoleActivityTimestamp = () =>
    localStorage.setItem(LAST_CONSOLE_ACTIVITY_TIMESTAMP_LOCAL_STORAGE_KEY, Date.now().toString());

  const resetInactivityTimeout = useCallback(() => {
    setLastConsoleActivityTimestamp();
    clearTimeout(userInactivityTimeout.current);
    userInactivityTimeout.current = setTimeout(() => {
      authSvc.logout('', isKubeAdmin);
    }, window.SERVER_FLAGS.inactivityTimeout * 1000);
  }, [isKubeAdmin]);

  useEffect(() => {
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
          <ToolbarGroup
            align={{ default: 'alignEnd' }}
            visibility={{ default: isMastheadStacked ? 'hidden' : 'visible' }}
            gap={{ default: 'gapNone', md: 'gapMd' }}
          >
            <ToolbarItem>
              <SystemStatusButton statusPageData={statusPageData} />
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
                      onClick={() => setIsAppLauncherDropdownOpen(!isAppLauncherDropdownOpen)}
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
                  // @ts-expect-error this prop is accepted as a button variant (but not documented).
                  // this usage of the undocumented variant was approved by UX
                  variant="plain"
                  count={alertCount || 0}
                  data-quickstart-id="qs-masthead-notifications"
                  className="co-masthead-button"
                />
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
                    onClick={() => setIsHelpDropdownOpen(!isHelpDropdownOpen)}
                    isExpanded={isHelpDropdownOpen}
                    data-test="help-dropdown-toggle"
                    data-tour-id="tour-help-button"
                    data-quickstart-id="qs-masthead-help"
                  >
                    <QuestionCircleIcon alt="" />
                  </MenuToggle>
                )}
                ref={helpMenuRef}
                popperProps={{ position: 'right' }}
                data-test="help-dropdown"
              >
                {renderApplicationItems(
                  getHelpActions(
                    getAdditionalActions(getAdditionalLinks(consoleLinks, 'HelpMenu')),
                  ),
                )}
              </Dropdown>
            </ToolbarItem>
            <ToolbarItem>{renderMenu(false)}</ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup
            align={{ default: 'alignEnd' }}
            gap={{ default: 'gapNone' }}
            visibility={{ default: isMastheadStacked ? 'visible' : 'hidden' }}
          >
            <SystemStatusButton statusPageData={statusPageData} />
            {alertAccess && alertCount > 0 && (
              <NotificationBadge
                aria-label={t('public~Notification drawer')}
                onClick={drawerToggle}
                // @ts-expect-error this prop is accepted as a button variant (but not documented).
                // this usage of the undocumented variant was approved by UX
                variant="plain"
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
      <ImpersonateUserModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
        onImpersonate={(userName: string, groups: string[]) => {
          if (groups && groups.length > 0) {
            dispatch(UIActions.startImpersonate('UserWithGroups', userName, groups));
          } else {
            dispatch(UIActions.startImpersonate('User', userName));
          }
          setIsImpersonateModalOpen(false);
          // Redirect to projects page to prevent RBAC issues for impersonated users
          navigate('/k8s/cluster/projects');
        }}
        prefilledUsername=""
        isUsernameReadonly={false}
      />
    </>
  );
};

interface MastheadToolbarProps {
  isMastheadStacked: boolean;
}

export const MastheadToolbar: FC<MastheadToolbarProps> = ({ isMastheadStacked }) => {
  const consoleLinkFlag = useFlag(FLAGS.CONSOLE_LINK);
  const clusterVersionFlag = useFlag(FLAGS.CLUSTER_VERSION);

  const [consoleLinks] = useK8sWatchResource<ConsoleLinkKind[]>(
    consoleLinkFlag
      ? {
          groupVersionKind: {
            group: ConsoleLinkModel.apiGroup,
            version: ConsoleLinkModel.apiVersion,
            kind: ConsoleLinkModel.kind,
          },
          isList: true,
        }
      : {},
  );

  const [cv] = useK8sWatchResource<ClusterVersionKind>(
    clusterVersionFlag
      ? {
          groupVersionKind: {
            group: ClusterVersionModel.apiGroup,
            version: ClusterVersionModel.apiVersion,
            kind: ClusterVersionModel.kind,
          },
          name: 'version',
          isList: false,
        }
      : {},
  );

  return (
    <MastheadToolbarContents
      isMastheadStacked={isMastheadStacked}
      consoleLinks={consoleLinks}
      cv={cv}
    />
  );
};
