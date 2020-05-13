import * as React from 'react';
import { FirehoseResult } from '@console/internal/components/utils';
import { useDeepCompareMemoize } from '@console/shared';
import { SortByDirection } from '@patternfly/react-table';
import CustomResourceList from '../../custom-resource-list/CustomResourceList';
import {
  helmReleasesRowFilters,
  filterHelmReleasesByName,
  filterHelmReleasesByStatus,
  fetchHelmReleases,
} from '../helm-utils';
import HelmReleaseListRow from './HelmReleaseListRow';
import HelmReleaseListHeader from './HelmReleaseListHeader';
import { HelmRelease } from '../helm-types';

interface HelmReleaseListProps {
  namespace: string;
  secrets?: FirehoseResult;
}

const HelmReleaseList: React.FC<HelmReleaseListProps> = ({ namespace, secrets }) => {
  const memoizedSecrets = useDeepCompareMemoize(secrets?.data);

  const getHelmReleases = (): Promise<HelmRelease[]> => {
    return fetchHelmReleases(namespace);
  };

  return (
    <CustomResourceList
      fetchCustomResources={getHelmReleases}
      dependentResource={memoizedSecrets}
      queryArg="rowFilter-helm-release-status"
      textFilter="name"
      rowFilters={helmReleasesRowFilters}
      sortBy="name"
      sortOrder={SortByDirection.asc}
      rowFilterReducer={filterHelmReleasesByStatus}
      textFilterReducer={filterHelmReleasesByName}
      resourceRow={HelmReleaseListRow}
      resourceHeader={HelmReleaseListHeader}
    />
  );
};

export default HelmReleaseList;
