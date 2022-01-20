import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import {
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  LazyActionMenu,
  usePrometheusGate,
} from '@console/shared';
import { K8sResourceKind, referenceForModel, referenceFor } from '../module/k8s';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table, RowFunctionArgs } from './factory';

import { WorkloadTableRow, WorkloadTableHeader } from './workload-table';

import {
  AsyncComponent,
  Kebab,
  KebabAction,
  ContainerTable,
  ResourceSummary,
  SectionHeading,
  navFactory,
  PodsComponent,
  RuntimeClass,
} from './utils';
import { VolumesTable } from './volumes-table';
import { StatefulSetModel } from '../models';

const { AddStorage, common, ModifyCount } = Kebab.factory;
export const menuActions: KebabAction[] = [
  AddHealthChecks,
  ModifyCount,
  AddStorage,
  ...Kebab.getExtensionsActionsForKind(StatefulSetModel),
  EditHealthChecks,
  ...common,
];

const kind = 'StatefulSet';

const StatefulSetTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  const customActionMenu = <LazyActionMenu context={context} />;
  return <WorkloadTableRow obj={obj} customActionMenu={customActionMenu} kind={kind} />;
};

const StatefulSetTableHeader = () => {
  return WorkloadTableHeader();
};
StatefulSetTableHeader.displayName = 'StatefulSetTableHeader';

const StatefulSetDetails: React.FC<StatefulSetDetailsProps> = ({ obj: ss }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~StatefulSet details')} />
        <PodRingSet key={ss.metadata.uid} obj={ss} path="/spec/replicas" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations>
              <RuntimeClass obj={ss} />
            </ResourceSummary>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={ss.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={ss} heading={t('public~Volumes')} />
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

export const StatefulSetsList: React.FC = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('public~StatefulSets')}
      Header={StatefulSetTableHeader}
      Row={StatefulSetTableRow}
      virtualize
    />
  );
};
export const StatefulSetsPage: React.FC<StatefulSetsPageProps> = (props) => (
  <ListPage {...props} ListComponent={StatefulSetsList} kind={kind} canCreate={true} />
);

const StatefulSetPods: React.FC<StatefulSetPodsProps> = (props) => (
  <PodsComponent {...props} showNodes />
);

export const StatefulSetsDetailsPage: React.FC<StatefulSetsDetailsPageProps> = (props) => {
  const prometheusIsAvailable = usePrometheusGate();
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
        navFactory.details(StatefulSetDetails),
        ...(prometheusIsAvailable ? [navFactory.metrics()] : []),
        navFactory.editYaml(),
        navFactory.pods(StatefulSetPods),
        navFactory.envEditor(EnvironmentTab),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
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

type StatefulSetDetailsProps = {
  obj: K8sResourceKind;
};

type StatefulSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type StatefulSetPodsProps = {
  obj: K8sResourceKind;
};

type StatefulSetsDetailsPageProps = {
  match: any;
};
