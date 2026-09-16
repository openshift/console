import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  ExtensionHook,
  CatalogItem,
  CatalogItemDetailsDescription,
  CatalogItemDetailsProperty,
} from '@console/dynamic-plugin-sdk';
import { k8sList } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { ExpandCollapse } from '@console/internal/components/utils';
import { getImageForCSVIcon } from '@console/shared';
import { providedAPIsForCSV, referenceForProvidedAPI } from '../components';
import { GLOBAL_COPIED_CSV_NAMESPACE, GLOBAL_OPERATOR_NAMESPACES } from '../const';
import { ClusterServiceVersionModel } from '../models';
import { ProvidedAPI, ClusterServiceVersionKind } from '../types';

type ExpandCollapseDescriptionProps = {
  children: React.ReactNode;
};

export const ExpandCollapseDescription: React.FC<ExpandCollapseDescriptionProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const toggle = (isExpanded) => {
    setExpanded(isExpanded);
  };
  return (
    <ExpandCollapse
      textExpanded={t('olm~Hide operator description')}
      textCollapsed={t('olm~Show operator description')}
      onToggle={toggle}
    >
      {/** used an empty Fragment here because Expandable always expects a children, using null throws react warning */}
      {expanded ? children : <></>}
    </ExpandCollapse>
  );
};

const normalizeClusterServiceVersions = (
  clusterServiceVersions: ClusterServiceVersionKind[],
  namespace: string,
  t: TFunction,
): CatalogItem[] => {
  const formatTileDescription = (csvDescription: string): string =>
    `## ${t('olm~Operator description')}\n${csvDescription}`;

  const operatorProvidedAPIs: CatalogItem[] = _.flatten<
    ProvidedAPI & { csv: ClusterServiceVersionKind }
  >(clusterServiceVersions.map((csv) => providedAPIsForCSV(csv).map((desc) => ({ ...desc, csv }))))
    .reduce<(ProvidedAPI & { csv: ClusterServiceVersionKind })[]>(
      (all, cur) =>
        all.find((v) => referenceForProvidedAPI(v) === referenceForProvidedAPI(cur))
          ? all
          : all.concat([cur]),
      [],
    )
    .map<CatalogItem>((desc) => {
      const { creationTimestamp } = desc.csv.metadata;
      const uid = `${desc.csv.metadata.uid}-${desc.displayName}`;
      const { description } = desc;
      const provider = desc.csv.spec.provider?.name;
      const operatorName = desc.csv.spec.displayName;
      const supportUrl =
        desc.csv.metadata.annotations?.['marketplace.openshift.io/support-workflow'];
      const markdownDescription = formatTileDescription(desc.csv.spec.description);
      const longDescription = t(
        'olm~This resource is provided by {{operatorName}}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.',
        { operatorName },
      );
      const documentationUrl = _.get(
        (desc.csv.spec.links || []).find(({ linkName }) => linkName === 'Documentation'),
        'url',
      );
      const capabilityLevel = _.get(desc, ['csv', 'metadata', 'annotations', 'capabilities'], '')
        .toLowerCase()
        .replace(/\s/g, '');

      const detailsProperties: CatalogItemDetailsProperty[] = [
        {
          label: t('olm~Capability level'),
          value: capabilityLevel,
        },
      ];

      const operatorDescription = (
        <ExpandCollapseDescription>
          <SyncMarkdownView content={markdownDescription} />
        </ExpandCollapseDescription>
      );

      const detailsDescriptions: CatalogItemDetailsDescription[] = [
        {
          value: <p>{description}</p>,
        },
        {
          value: <p>{longDescription}</p>,
        },
        {
          value: operatorDescription,
        },
      ];

      return {
        // NOTE: Faking a real k8s object to avoid fetching all CRDs
        uid,
        type: 'OperatorBackedService',
        name: desc.displayName || desc.kind,
        description,
        provider,
        tags: desc.csv.spec.keywords,
        creationTimestamp,
        supportUrl,
        documentationUrl,
        attributes: {
          operatorName,
        },
        icon: {
          class: null,
          url: getImageForCSVIcon(desc.csv.spec.icon?.[0]),
        },
        cta: {
          label: t('public~Create'),
          href: `/k8s/ns/${namespace}/clusterserviceversions/${
            desc.csv.metadata.name
          }/${referenceForProvidedAPI(desc)}/~new`,
        },
        details: {
          properties: detailsProperties,
          descriptions: detailsDescriptions,
        },
        data: desc,
      };
    });

  return operatorProvidedAPIs;
};

const useClusterServiceVersions: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [csvs, setCsvs] = React.useState<ClusterServiceVersionKind[]>([]);
  const [globalCsvs, setGlobalCsvs] = React.useState<ClusterServiceVersionKind[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<any>(undefined);

  React.useEffect(() => {
    setLoaded(false);
    setLoadError(undefined);

    const fetchCsvs = k8sList(ClusterServiceVersionModel, {
      ns: namespace,
    }).then((items) => setCsvs(items as ClusterServiceVersionKind[]));

    // When copiedCSVsDisabled, OLM no longer copies CSVs to every namespace.
    // Fetch from the global namespace so operators installed cluster-wide are visible.
    const fetchGlobalCsvs =
      window.SERVER_FLAGS.copiedCSVsDisabled && !GLOBAL_OPERATOR_NAMESPACES.includes(namespace)
        ? k8sList(ClusterServiceVersionModel, {
            ns: GLOBAL_COPIED_CSV_NAMESPACE,
          }).then((items) => setGlobalCsvs(items as ClusterServiceVersionKind[]))
        : Promise.resolve();

    Promise.all([fetchCsvs, fetchGlobalCsvs])
      .then(() => setLoaded(true))
      .catch((err) => {
        setLoadError(err);
        setLoaded(true);
      });
  }, [namespace]);

  const normalizedCSVs = React.useMemo(
    () => normalizeClusterServiceVersions([...csvs, ...globalCsvs], namespace, t),
    [csvs, globalCsvs, namespace, t],
  );

  return [normalizedCSVs, loaded, loadError];
};

export default useClusterServiceVersions;
