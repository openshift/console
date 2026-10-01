import type { FC, ReactNode } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  Button,
  Hint,
  HintTitle,
  HintBody,
  HintFooter,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { Table as PFTable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import { getUser, GreenCheckCircleIcon } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { Conditions } from '@console/internal/components/conditions';
import { MultiListPage, DetailsPage } from '@console/internal/components/factory';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import {
  SectionHeading,
  ConsoleEmptyState,
  ResourceLink,
  ResourceIcon,
  navFactory,
  ResourceSummary,
  useAccessReview,
} from '@console/internal/components/utils';
import { authSvc } from '@console/internal/module/auth';
import type { UserInfo } from '@console/internal/module/k8s';
import {
  apiGroupForReference,
  referenceFor,
  referenceForModel,
  referenceForOwnerRef,
  k8sPatch,
  apiVersionForReference,
} from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Status } from '@console/shared/src/components/status/Status';
import { FLAGS } from '@console/shared/src/constants/common';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  InstallPlanModel,
  OperatorGroupModel,
  CatalogSourceModel,
} from '../models';
import type { InstallPlanKind, OperatorGroupKind, Step } from '../types';
import { InstallPlanApproval } from '../types';
import { ClassicOperatorMigrationAlert } from './classic-operators/ClassicOperatorMigrationAlert';
import { sortByOptionalPath } from './dataViewSortHelpers';
import { LazyInstallPlanPreviewModalOverlay } from './modals';
import { requireOperatorGroup } from './operator-group';
import { InstallPlanReview, referenceForStepResource } from './index';

const componentsTableColumnClasses = [
  'pf-v6-c-table__td',
  'pf-v6-c-table__td',
  css('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-v6-u-w-16-on-lg', 'pf-v6-c-table__td'),
  css('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-v6-c-table__td'),
];

const InstallPlanHint: FC<InstallPlanHintProps> = ({ title, body, footer }) => (
  <Hint>
    <HintTitle className="pf-v6-u-font-size-md">{title}</HintTitle>
    <HintBody>{body}</HintBody>
    <HintFooter>{footer}</HintFooter>
  </Hint>
);

/** Subscriptions that own an InstallPlan, or a "None" placeholder when it has none. */
const InstallPlanSubscriptions: FC<{ obj: InstallPlanKind }> = ({ obj }) => {
  const { t } = useTranslation('olm');
  const subscriptionRefs = (obj.metadata.ownerReferences || []).filter(
    (ref) => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel),
  );
  return subscriptionRefs.length ? (
    <ul className="pf-v6-c-list pf-m-plain">
      {subscriptionRefs.map((ref) => (
        <li key={ref.uid}>
          <ResourceLink
            kind={referenceForModel(SubscriptionModel)}
            name={ref.name}
            namespace={obj.metadata.namespace}
            title={ref.uid}
          />
        </li>
      ))}
    </ul>
  ) : (
    <span className="pf-v6-u-text-color-subtle">{t('None')}</span>
  );
};

export const useInstallPlanColumns = (): {
  columns: ConsoleDataViewColumn<InstallPlanKind>[];
} => {
  const { t } = useTranslation('olm');
  const columns = useMemo(
    () => [
      { type: 'name' as const, id: 'name', title: t('Name'), sort: 'metadata.name' },
      {
        id: 'namespace',
        title: t('Namespace'),
        sort: 'metadata.namespace',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'status',
        title: t('Status'),
        sort: sortByOptionalPath<InstallPlanKind>('status.phase'),
        props: { modifier: 'nowrap' as const },
      },
      // Components and Subscriptions render multi-item lists, so they must be allowed to wrap.
      {
        id: 'components',
        title: t('Components'),
      },
      {
        id: 'subscriptions',
        title: t('Subscriptions'),
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t],
  );
  return { columns };
};

export const getInstallPlanDataViewRows: GetDataViewRows<InstallPlanKind> = (data, columns) =>
  data.map(({ obj }) => {
    const rowCells = {
      name: {
        cell: (
          <ResourceLink
            kind={referenceForModel(InstallPlanModel)}
            namespace={obj.metadata.namespace}
            name={obj.metadata.name}
          />
        ),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={obj.metadata.namespace} /> },
      status: { cell: <Status status={obj.status?.phase ?? 'Unknown'} /> },
      components: {
        cell: (
          <ul className="pf-v6-c-list pf-m-plain">
            {obj.spec.clusterServiceVersionNames.map((csvName) => (
              <li key={csvName}>
                {obj.status?.phase === 'Complete' ? (
                  <ResourceLink
                    kind={referenceForModel(ClusterServiceVersionModel)}
                    name={csvName}
                    namespace={obj.metadata.namespace}
                    title={csvName}
                  />
                ) : (
                  <>
                    <ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} />
                    {csvName}
                  </>
                )}
              </li>
            ))}
          </ul>
        ),
      },
      subscriptions: { cell: <InstallPlanSubscriptions obj={obj} /> },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const EmptyMsg: FC = () => {
  const { t } = useTranslation('olm');
  return (
    <ConsoleEmptyState title={t('No InstallPlans found')}>
      {t('InstallPlans are created automatically by subscriptions or manually using the CLI.')}
    </ConsoleEmptyState>
  );
};

export const InstallPlansList = requireOperatorGroup((props: InstallPlansListProps) => {
  const { t } = useTranslation('olm');
  const { columns } = useInstallPlanColumns();

  // ConsoleDataView has a generic empty body state, so keep the InstallPlan-specific wording by
  // short-circuiting when nothing loaded at all. Filtering down to zero rows still uses the table.
  if (props.loaded && !props.loadError && props.data?.length === 0) {
    return <EmptyMsg />;
  }

  return (
    <ConsoleDataView<InstallPlanKind>
      {...props}
      id={InstallPlanModel}
      label={t('InstallPlans')}
      data={props.data || []}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getInstallPlanDataViewRows}
    />
  );
});

const getCatalogSources = (
  installPlan: InstallPlanKind,
): { sourceName: string; sourceNamespace: string }[] => {
  const seen = new Set<string>();
  const result: { sourceName: string; sourceNamespace: string }[] = [];
  (installPlan?.status?.plan || []).forEach(({ resource: { sourceName, sourceNamespace } }) => {
    const key = `${sourceNamespace}/${sourceName}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ sourceName, sourceNamespace });
    }
  });
  return result;
};

export const InstallPlansPage: FC<InstallPlansPageProps> = (props) => {
  const { t } = useTranslation('olm');
  const params = useParams();
  const namespace = props.namespace || params?.ns;
  return (
    <MultiListPage
      {...props}
      helpAlert={<ClassicOperatorMigrationAlert />}
      namespace={namespace}
      resources={[
        {
          kind: referenceForModel(InstallPlanModel),
          namespace,
          namespaced: true,
          prop: 'installPlan',
        },
        {
          kind: referenceForModel(OperatorGroupModel),
          namespace,
          namespaced: true,
          prop: 'operatorGroup',
        },
      ]}
      flatten={(resources) => _.get(resources.installPlan, 'data', [])}
      title={t('InstallPlans')}
      showTitle={false}
      omitFilterToolbar
      ListComponent={InstallPlansList}
    />
  );
};

const updateUser = (isOpenShift: boolean, user: UserInfo): string => {
  if (!isOpenShift) {
    return authSvc.name();
  }
  return user?.username;
};

export const NeedInstallPlanPermissions: FC<NeedInstallPlanPermissionsProps> = ({
  installPlan,
}) => {
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);
  const user = useConsoleSelector<UserInfo>(getUser);

  const [username, setUsername] = useState(updateUser(isOpenShift, user));

  useEffect(() => {
    setUsername(updateUser(isOpenShift, user));
  }, [isOpenShift, user]);

  const { t } = useTranslation('olm');

  const apiGroup = apiGroupForReference(referenceFor(installPlan));

  return (
    <Alert
      variant="info"
      isInline
      title={t('Missing sufficient privileges for manual InstallPlan approval')}
    >
      {username
        ? t(
            'User "{{user}}" does not have permissions to patch resource InstallPlans in API group "{{apiGroup}}" in the namespace "{{namespace}}."',
            { user: username, apiGroup, namespace: installPlan.metadata.namespace },
          )
        : t(
            'User does not have permissions to patch resource InstallPlans in API group "{{apiGroup}}" in the namespace "{{namespace}}."',
            { apiGroup, namespace: installPlan.metadata.namespace },
          )}
    </Alert>
  );
};

export const InstallPlanDetails: FC<InstallPlanDetailsProps> = ({ obj }) => {
  const { t } = useTranslation('olm');
  const needsApproval =
    obj.spec.approval === InstallPlanApproval.Manual && obj.spec.approved === false;

  const canPatchInstallPlans = useAccessReview({
    group: InstallPlanModel.apiGroup,
    resource: InstallPlanModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  });

  return (
    <>
      {needsApproval && canPatchInstallPlans && (
        <PaneBody>
          <InstallPlanHint
            title={t('Review manual InstallPlan')}
            body={t(
              'Inspect the requirements for the components specified in this InstallPlan before approving.',
            )}
            footer={
              <Link
                to={`/k8s/ns/${obj.metadata.namespace}/${referenceForModel(InstallPlanModel)}/${
                  obj.metadata.name
                }/components`}
              >
                <Button variant="primary">{t('Preview InstallPlan')}</Button>
              </Link>
            }
          />
        </PaneBody>
      )}
      {needsApproval && !canPatchInstallPlans && (
        <PaneBody>
          <NeedInstallPlanPermissions installPlan={obj} />
        </PaneBody>
      )}
      <PaneBody>
        <SectionHeading text={t('InstallPlan details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} showAnnotations={false} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status status={obj.status?.phase ?? t('Unknown')} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Components')}</DescriptionListTerm>
                {(obj.spec.clusterServiceVersionNames || []).map((csvName) => (
                  <DescriptionListDescription key={csvName}>
                    {obj.status.phase === 'Complete' ? (
                      <ResourceLink
                        kind={referenceForModel(ClusterServiceVersionModel)}
                        name={csvName}
                        namespace={obj.metadata.namespace}
                        title={csvName}
                      />
                    ) : (
                      <>
                        <ResourceIcon kind={referenceForModel(ClusterServiceVersionModel)} />
                        {csvName}
                      </>
                    )}
                  </DescriptionListDescription>
                ))}
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('CatalogSources')}</DescriptionListTerm>
                {getCatalogSources(obj).map(({ sourceName, sourceNamespace }) => (
                  <DescriptionListDescription key={`${sourceNamespace}-${sourceName}`}>
                    <ResourceLink
                      kind={referenceForModel(CatalogSourceModel)}
                      name={sourceName}
                      namespace={sourceNamespace}
                      title={sourceName}
                    />
                  </DescriptionListDescription>
                ))}
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Conditions')} />
        <Conditions conditions={obj.status?.conditions} />
      </PaneBody>
    </>
  );
};

export const InstallPlanPreview: FC<InstallPlanPreviewProps> = ({ obj, hideApprovalBlock }) => {
  const { t } = useTranslation('olm');
  const navigate = useNavigate();
  const launchModal = useOverlay();
  const [needsApproval, setNeedsApproval] = useState(
    obj.spec.approval === InstallPlanApproval.Manual && obj.spec.approved === false,
  );
  const subscription = obj?.metadata?.ownerReferences.find(
    (ref) => referenceForOwnerRef(ref) === referenceForModel(SubscriptionModel),
  );

  const previewModal = useCallback(
    (stepResource: Step['resource']) =>
      launchModal(LazyInstallPlanPreviewModalOverlay, { stepResource }),
    [launchModal],
  );

  const plan = obj?.status?.plan || [];
  const stepsByCSV = Object.values(_.groupBy(plan, 'resolving')) as Step[][];

  const approve = () =>
    k8sPatch(InstallPlanModel, obj, [{ op: 'replace', path: '/spec/approved', value: true }])
      .then(() => setNeedsApproval(false))
      .catch((error) => launchModal(ErrorModal, { error: error.toString() }));

  const stepStatus = (status: Step['status']) => (
    <>
      {status === 'Present' && <GreenCheckCircleIcon className="co-icon-space-r" />}
      {status === 'Created' && <GreenCheckCircleIcon className="co-icon-space-r" />}
      {status}
    </>
  );

  const canPatchInstallPlans = useAccessReview({
    group: InstallPlanModel.apiGroup,
    resource: InstallPlanModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  });

  return plan.length > 0 ? (
    <>
      {needsApproval && !hideApprovalBlock && !canPatchInstallPlans && (
        <PaneBody>
          <NeedInstallPlanPermissions installPlan={obj} />
        </PaneBody>
      )}
      {needsApproval && !hideApprovalBlock && canPatchInstallPlans && (
        <PaneBody>
          <InstallPlanHint
            title={t('Review manual InstallPlan')}
            body={<InstallPlanReview installPlan={obj} />}
            footer={
              <div className="pf-v6-c-form">
                <div className="pf-v6-c-form__actions">
                  <Button variant="primary" isDisabled={!needsApproval} onClick={() => approve()}>
                    {needsApproval ? t('Approve') : t('Approved')}
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={false}
                    onClick={() =>
                      navigate(
                        `/k8s/ns/${obj.metadata.namespace}/${referenceForModel(
                          SubscriptionModel,
                        )}/${subscription.name}?showDelete=true`,
                      )
                    }
                  >
                    {t('Deny')}
                  </Button>
                </div>
              </div>
            }
          />
        </PaneBody>
      )}
      {stepsByCSV.map((steps) => (
        <PaneBody key={steps[0].resolving}>
          <SectionHeading text={steps[0].resolving} />
          <PFTable variant="compact" borders>
            <Thead>
              <Tr>
                <Th className={componentsTableColumnClasses[0]}>{t('Name')}</Th>
                <Th className={componentsTableColumnClasses[1]}>{t('Kind')}</Th>
                <Th className={componentsTableColumnClasses[2]}>{t('Status')}</Th>
                <Th className={componentsTableColumnClasses[3]}>{t('API version')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {steps.map((step) => (
                <Tr key={`${referenceForStepResource(step.resource)}-${step.resource.name}`}>
                  <Td className={componentsTableColumnClasses[0]}>
                    {['Present', 'Created'].includes(step.status) ? (
                      <ResourceLink
                        kind={referenceForStepResource(step.resource)}
                        namespace={obj.metadata.namespace}
                        name={step.resource.name}
                        title={step.resource.name}
                      />
                    ) : (
                      <>
                        <ResourceIcon kind={referenceForStepResource(step.resource)} />
                        <Button
                          type="button"
                          onClick={() => previewModal(step.resource)}
                          variant="link"
                        >
                          {step.resource.name}
                        </Button>
                      </>
                    )}
                  </Td>
                  <Td className={componentsTableColumnClasses[1]}>{step.resource.kind}</Td>
                  <Td className={componentsTableColumnClasses[2]}>{stepStatus(step.status)}</Td>
                  <Td className={componentsTableColumnClasses[3]}>
                    {apiVersionForReference(referenceForStepResource(step.resource))}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </PFTable>
        </PaneBody>
      ))}
    </>
  ) : (
    <PaneBody>
      <ConsoleEmptyState title={t('No components resolved')}>
        {t('This InstallPlan has not been fully resolved yet.')}
      </ConsoleEmptyState>
    </PaneBody>
  );
};

export const InstallPlanDetailsPage: FC = (props) => {
  const params = useParams();
  return (
    <DetailsPage
      {...props}
      helpAlert={<ClassicOperatorMigrationAlert />}
      namespace={params.ns}
      kind={referenceForModel(InstallPlanModel)}
      name={params.name}
      pages={[
        navFactory.details(InstallPlanDetails),
        navFactory.editYaml(),
        // t('olm~Components')
        { href: 'components', nameKey: 'olm~Components', component: InstallPlanPreview },
      ]}
    />
  );
};

type InstallPlanHintProps = {
  title?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
};

export type InstallPlansListProps = {
  operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
  data?: InstallPlanKind[];
  loaded?: boolean;
  loadError?: unknown;
};

export type InstallPlansPageProps = {
  namespace?: string;
};

export type InstallPlanDetailsProps = {
  obj: InstallPlanKind;
};

export type InstallPlanPreviewProps = {
  obj: InstallPlanKind;
  hideApprovalBlock?: boolean;
};

export type NeedInstallPlanPermissionsProps = {
  installPlan: InstallPlanKind;
  user?: UserInfo;
};

InstallPlansPage.displayName = 'InstallPlansPage';
