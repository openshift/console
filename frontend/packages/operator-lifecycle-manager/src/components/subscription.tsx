/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC } from 'react';
import { useRef, useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  Card,
  DescriptionListTerm,
  Popover,
  Split,
  SplitItem,
  GridItem,
  Grid,
} from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import { ResourceStatus, StatusIconAndText } from '@console/dynamic-plugin-sdk';
import {
  getGroupVersionKindForModel,
  K8sResourceKind,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { Conditions } from '@console/internal/components/conditions';
import {
  DetailsPage,
  MultiListPage,
  Table,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  LoadingInline,
  ConsoleEmptyState,
  navFactory,
  ResourceLink,
  resourcePathFromModel,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { removeQueryArgument } from '@console/internal/components/utils/router';
import {
  k8sGet,
  k8sKill,
  K8sKind,
  K8sModel,
  k8sPatch,
  K8sResourceCommon,
  k8sUpdate,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  getName,
  getNamespace,
  GreenCheckCircleIcon,
  LazyActionMenu,
  RedExclamationCircleIcon,
  WarningStatus,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { KEBAB_COLUMN_CLASS } from '@console/shared/src/components/actions/LazyActionMenu';
import { DescriptionListTermHelp } from '@console/shared/src/components/description-list/DescriptionListTermHelp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  CatalogSourceModel,
  InstallPlanModel,
  PackageManifestModel,
  OperatorGroupModel,
} from '../models';
import {
  SubscriptionKind,
  SubscriptionState,
  PackageManifestKind,
  InstallPlanApproval,
  ClusterServiceVersionKind,
  OperatorGroupKind,
  InstallPlanKind,
  InstallPlanPhase,
  CatalogSourceKind,
} from '../types';
import { upgradeRequiresApproval } from '../utils';
import {
  DeprecatedOperatorWarningAlert,
  DeprecatedOperatorWarningIcon,
  findDeprecatedOperator,
} from './deprecated-operator-warnings/deprecated-operator-warnings';
import { createInstallPlanApprovalModal } from './modals/installplan-approval-modal';
import { createSubscriptionChannelModal } from './modals/subscription-channel-modal';
import { useUninstallOperatorModal } from './modals/uninstall-operator-modal';
import { requireOperatorGroup } from './operator-group';
import { getManualSubscriptionsInNamespace, NamespaceIncludesManualApproval } from './index';

export const catalogSourceForSubscription = (
  catalogSources: CatalogSourceKind[] = [],
  subscription: SubscriptionKind,
): CatalogSourceKind =>
  catalogSources.find(
    (source) =>
      source?.metadata?.name === subscription?.spec?.source &&
      source?.metadata?.namespace === subscription?.spec?.sourceNamespace,
  );

export const installedCSVForSubscription = (
  clusterServiceVersions: ClusterServiceVersionKind[] = [],
  subscription: SubscriptionKind,
): ClusterServiceVersionKind =>
  clusterServiceVersions.find((csv) => csv?.metadata?.name === subscription?.status?.installedCSV);

export const packageForSubscription = (
  packageManifests: PackageManifestKind[] = [],
  subscription: SubscriptionKind,
): PackageManifestKind =>
  packageManifests.find(
    (pkg) =>
      pkg?.metadata?.name === subscription?.spec?.name &&
      pkg?.status?.packageName === subscription?.spec?.name &&
      pkg?.status?.catalogSource === subscription?.spec?.source &&
      pkg?.status?.catalogSourceNamespace === subscription?.spec?.sourceNamespace,
  );

export const installPlanForSubscription = (
  installPlans: InstallPlanKind[] = [],
  subscription: SubscriptionKind,
): InstallPlanKind =>
  installPlans.find((ip) => ip?.metadata?.name === subscription?.status?.installPlanRef?.name);

export const SourceMissingStatus: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <WarningStatus title={t('olm~Cannot update')} />
      <span className="pf-v6-u-text-color-subtle">{t('olm~CatalogSource not found')}</span>
    </>
  );
};

export const SourceUnhealthyStatus: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <WarningStatus title={t('olm~Cannot update')} />
      <span className="pf-v6-u-text-color-subtle">{t('olm~CatalogSource unhealthy')}</span>
    </>
  );
};

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  KEBAB_COLUMN_CLASS,
];

