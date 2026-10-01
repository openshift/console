import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  getNameCellProps,
  ConsoleDataView,
  nameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { MachineAutoscalerModel } from '../models';
import type { K8sResourceKind } from '../module/k8s';
import { groupVersionFor, referenceForGroupVersionKind, referenceForModel } from '../module/k8s';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { LoadingBox } from './utils/status-box';

const machineAutoscalerReference = referenceForModel(MachineAutoscalerModel);

const MachineAutoscalerTargetLink: FC<MachineAutoscalerTargetLinkProps> = ({ obj }) => {
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

const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) =>
  data.map(({ obj }) => {
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
        cell: <LazyActionMenu context={{ [machineAutoscalerReference]: obj }} />,
        props: actionsCellProps,
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

const useMachineAutoscalerColumns = (): {
  columns: ConsoleDataViewColumn<K8sResourceKind>[];
} => {
  const { t } = useTranslation('public');

  const columns: ConsoleDataViewColumn<K8sResourceKind>[] = useMemo(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...nameCellProps,
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Scale target'),
        id: tableColumnInfo[2].id,
        sort: 'spec.scaleTargetRef.name',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Min'),
        id: tableColumnInfo[3].id,
        sort: 'spec.minReplicas',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Max'),
        id: tableColumnInfo[4].id,
        sort: 'spec.maxReplicas',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...actionsCellProps,
        },
      },
    ],
    [t],
  );

  return { columns };
};

const MachineAutoscalerList: FC<MachineAutoscalerListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const { columns } = useMachineAutoscalerColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        id={MachineAutoscalerModel}
        label={MachineAutoscalerModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};

const MachineAutoscalerDetails: FC<MachineAutoscalerDetailsProps> = ({ obj }) => {
  const { t } = useTranslation('public');
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('MachineAutoscaler details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Scale target')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <MachineAutoscalerTargetLink obj={obj} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Min replicas')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {_.get(obj, 'spec.minReplicas', DASH)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Max replicas')}</DescriptionListTerm>
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

export const MachineAutoscalerPage: FC<MachineAutoscalerPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineAutoscalerList}
    kind={machineAutoscalerReference}
    canCreate
    omitFilterToolbar
  />
);

export const MachineAutoscalerDetailsPage: FC = (props) => (
  <DetailsPage
    {...props}
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

type MachineAutoscalerDetailsProps = {
  obj: K8sResourceKind;
};
