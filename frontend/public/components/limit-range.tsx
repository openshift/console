import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { K8sResourceKindReference, K8sResourceKind, referenceForModel } from '../module/k8s';
import { LimitRangeModel } from '../models';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { navFactory } from './utils/horizontal-nav';
import { SectionHeading } from './utils/headings';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { LoadingBox } from './utils/status-box';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Grid, GridItem } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import {
  ConsoleDataView,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { TableColumn } from '@console/internal/module/k8s';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { DASH } from '@console/shared/src/constants/ui';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

const LimitRangeReference: K8sResourceKindReference = LimitRangeModel.kind;

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace' }, { id: 'created' }, { id: 'actions' }];

const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace, creationTimestamp } = obj.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={LimitRangeReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <LazyActionMenu context={{ [referenceForModel(LimitRangeModel)]: obj }} />,
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

const useLimitRangeColumns = (): TableColumn<K8sResourceKind>[] => {
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
        title: t('public~Created'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.creationTimestamp',
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
    ],
    [t],
  );
};

export const LimitRangeList: FC<{ data: K8sResourceKind[]; loaded: boolean }> = (props) => {
  const { data, loaded } = props;
  const columns = useLimitRangeColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        data={data}
        loaded={loaded}
        label={LimitRangeModel.labelPlural}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
  );
};

export const LimitRangeListPage: FC<LimitRangeListPageProps> = (props) => (
  <ListPage
    {...props}
    kind={LimitRangeReference}
    ListComponent={LimitRangeList}
    canCreate={true}
    omitFilterToolbar={true}
  />
);

export const LimitRangeDetailsRow: React.FCC<LimitRangeDetailsRowProps> = ({
  limitType,
  resource,
  limit,
}) => {
  return (
    <Tr>
      <Td>{limitType}</Td>
      <Td>{resource}</Td>
      <Td>{limit.min || '-'}</Td>
      <Td>{limit.max || '-'}</Td>
      <Td>{limit.defaultRequest || '-'}</Td>
      <Td>{limit.default || '-'}</Td>
      <Td>{limit.maxLimitRequestRatio || '-'}</Td>
    </Tr>
  );
};

const LimitRangeDetailsRows: React.FCC<LimitRangeDetailsRowsProps> = ({ limit }) => {
  const properties = ['max', 'min', 'default', 'defaultRequest', 'maxLimitRequestRatio'];
  const resources = {};
  _.each(properties, (property) => {
    _.each(limit[property], (value, resource) => _.set(resources, [resource, property], value));
  });

  return (
    <>
      {_.map(resources, (resourceLimit, resource) => (
        <LimitRangeDetailsRow
          key={resource}
          limitType={limit.type}
          resource={resource}
          limit={resourceLimit}
        />
      ))}
    </>
  );
};

export const LimitRangeDetailsList = (resource) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('public~Limits')} />
      <Table variant="compact" borders>
        <Thead>
          <Tr>
            <Th>{t('public~Type')}</Th>
            <Th>{t('public~Resource')}</Th>
            <Th>{t('public~Min')}</Th>
            <Th>{t('public~Max')}</Th>
            <Th>{t('public~Default request')}</Th>
            <Th>{t('public~Default limit')}</Th>
            <Th>{t('public~Max limit/request ratio')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {_.map(resource.resource.spec.limits, (limit, index) => (
            <LimitRangeDetailsRows limit={limit} key={index} />
          ))}
        </Tbody>
      </Table>
    </PaneBody>
  );
};

export const LimitRangeDetailsPage = (props) => {
  const { t } = useTranslation();
  const Details = ({ obj: rq }) => (
    <>
      <PaneBody>
        <SectionHeading text={t('public~LimitRange details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={rq} />
          </GridItem>
        </Grid>
      </PaneBody>
      <LimitRangeDetailsList resource={rq} />
    </>
  );
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(LimitRangeModel)}
      pages={[navFactory.details(Details), navFactory.editYaml()]}
    />
  );
};

export type LimitRangeProps = {
  obj: any;
};
export type LimitRangeListPageProps = {
  filterLabel: string;
};
export type LimitRangeDetailsRowsProps = {
  limit: any;
};
export type LimitRangeDetailsRowProps = {
  limitType: string;
  resource: string;
  limit: any;
};
export type LimitRangeHeaderProps = {
  obj: any;
};
