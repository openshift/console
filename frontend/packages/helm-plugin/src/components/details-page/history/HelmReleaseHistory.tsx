import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { HelmRelease } from '../../../types/helm-types';
import { fetchHelmReleaseHistory } from '../../../utils/helm-utils';
import HelmReleaseHistoryTable from './HelmReleaseHistoryTable';
import {
  useHelmReleaseHistoryColumns,
  getHelmReleaseHistoryRows,
  getHistoryColumnIndexById,
} from './HelmReleaseHistoryTableHelpers';

interface HelmReleaseHistoryProps {
  obj: K8sResourceKind;
  customData: HelmRelease;
}

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

  const totalRevisions = revisions?.length || 0;
  const latestHelmReleaseVersion = latestHelmRelease?.version || 0;

  const customRowRenderer = React.useCallback(
    (releaseHistory: HelmRelease[]) =>
      getHelmReleaseHistoryRows(releaseHistory, totalRevisions, latestHelmReleaseVersion),
    [totalRevisions, latestHelmReleaseVersion],
  );

  const customSortFunctions = React.useMemo(
    () => ({
      0: (r: HelmRelease) => r.version, // Revision
      1: (r: HelmRelease) => new Date(r.info.last_deployed).getTime(), // Updated
      2: (r: HelmRelease) => r.info.status, // Status
      3: (r: HelmRelease) => r.chart.metadata.name, // Chart name
      4: (r: HelmRelease) => r.chart.metadata.version, // Chart version
      5: (r: HelmRelease) => r.chart.metadata.appVersion || '', // App version
    }),
    [],
  );

  if (loadError) {
    return <StatusBox loaded loadError={loadError} label={t('helm-plugin~Helm Release history')} />;
  }

  return (
    <PaneBody>
      <HelmReleaseHistoryTable
        releaseHistory={revisions}
        isLoading={!revisionsLoaded}
        customColumns={useHelmReleaseHistoryColumns}
        customRowRenderer={customRowRenderer}
        customGetColumnIndexById={getHistoryColumnIndexById}
        customSortFunctions={customSortFunctions}
      />
    </PaneBody>
  );
};

export default HelmReleaseHistory;
