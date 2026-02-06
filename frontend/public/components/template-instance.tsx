import type { FC } from 'react';
import { useMemo, useCallback, Suspense } from 'react';
import * as _ from 'lodash';
import { Table as PfTable, Th, Thead, Tr, Tbody, Td } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { sorts } from './factory/table';
import { Conditions } from './conditions';
import {
  getTemplateInstanceStatus,
  referenceFor,
  referenceForModel,
  TemplateInstanceKind,
} from '../module/k8s';
import { EmptyBox, LoadingBox } from './utils/status-box';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
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
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { TemplateInstanceModel } from '../models';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import {
  ResourceFilters,
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
} from '@console/app/src/components/data-view/types';
import { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { RowProps, TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { sortResourceByValue } from './factory/Table/sort';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

const templateInstanceReference = referenceForModel(TemplateInstanceModel);

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace' }, { id: 'status' }, { id: '' }];

const getTemplateInstanceDataViewRows = (
  rowData: RowProps<TemplateInstanceKind, TemplateInstanceRowData>[],
  tableColumns: ConsoleDataViewColumn<TemplateInstanceKind>[],
): ConsoleDataViewRow[] => {
  return rowData.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const status = getTemplateInstanceStatus(obj);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(TemplateInstanceModel)}
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
        cell: <Status status={status} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <LazyActionMenu context={{ [templateInstanceReference]: obj }} />,
        props: actionsCellProps,
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useTemplateInstanceColumns = (): TableColumn<TemplateInstanceKind>[] => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
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
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: tableColumnInfo[2].id,
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<TemplateInstanceKind>(direction, sorts.getTemplateInstanceStatus),
          ),
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

export const TemplateInstanceList: FC<TemplateInstanceListProps> = ({ data, loaded, ...props }) => {
  const { t } = useTranslation();
  const columns = useTemplateInstanceColumns();

  const templateInstanceStatusFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    return [
      {
        value: 'Ready',
        label: t('public~Ready'),
      },
      {
        value: 'Not ready',
        label: t('public~Not ready'),
      },
      {
        value: 'Failed',
        label: t('public~Failed'),
      },
    ];
  }, [t]);

  const initialFilters = useMemo(() => ({ ...initialFiltersDefault, status: [] }), []);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('public~Status')}
        placeholder={t('public~Filter by status')}
        options={templateInstanceStatusFilterOptions}
      />,
    ],
    [t, templateInstanceStatusFilterOptions],
  );

  const matchesAdditionalFilters = useCallback(
    (resource: TemplateInstanceKind, filters: TemplateInstanceFilters) =>
      filters.status.length === 0 || filters.status.includes(getTemplateInstanceStatus(resource)),
    [],
  );

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<TemplateInstanceKind, TemplateInstanceRowData, TemplateInstanceFilters>
        {...props}
        label={TemplateInstanceModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={getTemplateInstanceDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
  );
};

export const TemplateInstancePage: FC<TemplateInstancePageProps> = (props) => {
  const { t } = useTranslation();

  return (
    <ListPage
      {...props}
      title={t('public~TemplateInstances')}
      kind="TemplateInstance"
      ListComponent={TemplateInstanceList}
      canCreate={false}
      omitFilterToolbar={true}
    />
  );
};

const TemplateInstanceDetails: FC<TemplateInstanceDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const status = getTemplateInstanceStatus(obj);
  const secretName = _.get(obj, 'spec.secret.name');
  const requester = _.get(obj, 'spec.requester.username');
  const objects = _.get(obj, 'status.objects', []);
  const conditions = _.get(obj, 'status.conditions', []);
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~TemplateInstance details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status status={status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              {secretName && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Parameters')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ResourceLink
                      kind="Secret"
                      name={secretName}
                      namespace={obj.metadata.namespace}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Requester')}</DescriptionListTerm>
                <DescriptionListDescription>{requester || '-'}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Objects')} />
        {_.isEmpty(objects) ? (
          <EmptyBox label={t('public~Objects')} />
        ) : (
          <PfTable gridBreakPoint="">
            <Thead>
              <Tr>
                <Th>{t('public~Name')}</Th>
                <Th>{t('public~Namespace')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {_.map(objects, ({ ref }, i) => (
                <Tr key={i}>
                  <Td>
                    <ResourceLink
                      kind={referenceFor(ref)}
                      name={ref.name}
                      namespace={ref.namespace}
                    />
                  </Td>
                  <Td>
                    {ref.namespace ? <ResourceLink kind="Namespace" name={ref.namespace} /> : '-'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </PfTable>
        )}
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={conditions} />
      </PaneBody>
    </>
  );
};

export const TemplateInstanceDetailsPage: FC = (props) => (
  <DetailsPage
    {...props}
    kind={templateInstanceReference}
    pages={[navFactory.details(TemplateInstanceDetails), navFactory.editYaml()]}
  />
);

type TemplateInstanceFilters = ResourceFilters & { status: string[] };

type TemplateInstanceRowData = {
  obj: TemplateInstanceKind;
};

type TemplateInstanceListProps = {
  data: TemplateInstanceKind[];
  loaded: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  namespace?: string;
};

type TemplateInstancePageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type TemplateInstanceDetailsProps = {
  obj: TemplateInstanceKind;
};
