// TODO file should be renamed replica-set.jsx to match convention

import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import {
  Kebab,
  ContainerTable,
  navFactory,
  SectionHeading,
  ResourceSummary,
  ResourcePodCount,
  AsyncComponent,
  ResourceLink,
  resourcePath,
  LabelList,
  OwnerReferences,
  PodsComponent,
  RuntimeClass,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import {
  LazyActionMenu,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
} from '@console/shared/src';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';

import { referenceFor, referenceForModel } from '../module/k8s';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const Details = ({ obj: replicaSet }) => {
  const revision = _.get(replicaSet, [
    'metadata',
    'annotations',
    'deployment.kubernetes.io/revision',
  ]);
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~ReplicaSet details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={replicaSet} showPodSelector showNodeSelector showTolerations>
              {revision && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Deployment revision')}</DescriptionListTerm>
                  <DescriptionListDescription>{revision}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </ResourceSummary>
          </GridItem>
          <GridItem md={6}>
            <DescriptionList>
              <ResourcePodCount resource={replicaSet} />
              <RuntimeClass obj={replicaSet} />
              <PodDisruptionBudgetField obj={replicaSet} />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={replicaSet.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={replicaSet} heading={t('public~Volumes')} />
      </PaneBody>
    </>
  );
};

const EnvironmentPage = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const environmentComponent = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

const ReplicaSetPods = (props) => <PodsComponent {...props} showNodes />;

const { details, editYaml, pods, envEditor, events } = navFactory;
const ReplicaSetsDetailsPage = (props) => {
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
      customActionMenu={customActionMenu}
      pages={[
        details(Details),
        editYaml(),
        pods(ReplicaSetPods),
        envEditor(environmentComponent),
        events(ResourceEventStream),
      ]}
    />
  );
};

const kind = 'ReplicaSet';

const tableColumnClasses = [
  '',
  '',
  css('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-v6-u-w-16-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const ReplicaSetTableRow = ({ obj }) => {
  const { t } = useTranslation();
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link
          to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`}
          title="pods"
        >
          {t('public~{{count1}} of {{count2}} pods', {
            count1: obj.status.replicas || 0,
            count2: obj.spec.replicas,
          })}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <OwnerReferences resource={obj} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

const ReplicaSetsList = (props) => {
  const { t } = useTranslation();
  const ReplicaSetTableHeader = () => [
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
      sortFunc: 'numReplicas',
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
      title: t('public~Owner'),
      sortField: 'metadata.ownerReferences[0].name',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('public~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={t('public~ReplicaSets')}
      Header={ReplicaSetTableHeader}
      Row={ReplicaSetTableRow}
      virtualize
    />
  );
};
const ReplicaSetsPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage canCreate={canCreate} kind="ReplicaSet" ListComponent={ReplicaSetsList} {...props} />
  );
};

export { ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage };
