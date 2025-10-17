import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants';
import { TableColumn } from '@console/dynamic-plugin-sdk';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { MachineAutoscalerModel } from '../models';
import {
  groupVersionFor,
  K8sResourceKind,
  referenceForGroupVersionKind,
  referenceForModel,
} from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import {
  Kebab,
  LoadingBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineAutoscalerReference = referenceForModel(MachineAutoscalerModel);

const MachineAutoscalerTargetLink: React.FC<MachineAutoscalerTargetLinkProps> = ({ obj }) => {
  const targetAPIVersion: string = _.get(obj, 'spec.scaleTargetRef.apiVersion');
  const targetKind: string = _.get(obj, 'spec.scaleTargetRef.kind');
  const targetName: string = _.get(obj, 'spec.scaleTargetRef.name');
  if (!targetAPIVersion || !targetKind || !targetName) {
    return <>{DASH}</>;
  }

  const groupVersion = groupVersionFor(targetAPIVersion);
  const reference = referenceForGroupVersionKind(groupVersion.group)(groupVersion.version)(
    targetKind,
  );
  return <ResourceLink kind={reference} name={targetName} namespace={obj.metadata.namespace} />;
};

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'scaleTarget' },
  { id: 'minReplicas' },
  { id: 'maxReplicas' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<K8sResourceKind, undefined> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineAutoscalerReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <MachineAutoscalerTargetLink obj={obj} />,
      },
      [tableColumnInfo[3].id]: {
        cell: _.get(obj, 'spec.minReplicas', DASH),
      },
      [tableColumnInfo[4].id]: {
        cell: _.get(obj, 'spec.maxReplicas') || DASH,
      },
      [tableColumnInfo[5].id]: {
        cell: (
          <ResourceKebab actions={menuActions} kind={machineAutoscalerReference} resource={obj} />
        ),
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

const useMachineAutoscalerColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<K8sResourceKind>[] = React.useMemo(() => {
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
        title: t('public~Scale target'),
        id: tableColumnInfo[2].id,
        sort: 'spec.scaleTargetRef.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Min'),
        id: tableColumnInfo[3].id,
        sort: 'spec.minReplicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Max'),
        id: tableColumnInfo[4].id,
        sort: 'spec.maxReplicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const MachineAutoscalerList: React.FC<MachineAutoscalerListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const columns = useMachineAutoscalerColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        label={MachineAutoscalerModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

const MachineAutoscalerDetails: React.FC<MachineAutoscalerDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~MachineAutoscaler details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Scale target')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <MachineAutoscalerTargetLink obj={obj} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Min replicas')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {_.get(obj, 'spec.minReplicas', DASH)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Max replicas')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {_.get(obj, 'spec.maxReplicas') || DASH}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
        </Grid>
      </PaneBody>
    </>
  );
};

export const MachineAutoscalerPage: React.FC<MachineAutoscalerPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineAutoscalerList}
    kind={machineAutoscalerReference}
    canCreate={true}
    omitFilterToolbar={true}
  />
);

export const MachineAutoscalerDetailsPage: React.FC = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    kind={machineAutoscalerReference}
    pages={[navFactory.details(MachineAutoscalerDetails), navFactory.editYaml()]}
  />
);

type MachineAutoscalerListProps = {
  data: K8sResourceKind[];
  loaded: boolean;
  loadError?: any;
};

type MachineAutoscalerPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type MachineAutoscalerTargetLinkProps = {
  obj: K8sResourceKind;
};

export type MachineAutoscalerDetailsProps = {
  obj: K8sResourceKind;
};
