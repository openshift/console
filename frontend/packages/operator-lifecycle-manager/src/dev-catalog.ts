import * as _ from 'lodash';
import i18n from '@console/internal/i18n';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from './types';
import { referenceForProvidedAPI, providedAPIsForCSV } from './components';
import * as operatorLogo from './operator.svg';

export const normalizeClusterServiceVersions = (
  clusterServiceVersions: ClusterServiceVersionKind[],
): K8sResourceKind[] => {
  const imgFor = (desc) =>
    desc.csv?.spec?.icon?.[0]
      ? `data:${desc.csv.spec.icon[0].mediatype};base64,${desc.csv.spec.icon[0].base64data}`
      : operatorLogo;

  const formatTileDescription = (csvDescription: string): string =>
    `## ${i18n.t('olm~Operator description')}\n${csvDescription}`;

  const operatorProvidedAPIs: K8sResourceKind[] = _.flatten(
    clusterServiceVersions.map((csv) => providedAPIsForCSV(csv).map((desc) => ({ ...desc, csv }))),
  )
    .reduce(
      (all, cur) =>
        all.find((v) => referenceForProvidedAPI(v) === referenceForProvidedAPI(cur))
          ? all
          : all.concat([cur]),
      [],
    )
    .map((desc) => ({
      // NOTE: Faking a real k8s object to avoid fetching all CRDs
      obj: {
        metadata: {
          uid: `${desc.csv.metadata.uid}-${desc.displayName}`,
          creationTimestamp: desc.csv.metadata.creationTimestamp,
        },
        ...desc,
      },
      kind: 'InstalledOperator',
      tileName: desc.displayName || desc.kind,
      tileIconClass: null,
      capabilityLevel: (desc?.csv?.metadata?.annotations?.capabilities ?? '')
        .toLowerCase()
        .replace(/\s/g, ''),
      tileImgUrl: imgFor(desc),
      tileDescription: desc.description,
      markdownDescription: formatTileDescription(desc.csv.spec.description),
      tileProvider: desc.csv.spec.provider.name,
      tags: desc.csv.spec.keywords,
      createLabel: i18n.t('public~Create'),
      href: `/k8s/ns/${desc.csv.metadata.namespace}/clusterserviceversions/${
        desc.csv.metadata.name
      }/${referenceForProvidedAPI(desc)}/~new`,
      supportUrl: desc.csv.metadata.annotations?.['marketplace.openshift.io/support-workflow'],
      longDescription: i18n.t(
        'olm~This resource is provided by {{displayName}}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.',
        {
          displayName: desc.csv.spec.displayName,
        },
      ),
      documentationUrl: (desc.csv.spec.links || []).find(({ name }) => name === 'Documentation')
        ?.url,
    }));

  return operatorProvidedAPIs;
};
