import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage } from './factory';
import { SectionHeading, navFactory, ResourceLink, ResourceSummary, LoadingBox } from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Grid, GridItem } from '@patternfly/react-core';
import {
  ConsoleDataView,
  initialFiltersDefault,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { DASH, LazyActionMenu } from '@console/shared/src';
import { referenceForModel } from '../module/k8s';
import { ServiceAccountModel } from '../models';

const kind = 'ServiceAccount';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'secrets' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows = (data, columns) => {
  return data.map(({ obj }) => {
    const {
      metadata: { name, namespace, uid, creationTimestamp },
      secrets,
    } = obj;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} title={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: secrets ? secrets.length : 0,
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <LazyActionMenu context={{ [referenceForModel(ServiceAccountModel)]: obj }} />,
        props: {
          ...actionsCellProps,
        },
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

const Details = ({ obj: serviceaccount }) => {
  const { t } = useTranslation();

  return (
    <PaneBody>
      <SectionHeading text={t('public~ServiceAccount details')} />
      <Grid hasGutter>
        <GridItem md={6}>
          <ResourceSummary resource={serviceaccount} />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const ServiceAccountsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(ServiceAccountModel)}
    customActionMenu={(obj) => (
      <LazyActionMenu context={{ [referenceForModel(ServiceAccountModel)]: obj }} {...props} />
    )}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);

const useServiceAccountColumns = () => {
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
        title: t('public~Secrets'),
        id: tableColumnInfo[2].id,
        sort: 'secrets.length',
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

const ServiceAccountsList = (props) => {
  const { data, loaded } = props;
  const { t } = useTranslation();
  const columns = useServiceAccountColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        data={data || []}
        loaded={loaded}
        label={t('public~ServiceAccounts')}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
  );
};
const ServiceAccountsPage = (props) => (
  <ListPage
    ListComponent={ServiceAccountsList}
    {...props}
    canCreate={true}
    omitFilterToolbar={true}
  />
);
export { ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage };
