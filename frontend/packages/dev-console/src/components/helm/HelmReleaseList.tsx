import * as React from 'react';
import { FirehoseResult } from '@console/internal/components/utils';
import { useDeepCompareMemoize } from '@console/shared';
import { coFetchJSON } from '@console/internal/co-fetch';
import { SortByDirection } from '@patternfly/react-table';
import CustomResourceList from '../custom-resource-list/CustomResourceList';
import { helmRowFilters, getFilteredItemsByRow, getFilteredItemsByText } from './helm-utils';
import HelmReleaseRow from './HelmReleaseRow';
import HelmReleaseHeader from './HelmReleaseHeader';
import { HelmRelease } from './helm-types';

interface HelmReleaseListProps {
  namespace: string;
  secrets?: FirehoseResult;
}

const HelmReleaseList: React.FC<HelmReleaseListProps> = ({ namespace, secrets }) => {
  const memoizedSecrets = useDeepCompareMemoize(secrets?.data);

  const getHelmReleases = (): Promise<HelmRelease[]> => {
    return coFetchJSON(`/api/helm/releases?ns=${namespace}`);
  };

  return (
    <CustomResourceList
      fetchCustomResources={getHelmReleases}
      dependentResource={memoizedSecrets}
      queryArg="rowFilter-helm-release-status"
      rowFilters={helmRowFilters}
      sortBy="name"
      sortOrder={SortByDirection.asc}
      rowFilterReducer={getFilteredItemsByRow}
      textFilterReducer={getFilteredItemsByText}
      resourceRow={HelmReleaseRow}
      resourceHeader={HelmReleaseHeader}
    />
  );
};

export default HelmReleaseList;
