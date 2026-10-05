import type { FC } from 'react';
import { Suspense, useMemo } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { DASH } from '@console/shared/src/constants/ui';
import { ConfigMapModel } from '../models/index';
import type { ConfigMapKind } from '../module/k8s';
import { referenceForModel } from '../module/k8s';
import { ConfigMapData, ConfigMapBinaryData } from './configmap-and-secret-data';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { sorts } from './factory/table';
import { sortResourceByValue } from './factory/Table/sort';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';

const kind = referenceForModel(ConfigMapModel);
const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'size' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<ConfigMapKind> = (data, columns) =>
  data.map(({ obj: configMap }) => {
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
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        cell,
      };
    });
  });

const useConfigMapsColumns = (): {
  columns: ConsoleDataViewColumn<ConfigMapKind>[];
} => {
  const { t } = useTranslation('public');

  const columns = useMemo<ConsoleDataViewColumn<ConfigMapKind>[]>(
    () => [
      {
        type: 'name' as const,
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
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
        title: t('Size'),
        id: tableColumnInfo[2].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.dataSize)),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      { type: 'actions' as const, id: tableColumnInfo[4].id },
    ],
    [t],
  );

  return { columns };
};

const ConfigMaps: FC<ConfigMapsProps> = ({ data, loaded, ...props }) => {
  const { columns } = useConfigMapsColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<ConfigMapKind>
        {...props}
        id={ConfigMapModel}
        label={ConfigMapModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};

export const ConfigMapsPage: FC<ConfigMapsPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/configmaps/~new/form`,
  };
  return (
    <ListPage
      {...props}
      kind={kind}
      ListComponent={ConfigMaps}
      canCreate
      createProps={createProps}
      omitFilterToolbar
    />
  );
};

export const ConfigMapsDetailsPage: FC = (props) => {
  const { t } = useTranslation('public');
  const ConfigMapDetails = ({ obj: configMap }: { obj: ConfigMapKind }) => (
    <>
      <PaneBody>
        <SectionHeading text={t('ConfigMap details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={configMap} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Data')} />
        <ConfigMapData data={configMap.data} label={t('Data')} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Binary data')} />
        <ConfigMapBinaryData data={configMap.binaryData} />
      </PaneBody>
    </>
  );

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
