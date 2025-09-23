import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage } from './factory';
import { ConfigMapData, ConfigMapBinaryData } from './configmap-and-secret-data';
import { DASH } from '@console/shared';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Grid, GridItem } from '@patternfly/react-core';
import { ConfigMapKind, referenceForModel, TableColumn } from '../module/k8s';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { LoadingBox } from './utils/status-box';
import { sortResourceByValue } from './factory/Table/sort';
import { sorts } from './factory/table';
import { ConfigMapModel } from '../models';

const menuActions = [...Kebab.factory.common];

const kind = referenceForModel(ConfigMapModel);
const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'size' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<ConfigMapKind, undefined> = (data, columns) => {
  return data.map(({ obj: configMap }) => {
    const dataSize = sorts.dataSize(configMap);
    const { name, namespace } = configMap.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ConfigMapModel)}
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
        cell: <span>{dataSize}</span>,
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={configMap.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <ResourceKebab actions={menuActions} kind={kind} resource={configMap} />,
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

const useConfigMapsColumns = (): TableColumn<ConfigMapKind>[] => {
  const { t } = useTranslation();
  return React.useMemo(
    () => [
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
        title: t('public~Size'),
        id: tableColumnInfo[2].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.dataSize)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[4].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );
};

export const ConfigMapsList: React.FCC<ConfigMapsListProps> = ({ data, loaded, ...props }) => {
  const columns = useConfigMapsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<ConfigMapKind>
        {...props}
        label={ConfigMapModel.labelPlural}
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
ConfigMapsList.displayName = 'ConfigMapsList';

export const ConfigMapsPage: React.FCC<ConfigMapsPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/configmaps/~new/form`,
  };
  return (
    <ListPage
      {...props}
      kind={kind}
      ListComponent={ConfigMapsList}
      canCreate={true}
      createProps={createProps}
      omitFilterToolbar={true}
    />
  );
};
ConfigMapsPage.displayName = 'ConfigMapsPage';

export const ConfigMapsDetailsPage: React.FCC = (props) => {
  const { t } = useTranslation();
  const ConfigMapDetails = ({ obj: configMap }: { obj: ConfigMapKind }) => {
    return (
      <>
        <PaneBody>
          <SectionHeading text={t('public~ConfigMap details')} />
          <Grid hasGutter>
            <GridItem md={6}>
              <ResourceSummary resource={configMap} />
            </GridItem>
          </Grid>
        </PaneBody>
        <PaneBody>
          <SectionHeading text={t('public~Data')} />
          <ConfigMapData data={configMap.data} label={t('public~Data')} />
        </PaneBody>
        <PaneBody>
          <SectionHeading text={t('public~Binary data')} />
          <ConfigMapBinaryData data={configMap.binaryData} />
        </PaneBody>
      </>
    );
  };

  return (
    <DetailsPage
      {...props}
      kind={kind}
      menuActions={menuActions}
      pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]}
    />
  );
};
ConfigMapsDetailsPage.displayName = 'ConfigMapsDetailsPage';

type ConfigMapsListProps = {
  data: ConfigMapKind[];
  loaded: boolean;
};

type ConfigMapsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
