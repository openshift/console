import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from './types';
import { referenceForProvidedAPI, providedAPIsFor } from './components';
import * as operatorLogo from './operator.svg';

export const normalizeClusterServiceVersions = (
  clusterServiceVersions: ClusterServiceVersionKind[],
): K8sResourceKind[] => {
  const imgFor = (desc) =>
    _.get(desc.csv, 'spec.icon')
      ? `data:${_.get(desc.csv, 'spec.icon', [])[0].mediatype};base64,${
          _.get(desc.csv, 'spec.icon', [])[0].base64data
        }`
      : operatorLogo;

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
      tileImgUrl: imgFor(desc),
      tileDescription: desc.description,
      tileProvider: desc.csv.spec.provider.name,
      tags: desc.csv.spec.keywords,
      createLabel: 'Create',
      href: `/ns/${desc.csv.metadata.namespace}/clusterserviceversions/${
        desc.csv.metadata.name
      }/${referenceForProvidedAPI(desc)}/~new`,
      supportUrl: null,
      longDescription: `This resource is provided by ${
        desc.csv.spec.displayName
      }, a Kubernetes Operator enabled by the Operator Lifecycle Manager.`,
      documentationUrl: _.get(
        (desc.csv.spec.links || []).find(({ name }) => name === 'Documentation'),
        'url',
      ),
    }));

  return operatorProvidedAPIs;
};
