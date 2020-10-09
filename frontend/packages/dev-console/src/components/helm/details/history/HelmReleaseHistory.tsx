import * as React from 'react';
import { match as RMatch } from 'react-router';
import { useTranslation } from 'react-i18next';
import { sortable, SortByDirection } from '@patternfly/react-table';
import { useDeepCompareMemoize } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { coFetchJSON } from '@console/internal/co-fetch';
import { StatusBox } from '@console/internal/components/utils';
import CustomResourceList from '../../../custom-resource-list/CustomResourceList';
import HelmReleaseHistoryRow from './HelmReleaseHistoryRow';
import { tableColumnClasses } from './HelmReleaseHistoryHeader';

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
  const { t } = useTranslation();

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
          setLoadError(err.message || t('devconsole~Unable to load Helm Release history'));
        }
      });
    return () => {
      destroyed = true;
    };
  }, [helmReleaseName, namespace, memoizedObj, t]);

  if (loadError) {
    return <StatusBox loaded loadError={loadError} label={t('devconsole~Helm Release history')} />;
  }

  const HelmReleaseHistoryHeader = () => {
    return [
      {
        title: t('devconsole~Revision'),
        sortField: 'version',
        transforms: [sortable],
        props: { className: tableColumnClasses.revision },
      },
      {
        title: t('devconsole~Updated'),
        sortField: 'info.last_deployed',
        transforms: [sortable],
        props: { className: tableColumnClasses.updated },
      },
      {
        title: t('devconsole~Status'),
        sortField: 'info.status',
        transforms: [sortable],
        props: { className: tableColumnClasses.status },
      },
      {
        title: t('devconsole~Chart Name'),
        sortField: 'chart.metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses.chartName },
      },
      {
        title: t('devconsole~Chart Version'),
        sortField: 'chart.metadata.version',
        transforms: [sortable],
        props: { className: tableColumnClasses.chartVersion },
      },
      {
        title: t('devconsole~App Version'),
        sortField: 'chart.metadata.appVersion',
        transforms: [sortable],
        props: { className: tableColumnClasses.appVersion },
      },
      {
        title: t('devconsole~Description'),
        props: { className: tableColumnClasses.description },
      },
      {
        title: '',
        props: { className: tableColumnClasses.kebab },
      },
    ];
  };

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
