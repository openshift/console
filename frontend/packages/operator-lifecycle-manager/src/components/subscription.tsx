import * as React from 'react';
import { Alert, Button, Popover } from '@patternfly/react-core';
import { InProgressIcon, PencilAltIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match, Link } from 'react-router-dom';
import { Conditions } from '@console/internal/components/conditions';
import {
  DetailsPage,
  MultiListPage,
  Table,
  TableRow,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  FieldLevelHelp,
  Kebab,
  LoadingInline,
  MsgBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourcePathFromModel,
  ResourceStatus,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { removeQueryArgument } from '@console/internal/components/utils/router';
import {
  referenceForModel,
  k8sGet,
  k8sPatch,
  k8sKill,
  k8sUpdate,
} from '@console/internal/module/k8s';
import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  getName,
  getNamespace,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  StatusIconAndText,
  WarningStatus,
  YellowExclamationTriangleIcon,
} from '@console/shared';
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
import { createInstallPlanApprovalModal } from './modals/installplan-approval-modal';
import { createSubscriptionChannelModal } from './modals/subscription-channel-modal';
import { createUninstallOperatorModal } from './modals/uninstall-operator-modal';
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

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  Kebab.columnClass,
];

export const UpgradeApprovalLink: React.FC<{ subscription: SubscriptionKind }> = ({
  subscription,
}) => {
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

export const SubscriptionStatus: React.FC<{ subscription: SubscriptionKind }> = ({
  subscription,
}) => {
  const { t } = useTranslation();
  switch (subscription.status.state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable:
      return (
        <span>
          <YellowExclamationTriangleIcon /> {t('olm~Upgrade available')}
        </span>
      );
    case SubscriptionState.SubscriptionStateUpgradePending:
      return upgradeRequiresApproval(subscription) && subscription.status.installPlanRef ? (
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
        <span className={_.isEmpty(subscription.status.state) ? 'text-muted' : ''}>
          {subscription.status.state || t('olm~Unknown failure')}
        </span>
      );
  }
};

const menuActions = [
  Kebab.factory.Edit,
  (kind, obj) => ({
    // t('olm~Remove Subscription')
    labelKey: 'olm~Remove Subscription',
    callback: () => createUninstallOperatorModal({ k8sKill, k8sGet, k8sPatch, subscription: obj }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'delete',
    },
  }),
  (kind, obj) => {
    const installedCSV = _.get(obj, 'status.installedCSV');
    return {
      // t('olm~View ClusterServiceVersion...')
      labelKey: 'olm~View ClusterServiceVersion...',
      href: `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${installedCSV}`,
      hidden: !installedCSV,
    };
  },
];

export const SubscriptionTableRow: React.FC<RowFunctionArgs> = ({ obj, index, key, style }) => {
  const { t } = useTranslation();
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
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
      <TableData className={classNames(tableColumnClasses[3], 'co-truncate', 'co-select-to-copy')}>
        {obj.spec.channel || 'default'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.spec.installPlanApproval || t('olm~Automatic')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(SubscriptionModel)}
          resource={obj}
        />
      </TableData>
    </TableRow>
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
      Row={(rowArgs) => <SubscriptionTableRow {...rowArgs} />}
      EmptyMsg={() => (
        <MsgBox
          title={t('olm~No Subscriptions found')}
          detail={t(
            'olm~Each Namespace can subscribe to a single channel of a package for automatic updates.',
          )}
        />
      )}
      virtualize
    />
  );
});

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = (props) => {
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
      createProps={{ to: '/operatorhub' }}
      createButtonText={t('olm~Create Subscription')}
      ListComponent={SubscriptionsList}
      filterLabel={t('olm~Subscriptions by package')}
    />
  );
};

export const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  catalogSources = [],
  clusterServiceVersions = [],
  installPlans = [],
  obj,
  packageManifests = [],
  subscriptions = [],
}) => {
  const { t } = useTranslation();
  const catalogSource = catalogSourceForSubscription(catalogSources, obj);
  const catalogSourceName = getName(catalogSource);
  const catalogSourceHealthy = obj?.status?.catalogHealth?.find(
    (ch) => (ch.catalogSourceRef.name = catalogSourceName),
  )?.healthy;
  const installedCSV = installedCSVForSubscription(clusterServiceVersions, obj);
  const installPlan = installPlanForSubscription(installPlans, obj);
  const installStatusPhase = installPlan?.status?.phase;
  const installFailedCondition = installPlan?.status?.conditions?.find(
    ({ type, status }) => type === 'Installed' && status === 'False',
  );
  const installFailedMessage =
    installFailedCondition?.message ||
    installFailedCondition?.reason ||
    t('olm~InstallPlan failed');

  const pkg = packageForSubscription(packageManifests, obj);
  if (new URLSearchParams(window.location.search).has('showDelete')) {
    createUninstallOperatorModal({ k8sKill, k8sGet, k8sPatch, subscription: obj })
      .result.then(() => removeQueryArgument('showDelete'))
      .catch(_.noop);
  }

  return (
    <>
      <div className="co-m-pane__body">
        {!catalogSource && (
          <Alert
            isInline
            className="co-alert"
            variant="warning"
            title={t('olm~CatalogSource removed')}
          >
            {t(
              'olm~The CatalogSource for this Operator has been removed. The CatalogSource must be added back in order for this Operator to receive any updates.',
            )}
          </Alert>
        )}
        {installStatusPhase === InstallPlanPhase.InstallPlanPhaseFailed && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="danger"
            title={installStatusPhase}
          >
            {installFailedMessage}
          </Alert>
        )}
        <SectionHeading text={t('olm~Subscription details')} />
        <div className="co-m-pane__body-group">
          <SubscriptionUpdates
            catalogSource={catalogSource}
            pkg={pkg}
            obj={obj}
            installedCSV={installedCSV}
            installPlan={installPlan}
            subscriptions={subscriptions}
          />
        </div>
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} showAnnotations={false} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>{t('olm~Installed version')}</dt>
                <dd>
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
                </dd>
                <dt>{t('olm~Starting version')}</dt>
                <dd>{obj.spec.startingCSV || t('olm~None')}</dd>
                <dt>{t('olm~CatalogSource')}</dt>
                <dd>
                  {catalogSource ? (
                    <ResourceLink
                      kind={referenceForModel(CatalogSourceModel)}
                      name={catalogSourceName}
                      namespace={getNamespace(catalogSource)}
                      title={getName(catalogSource)}
                    >
                      {catalogSourceHealthy !== undefined && (
                        <ResourceStatus badgeAlt>
                          {catalogSourceHealthy ? (
                            <StatusIconAndText icon={<GreenCheckCircleIcon />} title="Healthy" />
                          ) : (
                            <StatusIconAndText
                              icon={<RedExclamationCircleIcon />}
                              title="Unhealthy"
                            />
                          )}
                        </ResourceStatus>
                      )}
                    </ResourceLink>
                  ) : (
                    t('olm~None')
                  )}
                </dd>
                <dt>{t('olm~InstallPlan')}</dt>
                <dd>
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
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('olm~Conditions')} />
        <Conditions conditions={obj?.status?.conditions} />
      </div>
    </>
  );
};