export const UpgradeApprovalLink: FC<{ subscription: SubscriptionKind }> = ({ subscription }) => {
  const { t } = useTranslation();
  const to = resourcePathFromModel(
    InstallPlanModel,
    subscription.status.installPlanRef.name,
    subscription.metadata.namespace,
  );
  return (
    <span className="co-icon-and-text">
      <Link to={to}>
        <BlueArrowCircleUpIcon /> {t('olm~Upgrade available')}
      </Link>
    </span>
  );
};

export const SubscriptionStatus: FC<{ subscription: SubscriptionKind }> = ({ subscription }) => {
  const { t } = useTranslation();
  switch (subscription?.status?.state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      return (
        <span>
          <YellowExclamationTriangleIcon /> {t('olm~Upgrade available')}
        </span>
      );
    case SubscriptionState.SubscriptionStateUpgradePending:
      return upgradeRequiresApproval(subscription) && subscription?.status?.installPlanRef ? (
        <UpgradeApprovalLink subscription={subscription} />
      ) : (
        <span>
          <InProgressIcon className="text-primary" /> {t('olm~Upgrading')}
        </span>
      );
    case SubscriptionState.SubscriptionStateAtLatest:
      return (
        <span>
          <GreenCheckCircleIcon /> {t('olm~Up to date')}
        </span>
      );
    default:
      return (
        <span className={!subscription?.status?.state ? 'pf-v6-u-text-color-subtle' : ''}>
          {subscription?.status?.state || t('olm~Unknown failure')}
        </span>
      );
  }
};

export const SubscriptionTableRow: FC<RowFunctionArgs> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(SubscriptionModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <SubscriptionStatus subscription={obj} />
      </TableData>
      <TableData className={css(tableColumnClasses[3], 'co-truncate', 'co-select-to-copy')}>
        {obj.spec.channel || 'default'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.spec.installPlanApproval || t('olm~Automatic')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <LazyActionMenu
          context={{
            [referenceFor(obj)]: obj,
          }}
        />
      </TableData>
    </>
  );
};

export const SubscriptionsList = requireOperatorGroup((props: SubscriptionsListProps) => {
  const { t } = useTranslation();
  const SubscriptionTableHeader = () => {
    return [
      {
        title: t('olm~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('olm~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('olm~Status'),
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('olm~Update channel'),
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('olm~Update approval'),
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('olm~Operator Subscriptions')}
      Header={SubscriptionTableHeader}
      Row={SubscriptionTableRow}
      EmptyMsg={() => (
        <ConsoleEmptyState title={t('olm~No Subscriptions found')}>
          {t(
            'olm~Each Namespace can subscribe to a single channel of a package for automatic updates.',
          )}
        </ConsoleEmptyState>
      )}
      virtualize
    />
  );
});

export const SubscriptionsPage: FC<SubscriptionsPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <MultiListPage
      {...props}
      resources={[
        {
          kind: referenceForModel(SubscriptionModel),
          namespace: props.namespace,
          namespaced: true,
          prop: 'subscription',
        },
        {
          kind: referenceForModel(OperatorGroupModel),
          namespace: props.namespace,
          namespaced: true,
          prop: 'operatorGroup',
        },
      ]}
      flatten={(resources) => _.get(resources.subscription, 'data', [])}
      title={t('olm~Subscriptions')}
      canCreate
      createProps={{ to: '/catalog?catalogType=operator' }}
      createButtonText={t('olm~Create Subscription')}
      ListComponent={SubscriptionsList}
      filterLabel={t('olm~Subscriptions by package')}
    />
  );
};

const CatalogSourceHealthAlert = ({ health, source, sourceNamespace }) => {
  const { t } = useTranslation();
  if (!health) {
    return (
      <Alert
        isInline
        className="co-alert"
        variant="warning"
        title={t('olm~CatalogSource health unknown')}
      >
        {t(
          'olm~This operator cannot be updated. The health of CatalogSource "{{source}}" is unknown. It may have been disabled or removed from the cluster.',
          { source },
        )}
        {source && sourceNamespace && (
          <ResourceLink
            displayName={t('olm~View CatalogSource')}
            groupVersionKind={getGroupVersionKindForModel(CatalogSourceModel)}
            name={source}
            namespace={sourceNamespace}
            title={source}
          />
        )}
      </Alert>
    );
  }
  return health.healthy ? null : (
    <Alert isInline className="co-alert" variant="warning" title={t('olm~CatalogSource unhealthy')}>
      {t('olm~This operator cannot be updated. CatalogSource "{{source}}" is unhealthy.', {
        source,
      })}
      <ResourceLink
        displayName={t('olm~View CatalogSource')}
        groupVersionKind={getGroupVersionKindForModel(CatalogSourceModel)}
        name={source}
        namespace={sourceNamespace}
        title={source}
      />
    </Alert>
  );
};

