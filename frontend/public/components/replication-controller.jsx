import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Status,
  LazyActionMenu,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  DASH,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, sorts } from './factory';
import {
  ContainerTable,
  navFactory,
  SectionHeading,
  ResourceSummary,
  ResourcePodCount,
  AsyncComponent,
  ResourceLink,
  OwnerReferences,
  PodsComponent,
  RuntimeClass,
  LoadingBox,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { referenceForModel } from '../module/k8s';
import { VolumesTable } from './volumes-table';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
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
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ReplicationControllerModel } from '../models';
import { sortResourceByValue } from './factory/Table/sort';
import { ReplicasCount } from './workload-table';

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

const { details, editYaml, pods, envEditor, events } = navFactory;

const ReplicationControllerPods = (props) => <PodsComponent {...props} showNodes />;

export const ReplicationControllersDetailsPage = (props) => {
  const { t } = useTranslation();
  const Details = ({ obj: replicationController }) => {
    const revision = _.get(replicationController, [
      'metadata',
      'annotations',
      'openshift.io/deployment-config.latest-version',
    ]);
    const phase = _.get(replicationController, [
      'metadata',
      'annotations',
      'openshift.io/deployment.phase',
    ]);
    return (
      <>
        <PaneBody>
          <SectionHeading text={t('public~ReplicationController details')} />
          <Grid hasGutter>
            <GridItem md={6}>
              <ResourceSummary
                resource={replicationController}
                showPodSelector
                showNodeSelector
                showTolerations
              >
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
                {phase && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('public~Phase')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Status status={phase} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                <ResourcePodCount resource={replicationController} />
                <RuntimeClass obj={replicationController} />
                <PodDisruptionBudgetField obj={replicationController} />
              </DescriptionList>
            </GridItem>
          </Grid>
        </PaneBody>
        <PaneBody>
          <SectionHeading text={t('public~Containers')} />
          <ContainerTable containers={replicationController.spec.template.spec.containers} />
        </PaneBody>
        <PaneBody>
          <VolumesTable resource={replicationController} heading={t('public~Volumes')} />
        </PaneBody>
      </>
    );
  };

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
      getResourceStatus={(resource) =>
        resource?.metadata?.annotations?.['openshift.io/deployment.phase'] || null
      }
      customActionMenu={customActionMenu}
      pages={[
        details(Details),
        editYaml(),
        pods(ReplicationControllerPods),
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
  { id: 'phase' },
  { id: 'owner' },
  { id: 'created' },
  { id: '' },
];

const getDataViewRows = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const phase = obj?.metadata?.annotations?.['openshift.io/deployment.phase'];
    const context = { [referenceForModel(ReplicationControllerModel)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ReplicationControllerModel)}
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
        cell: <ReplicasCount obj={obj} kind={referenceForModel(ReplicationControllerModel)} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <Status status={phase} />,
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

const useReplicationControllersColumns = () => {
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
        title: t('public~Phase'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.annotations["openshift.io/deployment.phase"]',
        props: {
          modifier: 'nowrap',
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

const ReplicationControllersList = ({ data, loaded, ...props }) => {
  const columns = useReplicationControllersColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView
        {...props}
        label={ReplicationControllerModel.labelPlural}
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

export const ReplicationControllersPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage
      {...props}
      kind={referenceForModel(ReplicationControllerModel)}
      ListComponent={ReplicationControllersList}
      canCreate={canCreate}
      omitFilterToolbar={true}
    />
  );
};
