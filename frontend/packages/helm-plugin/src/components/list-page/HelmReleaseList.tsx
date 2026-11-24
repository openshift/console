import type { FC } from 'react';
import { useMemo, useState, useEffect, useCallback, Suspense, useRef } from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/esm/DataViewFilters';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  ResourceFilters,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { isCatalogTypeEnabled } from '@console/shared/src/components/catalog/utils/catalog-utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { HELM_CHART_CATALOG_TYPE_ID } from '../../const';
import type { HelmRelease } from '../../types/helm-types';
import {
  fetchHelmReleases,
  HelmReleaseStatusLabels,
  releaseStatusReducer,
  SelectedReleaseStatuses,
} from '../../utils/helm-utils';
import { HelmCatalogIcon } from '../../utils/icons';
import { getDataViewRows, tableColumnInfo } from './HelmReleaseListRow';

type HelmReleaseFilters = ResourceFilters & { status: string[] };

const useHelmReleasesColumns = (): {
  columns: ConsoleDataViewColumn<HelmRelease>[];
} => {
  const { t } = useTranslation('helm-plugin');

  const columns = useMemo<ConsoleDataViewColumn<HelmRelease>[]>(
    () => [
      {
        type: 'name' as const,
        id: tableColumnInfo[0].id,
        sort: 'name',
      },
      {
        type: 'namespace' as const,
        id: tableColumnInfo[1].id,
        sort: 'namespace',
      },
      {
        title: t('Revision'),
        id: tableColumnInfo[2].id,
        sort: 'version',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Updated'),
        id: tableColumnInfo[3].id,
        sort: 'info.last_deployed',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Status'),
        id: tableColumnInfo[4].id,
        sort: 'info.status',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Chart name'),
        id: tableColumnInfo[5].id,
        sort: 'chart.metadata.name',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Chart version'),
        id: tableColumnInfo[6].id,
        sort: 'chart.metadata.version',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('App version'),
        id: tableColumnInfo[7].id,
        sort: 'chart.metadata.appVersion',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      { type: 'actions' as const, id: tableColumnInfo[8].id },
    ],
    [t],
  );

  return { columns };
};

const getObjectMetadata = (release: HelmRelease) => ({
  name: release.name,
});

const HelmReleaseList: FC<{ mock?: boolean }> = ({ mock }) => {
  const { t } = useTranslation('helm-plugin');
  const params = useParams();
  const namespace = params.ns;
  const [loadError, setLoadError] = useState<string>();
  const [releases, setReleases] = useState<HelmRelease[]>([]);
  // Secret count that the stored releases (or load error) belong to. It is
  // compared against the live watch count so results are only shown as
  // loaded when they match the secrets the watch currently reports.
  const [fetchedCount, setFetchedCount] = useState<number>(0);
  // Last count/namespace a fetch was started for; tracked separately from completed results.
  const requestedCountRef = useRef<number>(0);
  const requestedNamespaceRef = useRef<string>(null);
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
    mock ? null : secretResource,
  );
  const newCount = secretsData?.length ?? 0;

  const noReleases = secretsLoaded && !secretsLoadError && newCount === 0;

  const [prevNamespace, setPrevNamespace] = useState(namespace);
  if (prevNamespace !== namespace) {
    setPrevNamespace(namespace);
    setFetchedCount(0);
  }
  const [prevNoReleases, setPrevNoReleases] = useState(noReleases);
  if (prevNoReleases !== noReleases) {
    setPrevNoReleases(noReleases);
    if (noReleases) {
      // Nothing to fetch for an empty namespace; clear previous results so
      // the empty state shows and a later secret triggers a fresh fetch.
      setFetchedCount(0);
      setReleases([]);
      setLoadError(undefined);
    }
  }

  useEffect(() => {
    // A request identity recorded for another namespace is stale: the
    // namespace change reset fetchedCount, so returning to the earlier
    // namespace must refetch even when the count matches.
    if (requestedNamespaceRef.current !== namespace) {
      requestedCountRef.current = 0;
      requestedNamespaceRef.current = null;
    }
    if (!secretsLoaded || secretsLoadError) {
      return;
    }
    if (newCount === 0) {
      // Empty namespace: forget the last request so later secrets trigger a fresh fetch.
      requestedCountRef.current = 0;
      return;
    }
    if (newCount === requestedCountRef.current && namespace === requestedNamespaceRef.current) {
      return;
    }
    requestedCountRef.current = newCount;
    requestedNamespaceRef.current = namespace;
    let destroyed = false;
    let completed = false;
    fetchHelmReleases(namespace, true)
      .then((helmReleases) => {
        if (!destroyed) {
          completed = true;
          setFetchedCount(newCount);
          setReleases(helmReleases);
          setLoadError(undefined);
        }
      })
      .catch((err) => {
        if (!destroyed) {
          completed = true;
          setFetchedCount(newCount);
          setLoadError(err.message || t('Unable to load Helm releases'));
        }
      });
    return () => {
      destroyed = true;
      // A request discarded in flight never recorded its result; clear its
      // identity so the same count/namespace fetches again after recovery.
      if (!completed) {
        requestedCountRef.current = 0;
        requestedNamespaceRef.current = null;
      }
    };
  }, [namespace, newCount, secretsLoadError, secretsLoaded, t]);

  const { columns } = useHelmReleasesColumns();

  const helmReleaseStatusFilterOptions = useMemo<DataViewFilterOption[]>(
    () =>
      SelectedReleaseStatuses.map((status) => ({
        value: status,
        label: HelmReleaseStatusLabels[status],
      })),
    [],
  );

  const initialFilters = useMemo<HelmReleaseFilters>(() => ({ status: [] }), []);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('Status')}
        placeholder={t('Filter by status')}
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

  const isLoaded = secretsLoaded && (noReleases || newCount === fetchedCount);
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
        titleText={<>{t('No Helm releases found')}</>}
        variant={EmptyStateVariant.full}
      >
        <EmptyStateFooter>
          {isHelmEnabled ? (
            <EmptyStateActions>
              <Link to={installURL}>
                {t('Browse the catalog to discover available Helm Charts')}
              </Link>
            </EmptyStateActions>
          ) : null}
        </EmptyStateFooter>
      </EmptyState>
    );
  };

  return (
    <>
      <DocumentTitle>{t('Helm releases')}</DocumentTitle>
      <PaneBody>
        <Suspense fallback={<LoadingBox />}>
          {!mock && hasNoReleases ? (
            emptyState()
          ) : (
            <ConsoleDataView<HelmRelease, { obj: HelmRelease }, HelmReleaseFilters>
              id="console.ui~v1~HelmRelease"
              label={t('Helm releases')}
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
              mock={mock}
            />
          )}
        </Suspense>
      </PaneBody>
    </>
  );
};

export default HelmReleaseList;