const InstallFailedAlert = ({ installPlan }) => {
  const { t } = useTranslation();
  const installStatusPhase = installPlan?.status?.phase;
  const installFailedCondition = installPlan?.status?.conditions?.find(
    ({ type, status }) => type === 'Installed' && status === 'False',
  );
  const installFailedMessage =
    installFailedCondition?.message ||
    installFailedCondition?.reason ||
    t('olm~InstallPlan failed');

  return installStatusPhase === InstallPlanPhase.InstallPlanPhaseFailed ? (
    <Alert
      isInline
      className="co-alert co-alert--scrollable"
      variant="danger"
      title={installStatusPhase}
    >
      {installFailedMessage}
    </Alert>
  ) : null;
};

const CatalogSourceStatusIconAndText = ({ healthy }) => {
  const { t } = useTranslation();
  switch (healthy) {
    case true:
      return <StatusIconAndText icon={<GreenCheckCircleIcon />} title={t('olm~Healthy')} />;
    case false:
      return <StatusIconAndText icon={<RedExclamationCircleIcon />} title={t('olm~Unhealthy')} />;
    default:
      return (
        <StatusIconAndText
          icon={<YellowExclamationTriangleIcon />}
          title={t('olm~Health unknown')}
        />
      );
  }
};

export const SubscriptionDetails: FC<SubscriptionDetailsProps> = ({
  clusterServiceVersions = [],
  installPlans = [],
  obj,
  packageManifests = [],
  subscriptions = [],
}) => {
  const { t } = useTranslation();
  const { source, sourceNamespace } = obj?.spec ?? {};
  const catalogHealth = obj?.status?.catalogHealth?.find(
    (ch) => ch.catalogSourceRef.name === source,
  );
  const installedCSV = installedCSVForSubscription(clusterServiceVersions, obj);
  const installPlan = installPlanForSubscription(installPlans, obj);
  const pkg = packageForSubscription(packageManifests, obj);
  const uninstallOperatorModal = useUninstallOperatorModal({
    k8sKill,
    k8sGet,
    k8sPatch,
    subscription: obj,
  });
  if (new URLSearchParams(window.location.search).has('showDelete')) {
    uninstallOperatorModal();
    removeQueryArgument('showDelete');
  }

  const { deprecatedPackage, deprecatedChannel, deprecatedVersion } = findDeprecatedOperator(obj);

  return (
    <>
      <PaneBody>
        <CatalogSourceHealthAlert
          health={catalogHealth}
          source={source}
          sourceNamespace={sourceNamespace}
        />
        <InstallFailedAlert installPlan={installPlan} />
        {(deprecatedPackage.deprecation ||
          deprecatedChannel.deprecation ||
          deprecatedVersion.deprecation) && (
          <DeprecatedOperatorWarningAlert
            deprecatedPackage={deprecatedPackage}
            deprecatedChannel={deprecatedChannel}
            deprecatedVersion={deprecatedVersion}
            dismissible
          />
        )}
        <SectionHeading text={t('olm~Subscription details')} />
        <PaneBodyGroup>
          <SubscriptionUpdates
            catalogHealth={catalogHealth}
            pkg={pkg}
            obj={obj}
            installedCSV={installedCSV}
            installPlan={installPlan}
            subscriptions={subscriptions}
          />
        </PaneBodyGroup>
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} showAnnotations={false} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Installed version')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {installedCSV ? (
                    <ResourceLink
                      kind={referenceForModel(ClusterServiceVersionModel)}
                      name={getName(installedCSV)}
                      namespace={getNamespace(installedCSV)}
                      title={getName(installedCSV)}
                    />
                  ) : (
                    t('olm~None')
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~Starting version')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {obj.spec.startingCSV || t('olm~None')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~CatalogSource')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {source && sourceNamespace ? (
                    <ResourceLink
                      kind={referenceForModel(CatalogSourceModel)}
                      name={source}
                      namespace={sourceNamespace}
                      title={source}
                    >
                      <ResourceStatus badgeAlt>
                        <CatalogSourceStatusIconAndText healthy={catalogHealth?.healthy} />
                      </ResourceStatus>
                    </ResourceLink>
                  ) : (
                    t('olm~None')
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('olm~InstallPlan')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {installPlan ? (
                    <ResourceLink
                      kind={referenceForModel(InstallPlanModel)}
                      name={getName(installPlan)}
                      namespace={getNamespace(installPlan)}
                      title={getName(installPlan)}
                    />
                  ) : (
                    t('olm~None')
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('olm~Conditions')} />
        <Conditions conditions={obj?.status?.conditions} />
      </PaneBody>
    </>
  );
};

const SubscriptionUpgradeStatus = ({ catalogHealth, subscription }) => {
  if (!catalogHealth) {
    return <SourceMissingStatus />;
  }
  return catalogHealth.healthy ? (
    <SubscriptionStatus subscription={subscription} />
  ) : (
    <SourceUnhealthyStatus />
  );
};

export const SubscriptionUpdates: FC<SubscriptionUpdatesProps> = ({
  catalogHealth,
  installedCSV,
  installPlan,
  obj,
  pkg,
  subscriptions,
}) => {
  const { t } = useTranslation();
  const prevInstallPlanApproval = useRef(obj?.spec?.installPlanApproval);
  const prevChannel = useRef(obj?.spec?.channel);
  const [waitingForUpdate, setWaitingForUpdate] = useState(false);

  useEffect(() => {
    const stillWaiting =
      waitingForUpdate &&
      obj?.spec?.channel === prevChannel.current &&
      obj?.spec?.installPlanApproval === prevInstallPlanApproval.current;

    if (!stillWaiting) {
      setWaitingForUpdate(false);
      prevChannel.current = obj?.spec?.channel;
      prevInstallPlanApproval.current = obj?.spec?.installPlanApproval;
    }
  }, [obj, waitingForUpdate]);

  const k8sUpdateAndWait = (kind: K8sKind, resource: K8sResourceCommon) =>
    k8sUpdate(kind, resource).then(() => setWaitingForUpdate(true));
  const channelModal = () =>
    createSubscriptionChannelModal({ subscription: obj, pkg, k8sUpdate: k8sUpdateAndWait });
  const approvalModal = () => createInstallPlanApprovalModal({ obj, k8sUpdate: k8sUpdateAndWait });
  const installPlanPhase = useMemo(() => {
    if (installPlan) {
      switch (installPlan.status?.phase as InstallPlanPhase) {
        case InstallPlanPhase.InstallPlanPhaseRequiresApproval:
          return (
            <span data-test="operator-subscription-requires-approval">
              {t('olm~1 requires approval')}
            </span>
          );
        case InstallPlanPhase.InstallPlanPhaseFailed:
          return t('olm~1 failed');
        default:
          return t('olm~1 installing');
      }
    }
    return null;
  }, [installPlan, t]);
  const manualSubscriptionsInNamespace = getManualSubscriptionsInNamespace(
    subscriptions,
    obj.metadata.namespace,
  );
  const { deprecatedChannel } = findDeprecatedOperator(obj);

  return (
    <DescriptionList className="co-detail-table">
      <Card>
        <DescriptionListTermHelp
          text={t('olm~Update channel')}
          textHelp={t('olm~The channel to track and receive the updates from.')}
        />
        <DescriptionListDescription>
          {waitingForUpdate ? (
            <LoadingInline />
          ) : (
            <>
              <Button
                type="button"
                isInline
                onClick={channelModal}
                variant="link"
                isDisabled={!pkg}
                data-test="subscription-channel-update-button"
                icon={<PencilAltIcon />}
                iconPosition="end"
              >
                {obj.spec.channel || t('olm~No channel')}
              </Button>
              {deprecatedChannel.deprecation && (
                <DeprecatedOperatorWarningIcon
                  dataTest="deprecated-operator-warning-subscription-update-icon"
                  deprecation={deprecatedChannel.deprecation}
                />
              )}
            </>
          )}
        </DescriptionListDescription>
      </Card>
      <Card>
        <DescriptionListTermHelp
          text={t('olm~Update approval')}
          textHelp={t('olm~The strategy to determine either manual or automatic updates.')}
        />
        <DescriptionListDescription>
          {waitingForUpdate ? (
            <LoadingInline />
          ) : (
            <>
              <div>
                <Button
                  icon={<PencilAltIcon />}
                  iconPosition="end"
                  type="button"
                  isInline
                  onClick={approvalModal}
                  variant="link"
                >
                  {obj.spec.installPlanApproval || 'Automatic'}
                </Button>
              </div>
              {obj.spec.installPlanApproval === InstallPlanApproval.Automatic &&
                manualSubscriptionsInNamespace?.length > 0 && (
                  <div>
                    <Popover
                      headerContent={<>{t('olm~Functioning as manual approval strategy')}</>}
                      bodyContent={
                        <NamespaceIncludesManualApproval
                          subscriptions={manualSubscriptionsInNamespace}
                          namespace={obj.metadata.namespace}
                        />
                      }
                    >
                      <Button type="button" isInline variant="link">
                        <BlueInfoCircleIcon className="co-icon-space-r" />
                        {t('olm~Functioning as manual')}
                      </Button>
                    </Popover>
                  </div>
                )}
            </>
          )}
        </DescriptionListDescription>
      </Card>
      <Card>
        <Split>
          <SplitItem>
            <DescriptionListTerm>{t('olm~Upgrade status')}</DescriptionListTerm>
            <DescriptionListDescription>
              <SubscriptionUpgradeStatus catalogHealth={catalogHealth} subscription={obj} />
            </DescriptionListDescription>
          </SplitItem>
          {catalogHealth && catalogHealth.healthy && (
            <>
              <SplitItem>
                <div className="co-detail-table__bracket" />
              </SplitItem>
              <SplitItem className="co-detail-table__breakdown">
                {obj?.status?.installedCSV && installedCSV ? (
                  <Link
                    to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(
                      ClusterServiceVersionModel,
                    )}/${obj.status.installedCSV}`}
                  >
                    {t('olm~1 installed')}
                  </Link>
                ) : (
                  <span>{t('olm~0 installed')}</span>
                )}
                {obj?.status?.state === SubscriptionState.SubscriptionStateUpgradePending &&
                obj?.status?.installPlanRef &&
                installPlan ? (
                  <Link
                    to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(InstallPlanModel)}/${
                      obj.status.installPlanRef.name
                    }`}
                  >
                    <span>{installPlanPhase}</span>
                  </Link>
                ) : (
                  <span>{t('olm~0 installing')}</span>
                )}
              </SplitItem>
            </>
          )}
        </Split>
      </Card>
    </DescriptionList>
  );
};

