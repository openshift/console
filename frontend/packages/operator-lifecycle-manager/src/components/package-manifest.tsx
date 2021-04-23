import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { Link, match } from 'react-router-dom';
import {
  MultiListPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
  Flatten,
  Filter,
} from '@console/internal/components/factory';
import {
  MsgBox,
  Timestamp,
  ResourceLink,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import i18n from '@console/internal/i18n';
import { MatchExpression, referenceForModel } from '@console/internal/module/k8s';
import { OPERATOR_HUB_LABEL } from '@console/shared';
import { PackageManifestModel, CatalogSourceModel } from '../models';
import { PackageManifestKind, CatalogSourceKind } from '../types';
import { ClusterServiceVersionLogo, visibilityLabel, iconFor, defaultChannelFor } from './index';

const tableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  '',
];

export const PackageManifestTableHeader = () => [
  {
    title: i18n.t('public~Name'),
    sortFunc: 'sortPackageManifestByDefaultChannelName',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: i18n.t('public~Latest version'),
    props: { className: tableColumnClasses[1] },
  },
  {
    title: i18n.t('public~Created'),
    sortField: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
];

export const PackageManifestTableHeaderWithCatalogSource = () => [
  ...PackageManifestTableHeader(),
  {
    title: i18n.t('olm~CatalogSource'),
    sortField: 'status.catalogSource',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
];

export const PackageManifestTableRow: RowFunction<
  PackageManifestKind,
  { catalogSource: CatalogSourceKind }
> = ({ obj: packageManifest, index, key, style, customData }) => {
  const channel = defaultChannelFor(packageManifest);

  const { displayName, version, provider } = channel?.currentCSVDesc;

  return (
    <TableRow id={packageManifest.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
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
            provider={provider.name}
          />
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        {version} ({channel.name})
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={packageManifest.metadata.creationTimestamp} />
      </TableData>
      {!customData.catalogSource && (
        <TableData className={tableColumnClasses[3]}>
          <ResourceLink
            kind={referenceForModel(CatalogSourceModel)}
            name={packageManifest.status?.catalogSource}
            namespace={packageManifest.status?.catalogSourceNamespace}
          />
        </TableData>
      )}
    </TableRow>
  );
};

const PackageManifestListEmptyMessage = () => {
  const { t } = useTranslation();
  return (
    <MsgBox
      title={t('olm~No PackageManifests Found')}
      detail={t('olm~The CatalogSource author has not added any packages.')}
    />
  );
};

export const PackageManifestList = (props: PackageManifestListProps) => {
  const { customData } = props;

  // If the CatalogSource is not present, display PackageManifests along with their CatalogSources (used in PackageManifest Search page)
  const TableHeader = customData.catalogSource
    ? PackageManifestTableHeader
    : PackageManifestTableHeaderWithCatalogSource;

  return (
    <Table
      {...props}
      aria-label="PackageManifests"
      loaded={props.loaded}
      data={props.data || []}
      filters={props.filters}
      Header={TableHeader}
      Row={PackageManifestTableRow}
      EmptyMsg={PackageManifestListEmptyMessage}
      virtualize
    />
  );
};

export const PackageManifestsPage: React.FC<PackageManifestsPageProps> = (props) => {
  const { catalogSource } = props;
  const namespace = _.get(props.match, 'params.ns');

  const flatten: Flatten = (resources) => _.get(resources.packageManifest, 'data', []);

  const helpText = (
    <Trans ns="olm">
      Catalogs are groups of Operators you can make available on the cluster. Use{' '}
      <Link to="/operatorhub">OperatorHub</Link> to subscribe and grant namespaces access to use
      installed Operators.
    </Trans>
  );

  return (
    <MultiListPage
      {...props}
      customData={{ catalogSource }}
      namespace={namespace}
      showTitle={false}
      helpText={helpText}
      ListComponent={PackageManifestList}
      textFilter="packagemanifest-name"
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
  match?: match<{ ns?: string }>;
};

export type PackageManifestListProps = {
  customData?: { catalogSource: CatalogSourceKind };
  namespace?: string;
  data: PackageManifestKind[];
  filters?: Filter[];
  loaded: boolean;
  loadError?: string | Record<string, any>;
  showDetailsLink?: boolean;
};

PackageManifestTableHeader.displayName = 'PackageManifestTableHeader';
PackageManifestTableHeaderWithCatalogSource.displayName =
  'PackageManifestTableHeaderWithCatalogSource';
PackageManifestList.displayName = 'PackageManifestList';
