import * as React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { Link } from 'react-router-dom';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { isCatalogTypeEnabled, CustomResourceList } from '@console/shared';
import { HELM_CHART_CATALOG_TYPE_ID } from '../../const';
import {
  helmReleasesRowFilters,
  filterHelmReleasesByName,
  filterHelmReleasesByStatus,
  fetchHelmReleases,
} from '../../utils/helm-utils';
import HelmReleaseListHeader from './HelmReleaseListHeader';
import HelmReleaseListRow from './HelmReleaseListRow';
import './HelmReleaseList.scss';

const getRowProps = (obj) => ({
  id: obj.name,
});

interface HelmReleaseListProps {
  match: match<{ ns?: string }>;
}

const HelmReleaseList: React.FC<HelmReleaseListProps> = (props) => {
  const { t } = useTranslation();
  const namespace = props.match.params.ns;
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
      selector: {
        matchLabels: { owner: 'helm' },
        matchExpressions: [{ key: 'status', operator: 'NotEquals', values: ['superseded'] }],
      },
      partialMetadata: true,
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
              setLoadError(err.message || t('helm-plugin~Unable to load Helm Releases'));
            }
          });
      }
      secretsCountRef.current = newCount;
    }
    return () => {
      destroyed = true;
    };
  }, [namespace, newCount, secretsLoadError, secretsLoaded, t]);

  if (secretsLoadError || loadError) {
    return (
      <StatusBox
        loaded
        loadError={secretsLoadError || loadError}
        label={t('helm-plugin~Helm Releases')}
      />
    );
  }

  const emptyState = () => {
    const isHelmEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    const helmImage = () => (
      <img
        className="odc-helm-release__empty-list__image"
        src={getImageForIconClass('icon-helm')}
        alt=""
      />
    );
    const installURL = { pathname: `/catalog/ns/${namespace}`, search: '?catalogType=HelmChart' };
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon variant="container" component={helmImage} />
        <Title headingLevel="h3" size="lg">
          {t('helm-plugin~No Helm Releases found')}
        </Title>
        {isHelmEnabled ? (
          <EmptyStateSecondaryActions>
            <Link to={installURL}>
              {t('helm-plugin~Browse the catalog to discover and install Helm Charts')}
            </Link>
          </EmptyStateSecondaryActions>
        ) : null}
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
      rowFilters={helmReleasesRowFilters(t)}
      sortBy="name"
      sortOrder={SortByDirection.asc}
      rowFilterReducer={filterHelmReleasesByStatus}
      textFilterReducer={filterHelmReleasesByName}
      ResourceRow={HelmReleaseListRow}
      resourceHeader={HelmReleaseListHeader(t)}
      getRowProps={getRowProps}
    />
  );
};

export default HelmReleaseList;
