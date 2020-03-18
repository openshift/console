import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from './types';
import { referenceForProvidedAPI, providedAPIsFor } from './components';
import * as operatorLogo from './operator.svg';

const isInternal = (crd: { name: string }): boolean => {
  const internalOpListString = _.get(
    crd,
    ['csv', 'metadata', 'annotations', 'operators.operatorframework.io/internal-objects'],
    '[]',
  );
  try {
    const internalOpList = JSON.parse(internalOpListString); // JSON.parse fails if incorrect annotation structure
    return internalOpList.some((op) => op === crd.name);
  } catch {
    /* eslint-disable-next-line no-console */
    console.error('Failed to parse CSV annotation: Invalid JSON structure');
    return false;
  }
};
export const normalizeClusterServiceVersions = (
  clusterServiceVersions: ClusterServiceVersionKind[],
): K8sResourceKind[] => {
  const imgFor = (desc) =>
    _.get(desc.csv, 'spec.icon')
      ? `data:${_.get(desc.csv, 'spec.icon', [])[0].mediatype};base64,${
          _.get(desc.csv, 'spec.icon', [])[0].base64data
        }`
      : operatorLogo;

  const formatTileDescription = (csvDescription: string): string =>
    `## Operator Description\n${csvDescription}`;

  const operatorProvidedAPIs: K8sResourceKind[] = _.flatten(
    clusterServiceVersions.map((csv) => providedAPIsFor(csv).map((desc) => ({ ...desc, csv }))),
  )
    .reduce(
      (all, cur) =>
        all.find((v) => referenceForProvidedAPI(v) === referenceForProvidedAPI(cur))
          ? all
          : all.concat([cur]),
      [],
    )
    // remove internal CRDs
    .filter((crd) => !isInternal(crd))
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
      tileName: desc.displayName,
      tileIconClass: null,
      capabilityLevel: _.get(desc, ['csv', 'metadata', 'annotations', 'capabilities'], '')
        .toLowerCase()
        .replace(/\s/g, ''),
      tileImgUrl: imgFor(desc),
      tileDescription: desc.description,
      markdownDescription: formatTileDescription(desc.csv.spec.description),
      tileProvider: desc.csv.spec.provider.name,
      tags: desc.csv.spec.keywords,
      createLabel: 'Create',
      href: `/ns/${desc.csv.metadata.namespace}/clusterserviceversions/${
        desc.csv.metadata.name
      }/${referenceForProvidedAPI(desc)}/~new`,
      supportUrl: desc.csv.metadata.annotations?.['marketplace.openshift.io/support-workflow'],
      longDescription: `This resource is provided by ${desc.csv.spec.displayName}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.`,
      documentationUrl: _.get(
        (desc.csv.spec.links || []).find(({ name }) => name === 'Documentation'),
        'url',
      ),
    }));

  return operatorProvidedAPIs;
};
