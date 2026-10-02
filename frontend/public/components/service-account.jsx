import { useMemo, Suspense } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { ServiceAccountModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { LoadingBox } from './utils/status-box';

const kind = 'ServiceAccount';
const serviceAccountReference = referenceForModel(ServiceAccountModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'secrets' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows = (data, columns) =>
  data.map(({ obj }) => {
    const {
      metadata: { name, namespace, uid, creationTimestamp },
      secrets,
    } = obj;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />,
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
        cell: <LazyActionMenu context={{ [serviceAccountReference]: obj }} />,
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

const Details = ({ obj: serviceaccount }) => {
  const { t } = useTranslation('public');

  return (
    <PaneBody>
      <SectionHeading text={t('ServiceAccount details')} />
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
    kind={serviceAccountReference}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);

const useServiceAccountColumns = () => {
  const { t } = useTranslation('public');

  const columns = useMemo(
    () => [
      {
        type: 'name',
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Secrets'),
        id: tableColumnInfo[2].id,
        sort: 'secrets.length',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      { type: 'actions', id: tableColumnInfo[4].id },
    ],
    [t],
  );

  return { columns };
};

const ServiceAccountsList = (props) => {
  const { data, loaded } = props;
  const { t } = useTranslation('public');
  const { columns } = useServiceAccountColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        id={ServiceAccountModel}
        data={data || []}
        loaded={loaded}
        label={t('ServiceAccounts')}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};
const ServiceAccountsPage = (props) => (
  <ListPage ListComponent={ServiceAccountsList} {...props} canCreate omitFilterToolbar />
);
export { ServiceAccountsPage, ServiceAccountsDetailsPage };
