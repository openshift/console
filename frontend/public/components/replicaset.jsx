// TODO file should be renamed replica-set.jsx to match convention

import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, sorts } from './factory';
import { ContainerTable } from './utils/container-table';
import { navFactory, PodsComponent } from './utils/horizontal-nav';
import { SectionHeading } from './utils/headings';
import { ResourceSummary, ResourcePodCount, RuntimeClass } from './utils/details-page';
import { AsyncComponent } from './utils/async';
import { ResourceLink } from './utils/resource-link';
import { LabelList } from './utils/label-list';
import { OwnerReferences } from './utils/owner-references';
import { LoadingBox } from './utils/status-box';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import {
  LazyActionMenu,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  DASH,
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
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ReplicaSetModel } from '../models';
import { sortResourceByValue } from './factory/Table/sort';
import { ReplicasCount } from './workload-table';

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

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'labels' },
  { id: 'owner' },
  { id: 'created' },
  { id: '' },
];

const getDataViewRows = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const kind = referenceForModel(ReplicaSetModel);
    const resourceKind = referenceFor(obj);
    const context = { [resourceKind]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ReplicaSetModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <ReplicasCount obj={obj} kind={kind} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <LabelList kind={kind} labels={obj.metadata.labels} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <OwnerReferences resource={obj} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useReplicaSetsColumns = () => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: tableColumnInfo[2].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.numReplicas)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Owner'),
        id: tableColumnInfo[4].id,
        sort: 'metadata.ownerReferences[0].name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const ReplicaSetsList = ({ data, loaded, ...props }) => {
  const columns = useReplicaSetsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={ReplicaSetModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};
const ReplicaSetsPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage
      {...props}
      kind={referenceForModel(ReplicaSetModel)}
      ListComponent={ReplicaSetsList}
      canCreate={canCreate}
      omitFilterToolbar={true}
    />
  );
};

export { ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage };
