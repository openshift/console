import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import {
  usePodsWatcher,
  PodRing,
  LazyActionMenu,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
} from '@console/shared';
import { K8sResourceKind, referenceFor, referenceForModel } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  KebabAction,
  ContainerTable,
  detailsPage,
  LabelList,
  navFactory,
  PodsComponent,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  LoadingInline,
} from './utils';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DaemonSetModel } from '../models';

export const menuActions: KebabAction[] = [
  AddHealthChecks,
  Kebab.factory.AddStorage,
  ...Kebab.getExtensionsActionsForKind(DaemonSetModel),
  EditHealthChecks,
  ...Kebab.factory.common,
];

const kind = 'DaemonSet';

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];

export const DaemonSetDetailsList: React.FC<DaemonSetDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <DetailsItem
        label={t('public~Current count')}
        obj={ds}
        path="status.currentNumberScheduled"
      />
      <DetailsItem
        label={t('public~Desired count')}
        obj={ds}
        path="status.desiredNumberScheduled"
      />
    </dl>
  );
};

const DaemonSetDetails: React.FC<DaemonSetDetailsProps> = ({ obj: daemonset }) => {
  const { t } = useTranslation();
  const { podData, loaded } = usePodsWatcher(daemonset);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~DaemonSet details')} />
        {loaded ? (
          <PodRing
            key={daemonset.metadata.uid}
            pods={podData?.pods || []}
            obj={daemonset}
            resourceKind={DaemonSetModel}
            enableScaling={false}
          />
        ) : (
          <LoadingInline />
        )}
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary
              resource={daemonset}
              showPodSelector
              showNodeSelector
              showTolerations
            />
          </div>
          <div className="col-lg-6">
            <DaemonSetDetailsList ds={daemonset} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={daemonset.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={daemonset} heading={t('public~Volumes')} />
      </div>
    </>
  );
};

const EnvironmentPage: React.FC<EnvironmentPageProps> = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const EnvironmentTab: React.FC<EnvironmentTabProps> = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

const DaemonSetTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj: daemonset }) => {
  const { t } = useTranslation();
  const resourceKind = referenceFor(daemonset);
  const context = { [resourceKind]: daemonset };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={daemonset.metadata.name}
          namespace={daemonset.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={daemonset.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link
          to={`/k8s/ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`}
          title="pods"
        >
          {t('public~{{currentNumber}} of {{desiredNumber}} pods', {
            currentNumber: daemonset.status.currentNumberScheduled,
            desiredNumber: daemonset.status.desiredNumberScheduled,
          })}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={daemonset.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={daemonset.spec.selector} namespace={daemonset.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

const { details, pods, editYaml, envEditor, events, metrics } = navFactory;
export const DaemonSets: React.FC = (props) => {
  const { t } = useTranslation();
  const DaemonSetTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('public~Status'),
      sortFunc: 'daemonsetNumScheduled',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Pod selector'),
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={t('public~DaemonSets')}
      Header={DaemonSetTableHeader}
      Row={DaemonSetTableRow}
      virtualize
    />
  );
};

export const DaemonSetsPage: React.FC<DaemonSetsPageProps> = (props) => (
  <ListPage canCreate={true} ListComponent={DaemonSets} kind={kind} {...props} />
);

const DaemonSetPods: React.FC<DaemonSetPodsProps> = (props) => (
  <PodsComponent {...props} showNodes />
);

export const DaemonSetsDetailsPage: React.FC<DaemonSetsDetailsPageProps> = (props) => {
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      kind={kind}
      customActionMenu={customActionMenu}
      pages={[
        details(detailsPage(DaemonSetDetails)),
        metrics(),
        editYaml(),
        pods(DaemonSetPods),
        envEditor(EnvironmentTab),
        events(ResourceEventStream),
      ]}
    />
  );
};

type DaemonSetDetailsListProps = {
  ds: K8sResourceKind;
};

type EnvironmentPageProps = {
  obj: K8sResourceKind;
  rawEnvData: any;
  envPath: string[];
  readOnly: boolean;
};

type EnvironmentTabProps = {
  obj: K8sResourceKind;
};

type DaemonSetDetailsProps = {
  obj: K8sResourceKind;
};

type DaemonSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DaemonSetPodsProps = {
  obj: K8sResourceKind;
};

type DaemonSetsDetailsPageProps = {
  match: any;
};
