import * as React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EmptyStateIcon, EmptyStateVariant } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StatusBox } from '@console/internal/components/utils';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import CustomResourceList from '../../custom-resource-list/CustomResourceList';
import {
  helmReleasesRowFilters,
  filterHelmReleasesByName,
  filterHelmReleasesByStatus,
  fetchHelmReleases,
} from '../helm-utils';
import HelmReleaseListRow from './HelmReleaseListRow';
import HelmReleaseListHeader from './HelmReleaseListHeader';

import './HelmReleaseList.scss';

interface HelmReleaseListProps {
  namespace: string;
}

const HelmReleaseList: React.FC<HelmReleaseListProps> = ({ namespace }) => {
  const secretsCountRef = React.useRef<number>(0);
  const [releasesLoaded, setReleasesLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>();
  const [releases, setReleases] = React.useState([]);
  const secretResource = React.useMemo(
    () => ({
      isList: true,
      namespace,
      kind: SecretModel.kind,
      namespaced: true,
      optional: true,
      selector: { matchLabels: { owner: 'helm' } },
    }),
    [namespace],
  );
  const [secretsData, secretsLoaded, secretsLoadError] = useK8sWatchResource<K8sResourceKind[]>(
    secretResource,
  );
  const newCount = secretsData?.length ?? 0;

  React.useEffect(() => {
    setReleasesLoaded(false);
    secretsCountRef.current = 0;
  }, [namespace]);

  React.useEffect(() => {
    let destroyed = false;
    if (secretsLoaded && !secretsLoadError) {
      if (newCount === 0) {
        setLoadError(null);
        setReleasesLoaded(true);
        setReleases([]);
      } else if (newCount !== secretsCountRef.current) {
        setReleasesLoaded(false);
        fetchHelmReleases(namespace)
          .then((helmReleases) => {
            if (!destroyed) {
              setReleases(helmReleases);
              setReleasesLoaded(true);
              setLoadError(null);
            }
          })
          .catch((err) => {
            if (!destroyed) {
              setReleasesLoaded(true);
              setLoadError(err.message || 'Unable to load Helm Releases');
            }
          });
      }
      secretsCountRef.current = newCount;
    }
    return () => {
      destroyed = true;
    };
  }, [namespace, newCount, secretsLoadError, secretsLoaded]);

  if (secretsLoadError || loadError) {
    return <StatusBox loaded loadError={secretsLoadError || loadError} label="Helm Releases" />;
  }

  const emptyState = () => {
    const helmImage = () => (
      <img
        className="odc-helm-release__empty-list__image"
        src={getImageForIconClass('icon-helm')}
        alt=""
      />
    );
    const installURL = { pathname: `/catalog/ns/${namespace}`, search: '?kind=%5B"HelmChart"%5D' };
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <p className="odc-helm-release__empty-list__title">No Helm Releases found</p>
        <EmptyStateIcon variant="container" component={helmImage} />
        <Link to={installURL}>Install a Helm Chart from the developer catalog</Link>
      </EmptyState>
    );
  };

  return (
    <CustomResourceList
      resources={releases}
      loaded={secretsLoaded && releasesLoaded && newCount === secretsCountRef.current}
      EmptyMsg={emptyState}
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
