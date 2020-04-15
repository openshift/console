import * as React from 'react';
import { match as RMatch } from 'react-router';
import { coFetchJSON } from '@console/internal/co-fetch';
import { SortByDirection } from '@patternfly/react-table';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';

import { HelmRelease } from '../../helm-types';
import CustomResourceList from '../../../custom-resource-list/CustomResourceList';
import HelmReleaseHistoryRow from './HelmReleaseHistoryRow';
import HelmReleaseHistoryHeader from './HelmReleaseHistoryHeader';

interface HelmReleaseHistoryProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
  obj: K8sResourceKind;
}

const HelmReleaseHistory: React.FC<HelmReleaseHistoryProps> = ({ match, obj }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;

  const memoizedObj = useDeepCompareMemoize(obj);

  const getHelmReleaseRevisions = (): Promise<HelmRelease[]> => {
    return coFetchJSON(`/api/helm/release/history?ns=${namespace}&name=${helmReleaseName}`);
  };

  return (
    <CustomResourceList
      fetchCustomResources={getHelmReleaseRevisions}
      dependentResource={memoizedObj}
      sortBy="version"
      sortOrder={SortByDirection.desc}
      resourceRow={HelmReleaseHistoryRow}
      resourceHeader={HelmReleaseHistoryHeader}
    />
  );
};

export default HelmReleaseHistory;
