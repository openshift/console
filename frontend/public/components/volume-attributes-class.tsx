import * as _ from 'lodash-es';
import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LazyActionMenu } from '@console/shared/src/components/actions';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { DetailsPage, ListPage, ListPageProps } from './factory';
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
  const columns: TableColumn<VolumeAttributesClassKind>[] = useMemo(() => {
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
          ...cellIsStickyProps,
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
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeAttributesClassKind>
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
    </Suspense>
  );
};

export const VolumeAttributesClassPage: React.FCC<ListPageProps> = (props) => {
  return (
    <ListPage
      {...props}
      ListComponent={VolumeAttributesClassList}
      kind={VolumeAttributesClassModel.kind}
      canCreate={true}
      omitFilterToolbar={true}
    />
  );
};

const VolumeAttributesClassDetails: React.FCC<VolumeAttributesClassDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();

  const parameters = obj?.parameters ?? {};

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
                <>
                  {Object.entries(parameters).map(([key, value]) => (
                    <div key={key} className="pf-v6-u-mb-sm co-break-word">
                      <strong>{_.capitalize(key)}:</strong> {value}
                    </div>
                  ))}
                </>
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
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceFor(obj);
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

  const pages = [
    navFactory.details(detailsPage(VolumeAttributesClassDetails)),
    navFactory.editYaml(),
  ];

  return (
    <DetailsPage
      {...restProps}
      kind={VolumeAttributesClassModel.kind}
      pages={pages}
      customActionMenu={customActionMenu}
    />
  );
};

export type VolumeAttributesClassListProps = {
  data: VolumeAttributesClassKind[];
  loaded: boolean;
  loadError?: Error;
};

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
