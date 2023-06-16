import * as React from 'react';
import { sortable, SortByDirection } from '@patternfly/react-table';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import {
  Table,
  TableProps,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { BUILDRUN_TO_BUILD_REFERENCE_LABEL } from '../../const';
import { BuildRunModel } from '../../models';
import { Build, BuildRun } from '../../types';
import { isBuildRunNewerThen } from '../../utils';
import BuildRunDuration from '../buildrun-duration/BuildRunDuration';
import BuildRunStatus from '../buildrun-status/BuildRunStatus';

const columnClassNames = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-lg', // last run
  'pf-m-hidden pf-m-visible-on-lg', // last run status
  'pf-m-hidden pf-m-visible-on-lg', // last run time
  'pf-m-hidden pf-m-visible-on-lg', // last run duration
  Kebab.columnClass,
];

export const BuildHeader = () => {
  // This function is NOT called as component, so we can not use useTranslation here.
  const t = i18next.t.bind(i18next);

  return [
    {
      title: i18next.t('shipwright-plugin~Name'),
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
      title: t('shipwright-plugin~Last run'),
      props: { className: columnClassNames[2] },
    },
    {
      title: t('shipwright-plugin~Last run status'),
      props: { className: columnClassNames[3] },
    },
    {
      title: t('shipwright-plugin~Last run time'),
      props: { className: columnClassNames[4] },
    },
    {
      title: t('shipwright-plugin~Last run duration'),
      props: { className: columnClassNames[5] },
    },
    {
      title: '',
      props: { className: columnClassNames[6] },
    },
  ];
};

export const BuildRow: React.FC<RowFunctionArgs<Build, CustomData>> = ({
  obj: build,
  customData,
}) => {
  const kindReference = referenceFor(build);
  const context = { [kindReference]: build };
  const buildRunKindReference = referenceForModel(BuildRunModel);
  const latestBuildRun =
    customData.buildRuns.latestByBuildName[`${build.metadata.name}-${build.metadata.namespace}`];

  return (
    <>
      <TableData className={columnClassNames[0]}>
        <ResourceLink
          kind={kindReference}
          name={build.metadata.name}
          namespace={build.metadata.namespace}
        />
      </TableData>
      <TableData className={columnClassNames[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={build.metadata.namespace} />
      </TableData>
      <TableData className={columnClassNames[2]}>
        {latestBuildRun ? (
          <ResourceLink
            kind={buildRunKindReference}
            name={latestBuildRun.metadata?.name}
            namespace={latestBuildRun.metadata?.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={columnClassNames[3]}>
        {latestBuildRun ? <BuildRunStatus buildRun={latestBuildRun} /> : '-'}
      </TableData>
      <TableData className={columnClassNames[4]}>
        {latestBuildRun ? (
          <Timestamp timestamp={latestBuildRun.metadata?.creationTimestamp} />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={columnClassNames[5]}>
        {latestBuildRun ? <BuildRunDuration buildRun={latestBuildRun} /> : '-'}
      </TableData>
      <TableData className={columnClassNames[6]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

type CustomData = {
  buildRuns: {
    latestByBuildName: Record<string, BuildRun>;
    loaded: boolean;
    error: Error | undefined;
  };
};

type BuildTableProps = TableProps & {
  namespace: string;
};

export const BuildTable: React.FC<BuildTableProps> = (props) => {
  const { t } = useTranslation();
  const buildRunModel = referenceForModel(BuildRunModel);
  const [buildRuns, buildRunsLoaded, buildRunsLoadError] = useK8sWatchResource<BuildRun[]>({
    kind: buildRunModel,
    namespace: props.namespace,
    isList: true,
  });

  const customData = React.useMemo<CustomData>(
    () => ({
      buildRuns: {
        latestByBuildName: buildRuns.reduce<Record<string, BuildRun>>((acc, buildRun) => {
          const name = buildRun.metadata.labels?.[BUILDRUN_TO_BUILD_REFERENCE_LABEL];
          if (
            !acc[`${name}-${buildRun.metadata.namespace}`] ||
            isBuildRunNewerThen(buildRun, acc[`${name}-${buildRun.metadata.namespace}`])
          ) {
            acc[`${name}-${buildRun.metadata.namespace}`] = buildRun;
          }
          return acc;
        }, {}),
        loaded: buildRunsLoaded,
        error: buildRunsLoadError,
      },
    }),
    [buildRuns, buildRunsLoaded, buildRunsLoadError],
  );

  return (
    <Table
      {...props}
      aria-label={t('shipwright-plugin~Builds')}
      Header={BuildHeader}
      Row={BuildRow}
      defaultSortField="metadata.name"
      defaultSortOrder={SortByDirection.asc}
      customData={customData}
      virtualize
    />
  );
};

export default BuildTable;