export const SubscriptionDetailsPage: FC<SubscriptionDetailsPageProps> = (props) => {
  const params = useParams();
  return (
    <DetailsPage
      {...props}
      namespace={params.ns}
      kind={referenceForModel(SubscriptionModel)}
      name={params.name}
      pages={[navFactory.details(SubscriptionDetails), navFactory.editYaml()]}
      resources={[
        {
          kind: referenceForModel(PackageManifestModel),
          isList: true,
          namespace: props.namespace,
          prop: 'packageManifests',
        },
        {
          kind: referenceForModel(InstallPlanModel),
          isList: true,
          namespace: props.namespace,
          prop: 'installPlans',
        },
        {
          kind: referenceForModel(ClusterServiceVersionModel),
          namespace: props.namespace,
          isList: true,
          prop: 'clusterServiceVersions',
        },
        {
          kind: referenceForModel(SubscriptionModel),
          namespace: props.namespace,
          isList: true,
          prop: 'subscriptions',
        },
      ]}
      customActionMenu={(kindObj: K8sModel, obj: K8sResourceKind) => (
        <LazyActionMenu
          context={{
            [referenceFor(obj)]: obj,
          }}
        />
      )}
    />
  );
};

export type SubscriptionsPageProps = {
  namespace?: string;
};

export type SubscriptionsListProps = {
  loaded: boolean;
  loadError?: string;
  data: SubscriptionKind[];
  operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
};

export type SubscriptionUpdatesProps = {
  catalogHealth: { healthy?: boolean };
  obj: SubscriptionKind;
  pkg: PackageManifestKind;
  installedCSV?: ClusterServiceVersionKind;
  installPlan?: InstallPlanKind;
  subscriptions: SubscriptionKind[];
};

export type SubscriptionUpdatesState = {
  waitingForUpdate: boolean;
  channel: string;
  installPlanApproval: InstallPlanApproval;
};

export type SubscriptionDetailsProps = {
  clusterServiceVersions?: ClusterServiceVersionKind[];
  installPlans?: InstallPlanKind[];
  obj: SubscriptionKind;
  packageManifests: PackageManifestKind[];
  subscriptions: SubscriptionKind[];
};

export type SubscriptionDetailsPageProps = {
  namespace: string;
};

SubscriptionsPage.displayName = 'SubscriptionsPage';
SubscriptionDetails.displayName = 'SubscriptionDetails';
SubscriptionDetailsPage.displayName = 'SubscriptionDetailsPage';
