import { useCallback, useMemo } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { useTranslation } from 'react-i18next';
import type { ResourceFilters } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ComputedBuildRunStatus } from '../types';

/** Matches the `type` of the legacy row filter, which `useConsoleDataViewFilters` rewrites from old URLs. */
const STATUS_FILTER_ID = 'status';

export type BuildRunStatusFilters = ResourceFilters & { [STATUS_FILTER_ID]: string[] };

/**
 * The DataView equivalent of the BuildRun status row filter shared by the Builds and BuildRuns
 * tables. Both filter on a computed BuildRun status; they differ only in the filter's title and
 * in which BuildRun they read it from.
 *
 * @param title - The filter's title, since Builds label it "BuildRun status" to distinguish it
 * from the Build's own status.
 * @param getStatus - Reads the status to match against from a row.
 */
export const useBuildRunStatusFilter = <T,>(title: string, getStatus: (obj: T) => string) => {
  const { t } = useTranslation('shipwright-plugin');

  const initialFilters = useMemo<BuildRunStatusFilters>(() => ({ [STATUS_FILTER_ID]: [] }), []);

  const additionalFilterNodes = useMemo(
    () => [
      <DataViewCheckboxFilter
        key={STATUS_FILTER_ID}
        filterId={STATUS_FILTER_ID}
        title={title}
        placeholder={t('Filter by status')}
        options={[
          { value: ComputedBuildRunStatus.PENDING, label: t('Pending') },
          { value: ComputedBuildRunStatus.RUNNING, label: t('Running') },
          { value: ComputedBuildRunStatus.SUCCEEDED, label: t('Succeeded') },
          { value: ComputedBuildRunStatus.FAILED, label: t('Failed') },
          { value: ComputedBuildRunStatus.UNKNOWN, label: t('Unknown') },
        ]}
      />,
    ],
    [t, title],
  );

  const matchesAdditionalFilters = useCallback(
    (obj: T, filters: BuildRunStatusFilters) =>
      filters[STATUS_FILTER_ID].length === 0 || filters[STATUS_FILTER_ID].includes(getStatus(obj)),
    [getStatus],
  );

  return { initialFilters, additionalFilterNodes, matchesAdditionalFilters };
};
