import { useMemo, Suspense } from 'react';
import * as _ from 'lodash-es';
import { TFunction } from 'i18next';
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
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { TableColumn } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useTranslation } from 'react-i18next';
import { StorageClassModel } from '@console/internal/models';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { DASH } from '@console/shared/src/constants/ui';
import { DetailsPage, DetailsPageProps } from './factory/details';
import { ListPage } from './factory/list-page';
import { DetailsItem } from './utils/details-item';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary, detailsPage } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import {
  StorageClassResourceKind,
  K8sResourceKind,
  referenceFor,
  referenceForModel,
} from '../module/k8s';

const { kind } = StorageClassModel;

export const defaultClassAnnotation = 'storageclass.kubernetes.io/is-default-class';
const betaDefaultStorageClassAnnotation = 'storageclass.beta.kubernetes.io/is-default-class';
const defaultVirtClassAnnotation = 'storageclass.kubevirt.io/is-default-virt-class';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'provisioner' },
  { id: 'reclaimPolicy' },
  { id: '' },
];

export const isDefaultClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return (
    annotations[defaultClassAnnotation] === 'true' ||
    annotations[betaDefaultStorageClassAnnotation] === 'true'
  );
};

const isDefaultVirtClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return annotations[defaultVirtClassAnnotation] === 'true';
};

// TODO remove this code, the plugin should use an appropriate extension
const isKubevirtPluginActive =
  Array.isArray(window.SERVER_FLAGS.consolePlugins) &&
  window.SERVER_FLAGS.consolePlugins.includes('kubevirt-plugin');

const getDataViewRowsCreator: (t: TFunction) => GetDataViewRows<StorageClassResourceKind> = (t) => (
  data,
  columns,
) => {
  return data.map(({ obj }) => {
    const name = obj.metadata?.name || '';
    const context = { [referenceFor(obj)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink kind={kind} name={name}>
            {isDefaultClass(obj) && (
              <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-resource-item__help-text">
                &ndash; {t('public~Default')}
              </span>
            )}
            {isDefaultVirtClass(obj) && isKubevirtPluginActive && (
              <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-resource-item__help-text">
                &ndash; {t('public~Default for VirtualMachines')}
              </span>
            )}
          </ResourceLink>
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: obj.provisioner,
      },
      [tableColumnInfo[2].id]: {
        cell: obj.reclaimPolicy || DASH,
      },
      [tableColumnInfo[3].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

const useStorageClassColumns = (): TableColumn<StorageClassResourceKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<StorageClassResourceKind>[] = useMemo(
    () => [
      {
        title: t('public~Name'),
        sort: 'metadata.name',
        id: tableColumnInfo[0].id,
        props: { ...cellIsStickyProps, modifier: 'nowrap' },
      },
      {
        title: t('public~Provisioner'),
        sort: 'provisioner',
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Reclaim policy'),
        sort: 'reclaimPolicy',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: { ...cellIsStickyProps },
      },
    ],
    [t],
  );

  return columns;
};

export const StorageClassList: Snail.FCC<StorageClassListProps> = ({ data, loaded, ...props }) => {
  const { t } = useTranslation();
  const columns = useStorageClassColumns();
  const getDataViewRows = useMemo(() => getDataViewRowsCreator(t), [t]);

  return (
    (<Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<StorageClassResourceKind>
        {...props}
        label={StorageClassModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
      />
    </Suspense>)
  );
};

const StorageClassDetails: Snail.FCC<StorageClassDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();

  return (
    <PaneBody>
      <SectionHeading text={t('public~StorageClass details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={obj}>
            <DetailsItem label={t('public~Provisioner')} obj={obj} path="provisioner" />
          </ResourceSummary>
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DetailsItem label={t('public~Reclaim policy')} obj={obj} path="reclaimPolicy" />
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Default class')}</DescriptionListTerm>
              <DescriptionListDescription>
                {isDefaultClass(obj) ? t('public~True') : t('public~False')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DetailsItem
              label={t('public~Volume binding mode')}
              obj={obj}
              path="volumeBindingMode"
            />
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const StorageClassPage: Snail.FCC = ({ ...props }) => {
  const { t } = useTranslation();

  const createProps = {
    to: '/k8s/cluster/storageclasses/~new/form',
  };

  return (
    <ListPage
      {...props}
      title={t('public~StorageClasses')}
      kind={kind}
      ListComponent={StorageClassList}
      canCreate={true}
      omitFilterToolbar={true}
      createProps={createProps}
      createButtonText={t('public~Create StorageClass')}
    />
  );
};

export const StorageClassDetailsPage: Snail.FCC<DetailsPageProps> = (props) => {
  const pages = [navFactory.details(detailsPage(StorageClassDetails)), navFactory.editYaml()];

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

  return <DetailsPage {...props} kind={kind} customActionMenu={customActionMenu} pages={pages} />;
};

type StorageClassListProps = {
  data: StorageClassResourceKind[];
  loaded: boolean;
  loadError: unknown;
};

type StorageClassDetailsProps = {
  obj: StorageClassResourceKind;
};
