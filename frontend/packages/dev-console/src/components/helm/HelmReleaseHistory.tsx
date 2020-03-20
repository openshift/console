import * as React from 'react';
import CustomResourceList from '../custom-resource-list/CustomResourceList';
import { getHelmReleaseRevisions, helmRowFilters, getFilteredItems } from './helm-utils';
import HelmReleaseRow from './HelmReleaseRow';
import HelmReleaseHeader from './HelmReleaseHeader';

interface HelmReleaseHistoryProps {
  helmReleaseName: string;
  namespace: string;
}

const HelmReleaseHistory: React.FC<HelmReleaseHistoryProps> = ({ helmReleaseName, namespace }) => (
  <CustomResourceList
    items={getHelmReleaseRevisions(namespace, helmReleaseName)}
    queryArg="rowFilter-helm-release-status"
    rowFilters={helmRowFilters}
    getFilteredItems={getFilteredItems}
    resourceRow={HelmReleaseRow}
    resourceHeader={HelmReleaseHeader}
  />
);

export default HelmReleaseHistory;