export const SubscriptionUpdates: React.FC<SubscriptionUpdatesProps> = ({
  catalogSource,
  installedCSV,
  installPlan,
  obj,
  pkg,
  subscriptions,
}) => {
  const { t } = useTranslation();
  const prevInstallPlanApproval = React.useRef(obj?.spec?.installPlanApproval);
  const prevChannel = React.useRef(obj?.spec?.channel);
  const [waitingForUpdate, setWaitingForUpdate] = React.useState(false);

  React.useEffect(() => {
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

  const k8sUpdateAndWait = (...args) => k8sUpdate(...args).then(() => setWaitingForUpdate(true));
  const channelModal = () =>
    createSubscriptionChannelModal({ subscription: obj, pkg, k8sUpdate: k8sUpdateAndWait });
  const approvalModal = () => createInstallPlanApprovalModal({ obj, k8sUpdate: k8sUpdateAndWait });
  const installPlanPhase = React.useMemo(() => {
    if (installPlan) {
      switch (installPlan.status?.phase as InstallPlanPhase) {
        case InstallPlanPhase.InstallPlanPhaseRequiresApproval:
          return t('olm~1 requires approval');
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

  return (
    <div className="co-detail-table">
      <div className="co-detail-table__row row">
        <div className="co-detail-table__section col-sm-3">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">
              {t('olm~Update channel')}
              <FieldLevelHelp>
                {t('olm~The channel to track and receive the updates from.')}
              </FieldLevelHelp>
            </dt>
            <dd>
              {waitingForUpdate ? (
                <LoadingInline />
              ) : (
                <Button
                  type="button"
                  isInline
                  onClick={channelModal}
                  variant="link"
                  isDisabled={!pkg}
                >
                  {obj.spec.channel || 'default'}
                  {pkg && <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />}
                </Button>
              )}
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section col-sm-3">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">
              {t('olm~Update approval')}
              <FieldLevelHelp>
                {t('olm~The strategy to determine either manual or automatic updates.')}
              </FieldLevelHelp>
            </dt>
            <dd>
              {waitingForUpdate ? (
                <LoadingInline />
              ) : (
                <>
                  <div>
                    <Button type="button" isInline onClick={approvalModal} variant="link">
                      {obj.spec.installPlanApproval || 'Automatic'}
                      <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
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
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section co-detail-table__section--last col-sm-6">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">{t('olm~Upgrade status')}</dt>
            {catalogSource ? (
              <dd>
                <SubscriptionStatus subscription={obj} />
              </dd>
            ) : (
              <dd>
                <WarningStatus title={t('olm~Cannot update')} />
                <span className="text-muted">{t('olm~CatalogSource was removed')}</span>
              </dd>
            )}
          </dl>
          {catalogSource && (
            <>
              <div className="co-detail-table__bracket" />
              <div className="co-detail-table__breakdown">
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const SubscriptionDetailsPage: React.FC<SubscriptionDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(SubscriptionModel)}
    name={props.match.params.name}
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
        kind: referenceForModel(CatalogSourceModel),
        isList: true,
        prop: 'catalogSources',
      },
      {
        kind: referenceForModel(SubscriptionModel),
        namespace: props.namespace,
        isList: true,
        prop: 'subscriptions',
      },
    ]}
    menuActions={menuActions}
  />
);

export type SubscriptionsPageProps = {
  namespace?: string;
  match?: match<{ ns?: string }>;
};

export type SubscriptionsListProps = {
  loaded: boolean;
  loadError?: string;
  data: SubscriptionKind[];
  operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
};

export type SubscriptionUpdatesProps = {
  catalogSource: CatalogSourceKind;
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
  catalogSources?: CatalogSourceKind[];
  clusterServiceVersions?: ClusterServiceVersionKind[];
  installPlans?: InstallPlanKind[];
  obj: SubscriptionKind;
  packageManifests: PackageManifestKind[];
  subscriptions: SubscriptionKind[];
};

export type SubscriptionDetailsPageProps = {
  match: match<{ ns: string; name: string }>;
  namespace: string;
};

SubscriptionsPage.displayName = 'SubscriptionsPage';
SubscriptionDetails.displayName = 'SubscriptionDetails';
SubscriptionDetailsPage.displayName = 'SubscriptionDetailsPage';
