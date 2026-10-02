import type { FC } from 'react';
import { useMemo } from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router';
import {
  ConsoleDataView,
  getNameCellProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Flatten } from '@console/internal/components/factory/list-page';
import { MultiListPage } from '@console/internal/components/factory/list-page';
import type { Filter } from '@console/internal/components/factory/table';
import {
  ResourceLink,
  resourcePathFromModel,
} from '@console/internal/components/utils/resource-link';
import type { MatchExpression } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ConsoleEmptyState } from '@console/shared/src/components/empty-state/ConsoleEmptyState';
import { OPERATOR_HUB_LABEL } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { CLASSIC_CATALOG_PATH } from '../const';
import { PackageManifestModel, CatalogSourceModel } from '../models';
import type { PackageManifestKind, CatalogSourceKind } from '../types';
import { ClassicOperatorMigrationAlert } from './classic-operators/ClassicOperatorMigrationAlert';
import { ClusterServiceVersionLogo } from './cluster-service-version-logo';
import { sortByValue } from './dataViewSortHelpers';
import { visibilityLabel, iconFor, defaultChannelFor } from './index';

/** The name shown for a PackageManifest is the display name of its default channel's CSV. */
const displayNameFor = (packageManifest: PackageManifestKind): string =>
  defaultChannelFor(packageManifest)?.currentCSVDesc?.displayName || packageManifest.metadata.name;

const getPackageManifestMetadata = (packageManifest: PackageManifestKind) => ({
  name: displayNameFor(packageManifest),
  labels: packageManifest.metadata?.labels,
});

/**
 * Columns for the PackageManifest table. The CatalogSource column is only shown when the table is
 * not already scoped to a single CatalogSource.
 * @param hasCatalogSource - Whether the list is scoped to one CatalogSource.
 */
