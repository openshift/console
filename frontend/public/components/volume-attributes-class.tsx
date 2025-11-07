import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LazyActionMenu } from '@console/shared/src/components/actions';
import { DetailsPage, ListPage } from './factory';
import {
  DetailsItem,
  LoadingBox,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  detailsPage,
  navFactory,
} from './utils';
import {
  VolumeAttributesClassKind,
  TableColumn,
  K8sGroupVersionKind,
  referenceFor,
} from '../module/k8s';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { VolumeAttributesClassModel } from '../models';
import { DASH } from '@console/shared';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';

const [group, version] = VolumeAttributesClassModel.apiVersion.split('/');

export const VolumeAttributesClassGVK: K8sGroupVersionKind = {
  group,
  version,
  kind: VolumeAttributesClassModel.kind,
};

const tableColumnInfo = [{ id: 'name' }, { id: 'driverName' }, { id: 'parameters' }, { id: '' }];

const useVolumeAttributesClassColumns = () => {
  const { t } = useTranslation();
  const columns: TableColumn<VolumeAttributesClassKind>[] = React.useMemo(() => {
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
        title: t('public~Driver name'),
        id: tableColumnInfo[1].id,
        sort: 'driverName',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Parameters'),
        id: tableColumnInfo[2].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: {
          ...actionsCellProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getDataViewRows: GetDataViewRows<VolumeAttributesClassKind, undefined> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name } = obj.metadata;
    const parameterCount = Object.keys(obj?.parameters || {}).length;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <span className="co-resource-item">
            <ResourceLink groupVersionKind={VolumeAttributesClassGVK} name={name} />
          </span>
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: obj.driverName || DASH,
      },
      [tableColumnInfo[2].id]: {
        cell: parameterCount || DASH,
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <LazyActionMenu
            context={{
              [referenceFor(obj)]: obj,
            }}
          />
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

export const VolumeAttributesClassList: React.FCC<VolumeAttributesClassListProps> = ({
  data,
  loaded,
  loadError,
  ...restProps
}) => {
  const columns = useVolumeAttributesClassColumns();
  const isLoaded = loaded !== undefined ? loaded : true;

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...restProps}
        label={VolumeAttributesClassModel.labelPlural}
        data={data}
        loaded={isLoaded}
        loadError={loadError}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const VolumeAttributesClassPage: React.FCC<VolumeAttributesClassPageProps> = ({
  ...restProps
}) => {
  return (
    <ListPage
      {...restProps}
      ListComponent={VolumeAttributesClassList}
      kind={VolumeAttributesClassModel.kind}
      canCreate={true}
      omitFilterToolbar={true}
    />
  );
};

const VolumeAttributesClassDetails: React.FCC<VolumeAttributesClassDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();

  const parameters = obj?.parameters || {};

  return (
    <PaneBody>
      <SectionHeading text={t('public~VolumeAttributesClass details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={obj}>
            <DetailsItem label={t('public~Driver name')} obj={obj} path="driverName" />
          </ResourceSummary>
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DetailsItem label={t('public~Parameters')} obj={obj} path="parameters">
              {Object.keys(parameters).length > 0 ? (
                <dl>
                  {Object.entries(parameters).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt className="pf-v6-c-title co-break-word">
                        <strong>{_.capitalize(key)}</strong>: {value}
                      </dt>
                    </React.Fragment>
                  ))}
                </dl>
              ) : (
                t('public~No parameters')
              )}
            </DetailsItem>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const VolumeAttributesClassDetailsPage: React.FCC<VolumeAttributesClassDetailsPageProps> = ({
  ...restProps
}) => {
  const pages = [
    navFactory.details(detailsPage(VolumeAttributesClassDetails)),
    navFactory.editYaml(),
  ];

  return <DetailsPage {...restProps} kind={VolumeAttributesClassModel.kind} pages={pages} />;
};

export type VolumeAttributesClassListProps = {
  data: VolumeAttributesClassKind[];
  loaded: boolean;
  loadError?: Error;
};

export type VolumeAttributesClassPageProps = {};

export type VolumeAttributesClassDetailsPageProps = {
  match?: {
    params?: {
      name?: string;
      ns?: string;
    };
  };
  kind: string;
  name?: string;
};

export type VolumeAttributesClassDetailsProps = {
  obj: VolumeAttributesClassKind;
};
