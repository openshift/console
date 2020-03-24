import * as React from 'react';
import { match as RMatch } from 'react-router';
import { coFetchJSON } from '@console/internal/co-fetch';
import { SortByDirection } from '@patternfly/react-table';
import CustomResourceList from '../custom-resource-list/CustomResourceList';
import { helmRowFilters, getFilteredItemsByRow, getFilteredItemsByText } from './helm-utils';
import HelmReleaseHistoryRow from './HelmReleaseHistoryRow';
import HelmReleaseHistoryHeader from './HelmReleaseHistoryHeader';
import { HelmRelease } from './helm-types';

interface HelmReleaseHistoryProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const HelmReleaseHistory: React.FC<HelmReleaseHistoryProps> = ({ match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;

  const getHelmReleaseRevisions = (): Promise<HelmRelease[]> => {
    return coFetchJSON(`/api/helm/release/history?ns=${namespace}&name=${helmReleaseName}`);
  };

  return (
    <CustomResourceList
      fetchCustomResources={getHelmReleaseRevisions}
      queryArg="rowFilter-helm-release-status"
      rowFilters={helmRowFilters}
      sortBy="version"
      sortOrder={SortByDirection.desc}
      rowFilterReducer={getFilteredItemsByRow}
      textFilterReducer={getFilteredItemsByText}
      resourceRow={HelmReleaseHistoryRow}
      resourceHeader={HelmReleaseHistoryHeader}
    />
  );
};

export default HelmReleaseHistory;