export const usePackageManifestColumns = (
  hasCatalogSource: boolean,
): {
  columns: ConsoleDataViewColumn<PackageManifestKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('olm');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(PackageManifestModel);
  const columns = useMemo(
    () => [
      {
        id: 'name',
        resizableProps: getResizableProps('name'),
        title: t('Name'),
        sort: sortByValue<PackageManifestKind>(displayNameFor),
        props: getNameColumnProps(),
      },
      {
        id: 'latestVersion',
        resizableProps: getResizableProps('latestVersion'),
        title: t('Latest version'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'created',
        resizableProps: getResizableProps('created'),
        title: t('Created'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      // Displaying the CatalogSource is redundant when the list is already scoped to one.
      ...(hasCatalogSource
        ? []
        : [
            {
              id: 'catalogsource',
              resizableProps: getResizableProps('catalogsource'),
              title: t('CatalogSource'),
              sort: 'status.catalogSource',
              props: { modifier: 'nowrap' as const },
            },
          ]),
    ],
    [t, getResizableProps, hasCatalogSource],
  );
  return { columns, resetAllColumnWidths };
};

export const getPackageManifestDataViewRows: GetDataViewRows<PackageManifestKind> = (
  data,
  columns,
) =>
  data.map(({ obj: packageManifest }) => {
    const channel = defaultChannelFor(packageManifest);
    const { displayName, version, provider } = channel?.currentCSVDesc ?? {};
    const rowCells = {
      name: {
        cell: (
          <Link
            to={resourcePathFromModel(
              PackageManifestModel,
              packageManifest.metadata.name,
              packageManifest.metadata.namespace,
            )}
          >
            <ClusterServiceVersionLogo
              displayName={displayName}
              icon={iconFor(packageManifest)}
              provider={provider?.name}
            />
          </Link>
        ),
        props: getNameCellProps(packageManifest.metadata.name),
      },
      latestVersion: {
        cell: (
          <>
            {version} ({channel?.name})
          </>
        ),
      },
      created: { cell: <Timestamp timestamp={packageManifest.metadata.creationTimestamp} /> },
      catalogsource: {
        cell: (
          <ResourceLink
            kind={referenceForModel(CatalogSourceModel)}
            name={packageManifest.status?.catalogSource}
            namespace={packageManifest.status?.catalogSourceNamespace}
          />
        ),
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const PackageManifestListEmptyMessage = () => {
  const { t } = useTranslation('olm');
  return (
    <ConsoleEmptyState title={t('No PackageManifests Found')}>
      {t('The CatalogSource author has not added any packages.')}
    </ConsoleEmptyState>
  );
};

const PackageManifestList: FC<PackageManifestListProps> = (props) => {
  const { t } = useTranslation('olm');
  // If the CatalogSource is not present, display PackageManifests along with their CatalogSources (used in PackageManifest Search page)
  const hasCatalogSource = !!props.customData?.catalogSource;
  const { columns, resetAllColumnWidths } = usePackageManifestColumns(hasCatalogSource);

  // ConsoleDataView has a generic empty body state, so keep the CatalogSource-specific wording by
  // short-circuiting when nothing loaded at all. Filtering down to zero rows still uses the table.
  if (props.loaded && !props.loadError && props.data?.length === 0) {
    return <PackageManifestListEmptyMessage />;
  }

  return (
    <ConsoleDataView<PackageManifestKind>
      {...props}
      label={t('PackageManifests')}
      data={props.data || []}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getPackageManifestDataViewRows}
      getObjectMetadata={getPackageManifestMetadata}
      hideColumnManagement
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};

export const PackageManifestsPage: FC<PackageManifestsPageProps> = (props) => {
  const { catalogSource, showMigrationAlert = true } = props;
  const { ns: namespace } = useParams();
  const techPreview = useFlag(FLAG_TECH_PREVIEW);

  const flatten: Flatten = (resources) => _.get(resources.packageManifest, 'data', []);

  // Outside Tech Preview there is only one operator catalog, so it keeps its generic name.
  const helpText = techPreview ? (
    <Trans ns="olm">
      Catalogs are groups of Operators you can make available on the cluster. Use the{' '}
      <Link to={CLASSIC_CATALOG_PATH}>Classic Operators catalog</Link> to subscribe and grant
      namespaces access to use installed Operators.
    </Trans>
  ) : (
    <Trans ns="olm">
      Catalogs are groups of Operators you can make available on the cluster. Use the{' '}
      <Link to={CLASSIC_CATALOG_PATH}>Software Catalog</Link> to subscribe and grant namespaces
      access to use installed Operators.
    </Trans>
  );

  const customData = useMemo(
    () => ({
      catalogSource,
    }),
    [catalogSource],
  );

  return (
    <MultiListPage
      {...props}
      helpAlert={showMigrationAlert ? <ClassicOperatorMigrationAlert /> : undefined}
      customData={customData}
      namespace={namespace}
      showTitle={false}
      helpText={helpText}
      ListComponent={PackageManifestList}
      omitFilterToolbar
      flatten={flatten}
      resources={[
        {
          kind: referenceForModel(PackageManifestModel),
          isList: true,
          namespaced: true,
          prop: 'packageManifest',
          selector: {
            matchExpressions: [
              ...((catalogSource
                ? [
                    {
                      key: 'catalog',
                      operator: 'In',
                      values: [catalogSource?.metadata.name],
                    },
                    {
                      key: 'catalog-namespace',
                      operator: 'In',
                      values: [catalogSource?.metadata.namespace],
                    },
                  ]
                : []) as MatchExpression[]),
              { key: visibilityLabel, operator: 'DoesNotExist' },
              { key: OPERATOR_HUB_LABEL, operator: 'DoesNotExist' },
            ],
          },
        },
      ]}
    />
  );
};

export type PackageManifestsPageProps = {
  catalogSource: CatalogSourceKind;
  namespace?: string;
  /** Off when nested in a page that already warns, such as the CatalogSource details tabs. */
  showMigrationAlert?: boolean;
};

type PackageManifestListProps = {
  customData?: { catalogSource: CatalogSourceKind };
  namespace?: string;
  data: PackageManifestKind[];
  filters?: Filter[];
  loaded: boolean;
  loadError?: string | Record<string, any>;
  showDetailsLink?: boolean;
};

PackageManifestList.displayName = 'PackageManifestList';
