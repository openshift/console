import * as React from 'react';
import { match as RMatch } from 'react-router';
import { SortByDirection } from '@patternfly/react-table';
import { useDeepCompareMemoize } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { coFetchJSON } from '@console/internal/co-fetch';
import { StatusBox } from '@console/internal/components/utils';
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
  const [revisionsLoaded, setRevisionsLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>();
  const [revisions, setRevisions] = React.useState([]);
  const memoizedObj = useDeepCompareMemoize(obj);

  React.useEffect(() => {
    let destroyed = false;
    coFetchJSON(`/api/helm/release/history?ns=${namespace}&name=${helmReleaseName}`)
      .then((items) => {
        if (!destroyed) {
          setLoadError(null);
          setRevisionsLoaded(true);
          setRevisions(items);
        }
      })
      .catch((err) => {
        if (!destroyed) {
          setRevisionsLoaded(true);
          setLoadError(err.message || 'Unable to load Helm Release history');
        }
      });
    return () => {
      destroyed = true;
    };
  }, [helmReleaseName, namespace, memoizedObj]);

  if (loadError) {
    return <StatusBox loaded loadError={loadError} label="Helm Release history" />;
  }

  return (
    <CustomResourceList
      resources={revisions}
      loaded={revisionsLoaded}
      sortBy="version"
      sortOrder={SortByDirection.desc}
      resourceRow={HelmReleaseHistoryRow}
      resourceHeader={HelmReleaseHistoryHeader}
    />
  );
};

export default HelmReleaseHistory;
