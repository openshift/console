import * as React from 'react';
import { sortable, SortByDirection } from '@patternfly/react-table';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableProps,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { BuildRun } from '../../types';
import BuildRunDuration, {
  getBuildRunDurationInSeconds,
} from '../buildrun-duration/BuildRunDuration';
import BuildRunStatus, { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';

const columnClassNames = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-md', // status
  'pf-m-hidden pf-m-visible-on-lg', // age
  'pf-m-hidden pf-m-visible-on-xl', // duration
  Kebab.columnClass,
];

export const BuildRunHeader = () => {
  // This function is NOT called as component, so we can not use useTranslation here.
  const t = i18next.t.bind(i18next);

  return [
    {
      title: t('shipwright-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: columnClassNames[0] },
    },
    {
      id: 'namespace',
      title: t('shipwright-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: columnClassNames[1] },
    },
    {
      title: t('shipwright-plugin~Status'),
      sortFunc: 'status',
      transforms: [sortable],
      props: { className: columnClassNames[2] },
    },
    {
      title: t('shipwright-plugin~Started'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: columnClassNames[3] },
    },
    {
      title: t('shipwright-plugin~Duration'),
      sortFunc: 'duration',
      transforms: [sortable],
      props: { className: columnClassNames[4] },
    },
    {
      title: '',
      props: { className: columnClassNames[5] },
    },
  ];
};

export const BuildRunRow: React.FC<RowFunctionArgs<BuildRun>> = ({ obj: buildRun }) => {
  const kindReference = referenceFor(buildRun);
  const context = { [kindReference]: buildRun };

  return (
    <>
      <TableData className={columnClassNames[0]}>
        <ResourceLink
          kind={kindReference}
          name={buildRun.metadata.name}
          namespace={buildRun.metadata.namespace}
        />
      </TableData>
      <TableData className={columnClassNames[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={buildRun.metadata.namespace} />
      </TableData>
      <TableData className={columnClassNames[2]}>
        <BuildRunStatus buildRun={buildRun} />
      </TableData>
      <TableData className={columnClassNames[3]}>
        <Timestamp timestamp={buildRun.metadata?.creationTimestamp} />
      </TableData>
      <TableData className={columnClassNames[4]}>
        <BuildRunDuration buildRun={buildRun} />
      </TableData>
      <TableData className={columnClassNames[5]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export const BuildRunTable: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();

  return (
    <Table
      {...props}
      aria-label={t('shipwright-plugin~BuildRuns')}
      Header={BuildRunHeader}
      Row={BuildRunRow}
      customSorts={{
        status: getBuildRunStatus,
        duration: getBuildRunDurationInSeconds,
      }}
      defaultSortField="metadata.creationTimestamp"
      defaultSortOrder={SortByDirection.desc}
      virtualize
    />
  );
};

export default BuildRunTable;
