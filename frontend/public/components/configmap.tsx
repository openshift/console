import * as _ from 'lodash';
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { ConfigMapData, ConfigMapBinaryData } from './configmap-and-secret-data';
import { DASH } from '@console/shared/src/constants/ui';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ConfigMapModel } from '../models/index';
import { Grid, GridItem } from '@patternfly/react-core';
import { ConfigMapKind, referenceForModel, TableColumn } from '../module/k8s';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { LoadingBox } from '@console/shared/src/components/loading';
import { sortResourceByValue } from './factory/Table/sort';
import { sorts } from './factory/table';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

const kind = referenceForModel(ConfigMapModel);
const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'size' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<ConfigMapKind> = (data, columns) => {
  return data.map(({ obj: configMap }) => {
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
        cell: _.size(configMap.data) + _.size(configMap.binaryData),
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={configMap.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <LazyActionMenu context={{ [kind]: configMap }} />,
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
};

const useConfigMapsColumns = (): TableColumn<ConfigMapKind>[] => {
  const { t } = useTranslation();
  return useMemo(
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

export const ConfigMaps: React.FCC<ConfigMapsProps> = ({ data, loaded, ...props }) => {
  const columns = useConfigMapsColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<ConfigMapKind>
        {...props}
        label={ConfigMapModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
  );
};

export const ConfigMapsPage: React.FCC<ConfigMapsPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/configmaps/~new/form`,
  };
  return (
    <ListPage
      {...props}
      kind={kind}
      ListComponent={ConfigMaps}
      canCreate={true}
      createProps={createProps}
      omitFilterToolbar={true}
    />
  );
};

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
      pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]}
    />
  );
};

type ConfigMapsProps = {
  data: ConfigMapKind[];
  loaded: boolean;
};

type ConfigMapsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
