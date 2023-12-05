import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CustomResourceList, useDeepCompareMemoize } from '@console/shared';
import { HelmRelease } from '../../../types/helm-types';
import { fetchHelmReleaseHistory } from '../../../utils/helm-utils';
import HelmReleaseHistoryHeader from './HelmReleaseHistoryHeader';
import HelmReleaseHistoryRow from './HelmReleaseHistoryRow';

interface HelmReleaseHistoryProps {
  obj: K8sResourceKind;
  customData: HelmRelease;
}

const getRowProps = (obj) => ({
  id: obj.revision,
});

const HelmReleaseHistory: React.FC<HelmReleaseHistoryProps> = ({
  obj,
  customData: latestHelmRelease,
}) => {
  const params = useParams();
  const namespace = params.ns;
  const helmReleaseName = params.name;
  const [revisionsLoaded, setRevisionsLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>();
  const [revisions, setRevisions] = React.useState([]);
  const memoizedObj = useDeepCompareMemoize(obj);
  const { t } = useTranslation();

  React.useEffect(() => {
    let destroyed = false;
    fetchHelmReleaseHistory(helmReleaseName, namespace)
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
          setLoadError(err.message || t('helm-plugin~Unable to load Helm Release history'));
        }
      });
    return () => {
      destroyed = true;
    };
  }, [helmReleaseName, namespace, memoizedObj, t]);

  const totalRevisions = revisions?.length;
  const latestHelmReleaseVersion = latestHelmRelease?.version;

  const customData = React.useMemo(
    () => ({
      totalRevisions,
      latestHelmReleaseVersion,
    }),
    [latestHelmReleaseVersion, totalRevisions],
  );

  if (loadError) {
    return <StatusBox loaded loadError={loadError} label={t('helm-plugin~Helm Release history')} />;
  }

  return (
    <CustomResourceList
      resources={revisions}
      loaded={revisionsLoaded}
      sortBy="version"
      sortOrder={SortByDirection.desc}
      customData={customData}
      ResourceRow={HelmReleaseHistoryRow}
      resourceHeader={HelmReleaseHistoryHeader(t)}
      getRowProps={getRowProps}
    />
  );
};

export default HelmReleaseHistory;
