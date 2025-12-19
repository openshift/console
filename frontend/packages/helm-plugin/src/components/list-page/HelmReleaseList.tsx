import type { FC } from 'react';
import { useMemo, useRef, useState, useEffect, useCallback, Suspense } from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom-v5-compat';
import {
  ConsoleDataView,
  initialFiltersDefault,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { ResourceFilters } from '@console/app/src/components/data-view/types';
import { LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { K8sResourceKind, TableColumn } from '@console/internal/module/k8s';
import { isCatalogTypeEnabled } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { HELM_CHART_CATALOG_TYPE_ID } from '../../const';
import { HelmRelease } from '../../types/helm-types';
import {
  fetchHelmReleases,
  HelmReleaseStatusLabels,
  releaseStatusReducer,
  SelectedReleaseStatuses,
} from '../../utils/helm-utils';
import { HelmCatalogIcon } from '../../utils/icons';
import { getDataViewRows, tableColumnInfo } from './HelmReleaseListRow';

type HelmReleaseFilters = ResourceFilters & { status: string[] };

export const useHelmReleasesColumns = (): TableColumn<HelmRelease>[] => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        title: t('helm-plugin~Name'),
        id: tableColumnInfo[0].id,
        sort: 'name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Revision'),
        id: tableColumnInfo[2].id,
        sort: 'version',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Updated'),
        id: tableColumnInfo[3].id,
        sort: 'info.last_deployed',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Status'),
        id: tableColumnInfo[4].id,
        sort: 'info.status',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Chart name'),
        id: tableColumnInfo[5].id,
        sort: 'chart.metadata.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~Chart version'),
        id: tableColumnInfo[6].id,
        sort: 'chart.metadata.version',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('helm-plugin~App version'),
        id: tableColumnInfo[7].id,
        sort: 'chart.metadata.appVersion',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[8].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );
};

const getObjectMetadata = (release: HelmRelease) => ({
  name: release.name,
});

const HelmReleaseList: FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const namespace = params.ns;
  const secretsCountRef = useRef<number>(0);
  const [releasesLoaded, setReleasesLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>();
  const [releases, setReleases] = useState<HelmRelease[]>([]);
  const secretResource = useMemo(
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

  useEffect(() => {
    setReleasesLoaded(false);
    secretsCountRef.current = 0;
  }, [namespace]);

  useEffect(() => {
    let destroyed = false;
    if (secretsLoaded && !secretsLoadError) {
      if (newCount === 0) {
        setLoadError(null);
        setReleasesLoaded(true);
        setReleases([]);
      } else if (newCount !== secretsCountRef.current) {
        setReleasesLoaded(false);
        fetchHelmReleases(namespace, true)
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

  const columns = useHelmReleasesColumns();

  const helmReleaseStatusFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    return SelectedReleaseStatuses.map((status) => ({
      value: status,
      label: HelmReleaseStatusLabels[status],
    }));
  }, []);

  const initialFilters = useMemo(() => ({ ...initialFiltersDefault, status: [] }), []);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('helm-plugin~Status')}
        placeholder={t('helm-plugin~Filter by status')}
        options={helmReleaseStatusFilterOptions}
      />,
    ],
    [helmReleaseStatusFilterOptions, t],
  );

  const matchesAdditionalFilters = useCallback(
    (release: HelmRelease, filters: HelmReleaseFilters) =>
      filters.status.length === 0 ||
      filters.status.includes(
        String(
          helmReleaseStatusFilterOptions.find(
            (option) => option.value === releaseStatusReducer(release),
          )?.value,
        ),
      ),
    [helmReleaseStatusFilterOptions],
  );

  const isLoaded = secretsLoaded && releasesLoaded && newCount === secretsCountRef.current;
  const hasNoReleases = isLoaded && releases.length === 0 && !loadError && !secretsLoadError;

  const emptyState = () => {
    const isHelmEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    const installURL = {
      pathname: `/catalog/ns/${namespace || 'default'}`,
      search: '?catalogType=HelmChart',
    };
    return (
      <EmptyState
        headingLevel="h3"
        icon={HelmCatalogIcon}
        titleText={<>{t('helm-plugin~No Helm Releases found')}</>}
        variant={EmptyStateVariant.full}
      >
        <EmptyStateFooter>
          {isHelmEnabled ? (
            <EmptyStateActions>
              <Link to={installURL}>
                {t('helm-plugin~Browse the catalog to discover available Helm Charts')}
              </Link>
            </EmptyStateActions>
          ) : null}
        </EmptyStateFooter>
      </EmptyState>
    );
  };

  return (
    <>
      <DocumentTitle>{t('helm-plugin~Helm Releases')}</DocumentTitle>
      <PaneBody>
        <Suspense fallback={<LoadingBox />}>
          {hasNoReleases ? (
            emptyState()
          ) : (
            <ConsoleDataView<HelmRelease, { obj: HelmRelease }, HelmReleaseFilters>
              label={t('helm-plugin~Helm Releases')}
              data={releases}
              loaded={isLoaded}
              loadError={secretsLoadError || loadError}
              columns={columns}
              initialFilters={initialFilters}
              additionalFilterNodes={additionalFilterNodes}
              getObjectMetadata={getObjectMetadata}
              matchesAdditionalFilters={matchesAdditionalFilters}
              getDataViewRows={getDataViewRows}
              hideLabelFilter
              hideColumnManagement
            />
          )}
        </Suspense>
      </PaneBody>
    </>
  );
};

export default HelmReleaseList;
